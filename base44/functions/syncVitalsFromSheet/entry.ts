import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { parseSheetDate, laDate } from '../../shared/sheetUtils.ts';

// Syncs vitals (weight, BP) from the patient's tracking spreadsheet into VitalSign records.
// Sheet columns: A=Date, B=Weight(lbs), C=BP Systolic, D=BP Diastolic
const SPREADSHEET_ID = "1NqLgMVsjvpniEwrDGaN1bZhl0iz83N5EZA1kKkZ0sKA";
const SHEET = "2026";

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
    const range = `${SHEET}!A1:D400`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    const data = await res.json();
    if (!res.ok) return Response.json({ error: 'Sheets API error', details: data }, { status: 502 });

    const rows = data.values || [];
    // Map sheet date -> { weight_lbs, systolic_bp, diastolic_bp }
    const sheetMap = {};
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const date = parseSheetDate(row[0]);
      if (!date || date < startDate) continue;
      const weight = row[1] ? parseFloat(row[1]) : null;
      const sys = row[2] ? parseInt(row[2], 10) : null;
      const dia = row[3] ? parseInt(row[3], 10) : null;
      if (weight == null && sys == null && dia == null) continue;
      sheetMap[date] = { weight_lbs: weight, systolic_bp: sys, diastolic_bp: dia };
    }

    // Fetch all existing vitals and index by measured_at date
    const vitals = await base44.asServiceRole.entities.VitalSign.list('-created_date', 500);
    const existingByDate = {};
    for (const v of vitals) {
      const d = laDate(v.measured_at || v.created_date);
      if (d) existingByDate[d] = v;
    }

    const toCreate = [];
    const toUpdate = [];
    const created = [];
    const updated = [];

    for (const [date, sv] of Object.entries(sheetMap)) {
      if (date < startDate) continue;
      const existing = existingByDate[date];

      if (!existing) {
        toCreate.push({
          measured_at: date,
          weight_lbs: sv.weight_lbs,
          systolic_bp: sv.systolic_bp,
          diastolic_bp: sv.diastolic_bp,
        });
      } else {
        const patch = {};
        if (onlyNulls) {
          if (existing.weight_lbs == null && sv.weight_lbs != null) patch.weight_lbs = sv.weight_lbs;
          if (existing.systolic_bp == null && sv.systolic_bp != null) patch.systolic_bp = sv.systolic_bp;
          if (existing.diastolic_bp == null && sv.diastolic_bp != null) patch.diastolic_bp = sv.diastolic_bp;
        } else {
          if (sv.weight_lbs != null && existing.weight_lbs !== sv.weight_lbs) patch.weight_lbs = sv.weight_lbs;
          if (sv.systolic_bp != null && existing.systolic_bp !== sv.systolic_bp) patch.systolic_bp = sv.systolic_bp;
          if (sv.diastolic_bp != null && existing.diastolic_bp !== sv.diastolic_bp) patch.diastolic_bp = sv.diastolic_bp;
        }
        if (!Object.keys(patch).length) continue;
        toUpdate.push({ id: existing.id, ...patch });
      }
    }

    // Bulk create new records
    if (toCreate.length) {
      await base44.asServiceRole.entities.VitalSign.bulkCreate(toCreate);
      created.push(...toCreate);
    }

    // Bulk update changed records
    if (toUpdate.length) {
      await base44.asServiceRole.entities.VitalSign.bulkUpdate(toUpdate);
      updated.push(...toUpdate);
    }

    return Response.json({
      created_count: created.length,
      updated_count: updated.length,
      created,
      updated,
      sheet_rows_in_range: Object.keys(sheetMap).length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}