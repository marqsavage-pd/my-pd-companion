import { base44 } from "@/api/base44Client";
import { jsPDF } from "jspdf";
import moment from "moment";

const symptomLabels = {
  nausea: "Nausea", abdominal_pain: "Abdominal Pain", swelling: "Swelling / Edema",
  shortness_of_breath: "Shortness of Breath", fatigue: "Fatigue", fever: "Fever",
  chills: "Chills", constipation: "Constipation", exit_site_redness: "Exit Site Redness",
  exit_site_drainage: "Exit Site Drainage", muscle_cramps: "Muscle Cramps",
  dizziness: "Dizziness", itching: "Itching", poor_appetite: "Poor Appetite",
  sleep_issues: "Sleep Issues", other: "Other",
};

const fmtDate = (ts) => ts ? moment.utc(ts).local().format("MMM D, YYYY HH:mm") : "—";

// Generate and download a clinical snapshot PDF for the clinic visit.
async function buildReportDoc(user) {
  const since = moment().subtract(30, "days").startOf("day").toISOString();
  const [exchanges, vitals, symptoms, notes, labs] = await Promise.all([
    base44.entities.Exchange.filter({ logged_at: { $gte: since } }, "logged_at", 500),
    base44.entities.VitalSign.filter({ measured_at: { $gte: since } }, "measured_at", 500),
    base44.entities.Symptom.filter({ logged_at: { $gte: since } }, "logged_at", 500),
    base44.entities.AppointmentNote.list("-created_date", 500),
    base44.entities.LabResult.list("-date", 100),
  ]);

  const flagged = notes.filter(n => n.flag_for_review && !n.resolved);

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const contentW = pageW - marginX * 2;
  let y = 56;

  const ensureSpace = (h) => {
    if (y + h > pageH - 48) { doc.addPage(); y = 56; }
  };

  const heading = (text) => {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(30, 30, 60);
    doc.text(text, marginX, y);
    y += 6;
    doc.setDrawColor(200, 200, 220);
    doc.line(marginX, y, marginX + contentW, y);
    y += 18;
  };

  const para = (text, opts = {}) => {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size || 10);
    doc.setTextColor(40, 40, 50);
    const lines = doc.splitTextToSize(text, contentW - (opts.indent || 0));
    lines.forEach((line) => {
      ensureSpace(14);
      doc.text(line, marginX + (opts.indent || 0), y);
      y += 14;
    });
  };

  const row = (label, value) => {
    ensureSpace(14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 100);
    doc.text(label, marginX, y);
    doc.setTextColor(20, 20, 30);
    doc.setFont("helvetica", "bold");
    doc.text(String(value), marginX + 150, y);
    y += 14;
  };

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20, 20, 50);
  doc.text("PD Companion — Clinical Snapshot", marginX, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 120);
  doc.text(`Generated ${moment().format("MMM D, YYYY HH:mm")} · 30-day window`, marginX, y);
  y += 22;

  // Patient summary
  heading("Patient");
  row("Name", user?.full_name || "—");
  row("Email", user?.email || "—");

  // 30-day summary stats
  const totalUF = exchanges.reduce((s, e) => s + (e.ultrafiltration || 0), 0);
  const weights = vitals.map(v => v.weight_lbs).filter(Boolean);
  const avgWeight = weights.length ? (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1) : "—";
  const bps = vitals.filter(v => v.systolic_bp);
  const avgSys = bps.length ? Math.round(bps.reduce((a, v) => a + v.systolic_bp, 0) / bps.length) : "—";
  const avgDia = bps.length ? Math.round(bps.reduce((a, v) => a + v.diastolic_bp, 0) / bps.length) : "—";
  const cloudyCount = exchanges.filter(e => e.solution_appearance === "cloudy").length;

  heading("30-Day Summary");
  row("Exchanges logged", exchanges.length);
  row("Total ultrafiltration", `${Math.round(totalUF)} mL`);
  row("Avg weight", avgWeight === "—" ? "—" : `${avgWeight} lbs`);
  row("Avg blood pressure", avgSys === "—" ? "—" : `${avgSys}/${avgDia} mmHg`);
  row("Symptoms logged", symptoms.length);
  row("Cloudy effluent events", cloudyCount);

  // Lab results
  heading("Latest Lab Results");
  const latestLab = labs[0];
  const prevLab = labs[1];
  if (!latestLab) {
    para("No lab results recorded.", { size: 10 });
  } else {
    row("Date", moment(latestLab.date).format("MMM D, YYYY"));
    const labFields = [
      ["Creatinine", "creatinine", "mg/dL"], ["BUN", "bun", "mg/dL"],
      ["Potassium", "potassium", "mEq/L"], ["Hemoglobin", "hemoglobin", "g/dL"],
      ["Calcium", "calcium", "mg/dL"], ["Phosphorus", "phosphorus", "mg/dL"],
      ["PTH", "pth", "pg/mL"], ["Albumin", "albumin", "g/dL"],
      ["eGFR", "egfr", "mL/min"],
    ];
    labFields.forEach(([label, key, unit]) => {
      if (latestLab[key] != null) {
        const val = `${latestLab[key]} ${unit}`;
        const delta = prevLab && prevLab[key] != null ? latestLab[key] - prevLab[key] : null;
        row(label, delta != null ? `${val} (${delta > 0 ? "+" : ""}${delta.toFixed(1)} from prev)` : val);
      }
    });
    if (latestLab.notes) para(`Notes: ${latestLab.notes}`, { size: 9 });
  }

  // Flagged notes
  heading("Flagged for Clinic Review");
  if (flagged.length === 0) {
    para("No notes flagged for review.", { size: 10 });
  } else {
    flagged.forEach((n, i) => {
      para(`${i + 1}. [${n.category === "supply" ? "Supply" : "Question"}] ${n.text}`, { size: 10 });
    });
  }

  // Recent vitals
  heading("Recent Vitals");
  if (vitals.length === 0) {
    para("No vitals recorded in this window.", { size: 10 });
  } else {
    vitals.slice(0, 12).forEach((v) => {
      const bp = v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : "—";
      const w = v.weight_lbs ? `${v.weight_lbs} lbs` : "—";
      para(`${fmtDate(v.measured_at || v.created_date)} · BP ${bp} · Weight ${w}${v.notes ? ` · ${v.notes}` : ""}`, { size: 9 });
    });
  }

  // Symptom frequency
  heading("Symptom Frequency");
  const counts = {};
  symptoms.forEach(s => { counts[s.symptom_type] = (counts[s.symptom_type] || 0) + 1; });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) {
    para("No symptoms recorded in this window.", { size: 10 });
  } else {
    ranked.forEach(([type, count]) => {
      para(`${symptomLabels[type] || type}: ${count}×`, { size: 10 });
    });
  }

  // Full exchange log (chronological)
  heading("Exchange Log");
  if (exchanges.length === 0) {
    para("No exchanges recorded in this window.", { size: 10 });
  } else {
    exchanges.forEach((e) => {
      const blend = e.dextrose_blend ? `${e.dextrose_blend} (eff ${e.dextrose_concentration}%)` : `${e.dextrose_concentration}%`;
      para(`${fmtDate(e.logged_at)} · ${e.modality?.toUpperCase()} · ${blend} · Fill ${e.fill_volume || 0} / Drain ${e.drain_volume || 0} mL · UF ${e.ultrafiltration || 0} mL · ${e.solution_appearance || "—"}${e.notes ? ` · ${e.notes}` : ""}`, { size: 8 });
    });
  }

  // Notable exchanges (cloudy or bloody)
  heading("Notable Exchanges");
  const notable = exchanges
    .filter(e => e.solution_appearance === "cloudy" || e.solution_appearance === "bloody")
    .slice(0, 10);
  if (notable.length === 0) {
    para("No cloudy or bloody effluent events.", { size: 10 });
  } else {
    notable.forEach((e) => {
      para(`${fmtDate(e.logged_at)} · ${e.modality?.toUpperCase()} · ${e.dextrose_concentration}% · ${e.solution_appearance} · UF ${e.ultrafiltration || 0} mL`, { size: 9 });
    });
  }

  return doc;
}

export async function generateClinicReport(user) {
  const doc = await buildReportDoc(user);
  doc.save(`clinical-snapshot-${moment().format("YYYY-MM-DD")}.pdf`);
}

export async function generateClinicReportBlob(user) {
  const doc = await buildReportDoc(user);
  return doc.output("blob");
}