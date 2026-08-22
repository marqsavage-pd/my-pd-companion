// Shared report data gathering — used by getSharedReport backend function
// and could be reused by other report-generating functions.

const symptomLabels: Record<string, string> = {
  nausea: "Nausea", abdominal_pain: "Abdominal Pain", swelling: "Swelling / Edema",
  shortness_of_breath: "Shortness of Breath", fatigue: "Fatigue", fever: "Fever",
  chills: "Chills", constipation: "Constipation", exit_site_redness: "Exit Site Redness",
  exit_site_drainage: "Exit Site Drainage", muscle_cramps: "Muscle Cramps",
  dizziness: "Dizziness", itching: "Itching", poor_appetite: "Poor Appetite",
  sleep_issues: "Sleep Issues", other: "Other",
};

export const labFields = [
  { key: "creatinine", label: "Creatinine", unit: "mg/dL", low: 0.6, high: 1.2 },
  { key: "bun", label: "BUN", unit: "mg/dL", low: 7, high: 20 },
  { key: "potassium", label: "Potassium", unit: "mEq/L", low: 3.5, high: 5.0 },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL", low: 11, high: 12 },
  { key: "calcium", label: "Calcium", unit: "mg/dL", low: 8.4, high: 10.2 },
  { key: "phosphorus", label: "Phosphorus", unit: "mg/dL", low: 3.5, high: 5.5 },
  { key: "pth", label: "PTH", unit: "pg/mL", low: 150, high: 600 },
  { key: "albumin", label: "Albumin", unit: "g/dL", low: 3.5, high: 5.0 },
  { key: "egfr", label: "eGFR", unit: "mL/min", low: 0, high: 15 },
];

export async function gatherReportData(base44, userId, daysWindow = 30) {
  const since = new Date(Date.now() - daysWindow * 86400000).toISOString();
  const [exchanges, vitals, symptoms, labs, notes] = await Promise.all([
    base44.asServiceRole.entities.Exchange.filter({ logged_at: { $gte: since } }, "-logged_at", 500),
    base44.asServiceRole.entities.VitalSign.filter({ measured_at: { $gte: since } }, "-measured_at", 500),
    base44.asServiceRole.entities.Symptom.filter({ logged_at: { $gte: since } }, "-logged_at", 500),
    base44.asServiceRole.entities.LabResult.filter({ created_by_id: userId }, "-date", 100),
    base44.asServiceRole.entities.AppointmentNote.filter({ created_by_id: userId }, "-created_date", 500),
  ]);

  const flagged = notes.filter((n: any) => n.flag_for_review && !n.resolved);

  // Summary stats
  const totalUF = exchanges.reduce((s: number, e: any) => s + (e.ultrafiltration || 0), 0);
  const weights = vitals.map((v: any) => v.weight_lbs).filter(Boolean);
  const avgWeight = weights.length ? (weights.reduce((a: number, b: number) => a + b, 0) / weights.length).toFixed(1) : null;
  const bps = vitals.filter((v: any) => v.systolic_bp);
  const avgSys = bps.length ? Math.round(bps.reduce((a: number, v: any) => a + v.systolic_bp, 0) / bps.length) : null;
  const avgDia = bps.length ? Math.round(bps.reduce((a: number, v: any) => a + v.diastolic_bp, 0) / bps.length) : null;
  const cloudyCount = exchanges.filter((e: any) => e.solution_appearance === "cloudy").length;

  // Lab summary: most recent values + trend
  const sortedLabs = [...labs].sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
  const latestLabs = sortedLabs[0] || null;
  const prevLabs = sortedLabs[1] || null;

  // Symptom frequency
  const symptomCounts: Record<string, number> = {};
  symptoms.forEach((s: any) => { symptomCounts[s.symptom_type] = (symptomCounts[s.symptom_type] || 0) + 1; });
  const rankedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);

  return {
    windowDays: daysWindow,
    generatedAt: new Date().toISOString(),
    exchanges,
    vitals,
    symptoms,
    labs: sortedLabs,
    latestLabs,
    prevLabs,
    flagged,
    summary: {
      exchangeCount: exchanges.length,
      totalUF: Math.round(totalUF),
      avgWeight,
      avgSys,
      avgDia,
      symptomCount: symptoms.length,
      cloudyCount,
      rankedSymptoms: rankedSymptoms.map(([type, count]) => ({ label: symptomLabels[type] || type, count })),
    },
  };
}