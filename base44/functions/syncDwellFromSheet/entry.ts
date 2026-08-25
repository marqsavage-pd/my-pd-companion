import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

// The patient's peritoneal dialysis tracking spreadsheet (monthly tabs: May-26, Jun-26, ...).
// Columns: A=date, K=Init Drain (drain_volume), L=Total UF (ultrafiltration), M=Avg Dwell, N=Lost Dwell.
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
        const drainVol = row[10] ? parseFloat(row[10]) : null;  // column K = Init Drain
        const totalUF = row[11] ? parseFloat(row[11]) : null;    // column L = Total UF
        const dwellMin = parseHMM(row[12]); // column M
        const lostMin = parseHMM(row[13]);  // column N
        // Dextrose concentration from columns H (1.5%), I (2.5%), J (4.25%)
        const concentrations = [];
        if (row[7] && parseFloat(row[7]) > 0) concentrations.push(1.5);
        if (row[8] && parseFloat(row[8]) > 0) concentrations.push(2.5);
        if (row[9] && parseFloat(row[9]) > 0) concentrations.push(4.25);
        const dextrose_concentration = concentrations.length
          ? Math.round((concentrations.reduce((a, b) => a + b, 0) / concentrations.length) * 1000) / 1000
          : null;
        const dextrose_blend = concentrations.length > 1 ? concentrations.join('+') : null;
        const weight = row[1] ? parseFloat(row[1]) : null;
        const bp_systolic = row[2] ? parseFloat(row[2]) : null;
        const bp_diastolic = row[3] ? parseFloat(row[3]) : null;

        sheetMap[date] = {
          dwell_hours: dwellMin != null ? Math.round((dwellMin / 60) * 1000) / 1000 : null,
          lost_dwell: lostMin,
          drain_volume: drainVol,
          ultrafiltration: totalUF,
          dextrose_concentration,
          dextrose_blend,
          weight,
          bp_systolic,
          bp_diastolic
        };
      }
    }

    const exchanges = await base44.asServiceRole.entities.Exchange.filter({ logged_at: { $gte: startDate } }, '-created_date', 500);

    const toUpdate = [];
    const updated = [];
    const unmatched = [];
    const matchedDates = new Set();
    for (const ex of exchanges) {
      const d = laDate(ex.logged_at);
      if (!d || d < startDate) continue;
      const sv = sheetMap[d];
      if (!sv) { unmatched.push({ id: ex.id, date: d }); continue; }
      matchedDates.add(d);

      const needDwell = onlyNulls ? ex.dwell_hours == null : true;
      const needLost = onlyNulls ? ex.lost_dwell == null : true;
      const needDrain = onlyNulls ? ex.drain_volume == null : true;
      const needUF = onlyNulls ? ex.ultrafiltration == null : true;
      if (!needDwell && !needLost && !needDrain && !needUF) continue;

      const patch = {};
      if (needDwell && sv.dwell_hours != null) patch.dwell_hours = sv.dwell_hours;
      if (needLost && sv.lost_dwell != null) patch.lost_dwell = sv.lost_dwell;
      if (needDrain && sv.drain_volume != null) patch.drain_volume = sv.drain_volume;
      if (needUF && sv.ultrafiltration != null) patch.ultrafiltration = sv.ultrafiltration;
      if (!Object.keys(patch).length) continue;

      toUpdate.push({ id: ex.id, ...patch });
      updated.push({ id: ex.id, date: d, ...patch });
    }

    if (toUpdate.length) {
      await base44.asServiceRole.entities.Exchange.bulkUpdate(toUpdate);
    }

    // Create new exchange records for sheet rows with no matching app exchange
    const toCreate = [];
    const created = [];
    for (const [date, sv] of Object.entries(sheetMap)) {
      if (matchedDates.has(date)) continue;
      if (date < startDate) continue;
      // Only create if there's meaningful treatment data (drain > 100 mL)
      if (sv.drain_volume == null || sv.drain_volume < 100) continue;
      if (!sv.dextrose_concentration) continue;

      const fill_volume = (sv.ultrafiltration != null)
        ? Math.max(0, Math.round(sv.drain_volume - sv.ultrafiltration))
        : 0;

      const record = {
        modality: 'apd',
        dextrose_concentration: sv.dextrose_concentration,
        fill_volume,
        drain_volume: sv.drain_volume,
        ultrafiltration: sv.ultrafiltration,
        dwell_hours: sv.dwell_hours,
        lost_dwell: sv.lost_dwell,
        solution_appearance: 'clear',
        logged_at: date,
        weight: sv.weight,
        bp_systolic: sv.bp_systolic,
        bp_diastolic: sv.bp_diastolic
      };
      if (sv.dextrose_blend) record.dextrose_blend = sv.dextrose_blend;

      toCreate.push(record);
      created.push({ date, drain_volume: sv.drain_volume, ultrafiltration: sv.ultrafiltration });
    }

    if (toCreate.length) {
      await base44.asServiceRole.entities.Exchange.bulkCreate(toCreate);
    }

    return Response.json({
      updated_count: updated.length,
      updated,
      created_count: created.length,
      created,
      unmatched_in_range: unmatched,
      sheet_rows_in_range: Object.keys(sheetMap).length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});