import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { parseSheetDate, laDate } from '../../shared/sheetUtils.ts';

// Syncs lab results from the patient's tracking spreadsheet into LabResult records.
// Sheet "Labs" tab columns:
// A=Date, B=Creatinine, C=BUN, D=Potassium, E=Hemoglobin, F=Calcium,
// G=Phosphorus, H=PTH, I=Albumin, J=eGFR, K=Notes
const SPREADSHEET_ID = "1NqLgMVsjvpniEwrDGaN1bZhl0iz83N5EZA1kKkZ0sKA";
const SHEET_NAME = "Labs";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const startDate = body.start_date || "2026-01-01";
    const onlyNulls = body.only_nulls !== false;

    const { accessToken } = await base44.asServiceRole.connectors.getConnection("googlesheets");

    const range = `'${SHEET_NAME}'!A1:K400`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) return Response.json({ error: `Sheet fetch failed: ${res.status}` }, { status: 502 });
    const data = await res.json();
    const rows = data.values || [];

    // Map sheet date -> lab values
    const sheetMap: Record<string, any> = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const date = parseSheetDate(row[0]);
      if (!date || date < startDate) continue;
      const vals: any = {};
      const fields = ["creatinine", "bun", "potassium", "hemoglobin", "calcium", "phosphorus", "pth", "albumin", "egfr"];
      let hasAny = false;
      for (let j = 0; j < fields.length; j++) {
        const raw = row[j + 1];
        if (raw != null && raw !== "") {
          const num = parseFloat(raw);
          if (!isNaN(num)) { vals[fields[j]] = num; hasAny = true; }
        }
      }
      if (row[10]) vals.notes = String(row[10]);
      if (!hasAny && !vals.notes) continue;
      sheetMap[date] = vals;
    }

    // Fetch existing labs and group by date
    const labs = await base44.asServiceRole.entities.LabResult.filter({ date: { $gte: startDate } }, "-date", 500);
    const existingByDate: Record<string, any[]> = {};
    for (const l of labs) {
      const d = l.date || laDate(l.created_date);
      if (d) {
        if (!existingByDate[d]) existingByDate[d] = [];
        existingByDate[d].push(l);
      }
    }

    const toCreate: any[] = [];
    const toUpdate: any[] = [];

    for (const [date, sv] of Object.entries(sheetMap)) {
      if (date < startDate) continue;
      const existingRecords = existingByDate[date];

      if (!existingRecords || existingRecords.length === 0) {
        toCreate.push({ date, ...sv });
      } else {
        for (const existing of existingRecords) {
          const patch: any = {};
          const fields = ["creatinine", "bun", "potassium", "hemoglobin", "calcium", "phosphorus", "pth", "albumin", "egfr", "notes"];
          for (const f of fields) {
            if (onlyNulls) {
              if (existing[f] == null && sv[f] != null) patch[f] = sv[f];
            } else {
              if (sv[f] != null && existing[f] !== sv[f]) patch[f] = sv[f];
            }
          }
          if (!Object.keys(patch).length) continue;
          toUpdate.push({ id: existing.id, ...patch });
        }
      }
    }

    const created = toCreate.length ? await base44.asServiceRole.entities.LabResult.bulkCreate(toCreate) : [];
    const updated = toUpdate.length ? await base44.asServiceRole.entities.LabResult.bulkUpdate(toUpdate) : [];

    return Response.json({
      created_count: toCreate.length,
      updated_count: toUpdate.length,
      sheet_rows_in_range: Object.keys(sheetMap).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}