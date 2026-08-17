import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// The patient's peritoneal dialysis tracking spreadsheet (monthly tabs: May-26, Jun-26, ...).
// Column A = date (DD-MMM-YY), M = Avg Dwell (H:MM), N = Lost Dwell (H:MM).
const SPREADSHEET_ID = "1NqLgMVsjvpniEwrDGaN1bZhl0iz83N5EZA1kKkZ0sKA";
const SHEETS = ["May-26", "Jun-26", "Jul-26", "Aug-26", "Sep-26", "Oct-26", "Nov-26", "Dec-26"];

const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };

// "15-Jul-26" -> "2026-07-15"
const parseSheetDate = (s) => {
  if (!s) return null;
  const parts = String(s).split('-');
  if (parts.length !== 3) return null;
  const [d, mon, y] = parts;
  if (!MONTHS[mon]) return null;
  return `20${y}-${MONTHS[mon]}-${d.padStart(2, '0')}`;
};

// "1:18" -> 78 (total minutes)
const parseHMM = (s) => {
  if (s === undefined || s === null || s === '') return null;
  const parts = String(s).split(':').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return null;
  return parts[0] * 60 + parts[1];
};

// Exchange logged_at -> local calendar date in the patient's timezone (America/Los_Angeles).
// Stored timestamps are inconsistent: form entries are UTC ("...Z"), imported records are
// bare local strings (no offset) whose date part is already the local date.
const laFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit'
});
const laDate = (iso) => {
  if (!iso) return null;
  if (iso.includes('Z') || /[+-]\d{2}:\d{2}$/.test(iso)) {
    try { return laFormatter.format(new Date(iso)); } catch { return iso.slice(0, 10); }
  }
  return iso.slice(0, 10);
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const startDate = body.start_date || "2026-07-15";
    const onlyNulls = body.only_nulls !== false; // default: only fill gaps, don't overwrite

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");

    // Map sheet date -> { dwell_hours (h), lost_dwell (min) }
    const sheetMap = {};
    for (const sheetName of SHEETS) {
      const range = `'${sheetName}'!A1:N400`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (!res.ok) continue; // skip missing/empty tabs
      const data = await res.json();
      const rows = data.values || [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const date = parseSheetDate(row[0]);
        if (!date || date < startDate) continue;
        const dwellMin = parseHMM(row[12]); // column M
        const lostMin = parseHMM(row[13]);  // column N
        sheetMap[date] = {
          dwell_hours: dwellMin != null ? Math.round((dwellMin / 60) * 1000) / 1000 : null,
          lost_dwell: lostMin
        };
      }
    }

    const exchanges = await base44.asServiceRole.entities.Exchange.filter({ logged_at: { $gte: startDate } }, '-created_date', 500);

    const toUpdate = [];
    const updated = [];
    const unmatched = [];
    for (const ex of exchanges) {
      const d = laDate(ex.logged_at);
      if (!d || d < startDate) continue;
      const sv = sheetMap[d];
      if (!sv) { unmatched.push({ id: ex.id, date: d }); continue; }

      const needDwell = onlyNulls ? ex.dwell_hours == null : true;
      const needLost = onlyNulls ? ex.lost_dwell == null : true;
      if (!needDwell && !needLost) continue;

      const patch = {};
      if (needDwell && sv.dwell_hours != null) patch.dwell_hours = sv.dwell_hours;
      if (needLost && sv.lost_dwell != null) patch.lost_dwell = sv.lost_dwell;
      if (!Object.keys(patch).length) continue;

      toUpdate.push({ id: ex.id, ...patch });
      updated.push({ id: ex.id, date: d, ...patch });
    }

    if (toUpdate.length) {
      await base44.asServiceRole.entities.Exchange.bulkUpdate(toUpdate);
    }

    return Response.json({
      updated_count: updated.length,
      updated,
      unmatched_in_range: unmatched,
      sheet_rows_in_range: Object.keys(sheetMap).length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});