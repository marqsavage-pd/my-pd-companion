import moment from "moment";

const LAB_FIELDS = [
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

export default function ClinicReportView({ data }) {
  if (!data) return <p className="text-center text-muted-foreground py-8">Loading report...</p>;

  const { patient, summary, exchanges, labs, latestLabs, prevLabs, flagged, generatedAt, windowDays } = data;
  // Ensure descending (newest-first) regardless of SDK sort behavior with mixed-format timestamps
  const vitals = [...(data.vitals || [])].sort((a, b) => new Date(b.measured_at || b.created_date) - new Date(a.measured_at || a.created_date));
  const fmtDate = (ts) => ts ? moment(ts).format("DD-MMM-YY") : "—";

  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 space-y-8">
      {/* Header */}
      <div className="border-b pb-6">
        <h1 className="font-heading text-2xl font-bold">PD Companion — Clinical Snapshot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Generated {moment(generatedAt).format("DD-MMM-YY HH:mm")} · {windowDayText(windowDays)} window
        </p>
      </div>

      {/* Patient */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Patient</h2>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><span className="text-muted-foreground">Name: </span><span className="font-medium">{patient?.full_name || "—"}</span></div>
          <div><span className="text-muted-foreground">Email: </span><span className="font-medium">{patient?.email || "—"}</span></div>
        </div>
      </section>

      {/* Summary */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{windowDayText(windowDays)} Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatBox label="Exchanges" value={summary.exchangeCount} />
          <StatBox label="Total UF" value={`${summary.totalUF} mL`} />
          <StatBox label="Avg Weight" value={summary.avgWeight ? `${summary.avgWeight} lbs` : "—"} />
          <StatBox label="Avg BP" value={summary.avgSys ? `${summary.avgSys}/${summary.avgDia}` : "—"} />
          <StatBox label="Symptoms" value={summary.symptomCount} />
          <StatBox label="Cloudy Events" value={summary.cloudyCount} highlight={summary.cloudyCount > 0} />
        </div>
      </section>

      {/* Labs */}
      {latestLabs && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Latest Labs · {fmtDate(latestLabs.date)}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {LAB_FIELDS.map(f => {
              const val = latestLabs[f.key];
              const prevVal = prevLabs?.[f.key];
              const inRange = val != null && val >= f.low && val <= f.high;
              const delta = val != null && prevVal != null ? val - prevVal : null;
              return (
                <div key={f.key} className={`rounded-xl border p-3 text-center ${!inRange && val != null ? "border-amber-300 bg-amber-50" : ""}`}>
                  <p className="text-[10px] text-muted-foreground uppercase">{f.label}</p>
                  <p className="text-lg font-bold">{val ?? "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{f.unit}</p>
                  {delta != null && (
                    <p className={`text-[10px] font-medium ${delta > 0.01 ? "text-amber-600" : delta < -0.01 ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {delta > 0.01 ? "▲" : delta < -0.01 ? "▼" : "—"} {Math.abs(delta).toFixed(1)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Flagged notes */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Flagged for Clinic Review</h2>
        {flagged.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes flagged for review.</p>
        ) : (
          <ul className="space-y-2">
            {flagged.map((n, i) => (
              <li key={n.id} className="text-sm border-l-2 border-primary pl-3">
                <span className="text-xs text-muted-foreground">[{n.category === "supply" ? "Supply" : "Question"}] </span>
                {n.text}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Symptom frequency */}
      {summary.rankedSymptoms.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Symptom Frequency</h2>
          <div className="flex flex-wrap gap-2">
            {summary.rankedSymptoms.map((s, i) => (
              <span key={i} className="text-sm px-3 py-1 rounded-full bg-secondary">
                {s.label} · {s.count}×
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Recent vitals */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Vitals</h2>
        {vitals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vitals recorded in this window.</p>
        ) : (
          <div className="space-y-1 text-sm">
            {vitals.slice(0, 12).map((v, i) => (
              <div key={i} className="flex gap-3 border-b py-1">
                <span className="text-muted-foreground w-24">{fmtDate(v.measured_at || v.created_date)}</span>
                <span>BP {v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp}` : "—"}</span>
                <span>Weight {v.weight_lbs ? `${v.weight_lbs} lbs` : "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Full exchange log */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Exchange Log · {exchanges.length} sessions</h2>
        {exchanges.length === 0 ? (
          <p className="text-sm text-muted-foreground">No exchanges recorded in this window.</p>
        ) : (
          <div className="space-y-1 text-sm">
            {exchanges.map((e, i) => (
              <div key={i} className="flex flex-wrap gap-x-3 gap-y-0.5 border-b py-1">
                <span className="text-muted-foreground w-24">{fmtDate(e.logged_at)}</span>
                <span className="font-medium">{e.modality?.toUpperCase()}</span>
                <span>{e.dextrose_blend ? `${e.dextrose_blend} (eff ${e.dextrose_concentration}%)` : `${e.dextrose_concentration}%`}</span>
                <span className="text-muted-foreground">Fill {e.fill_volume || 0} / Drain {e.drain_volume || 0}</span>
                <span className={e.ultrafiltration > 0 ? "text-emerald-600" : "text-muted-foreground"}>UF {e.ultrafiltration || 0} mL</span>
                <span className={e.solution_appearance === "cloudy" || e.solution_appearance === "bloody" ? "text-destructive font-medium" : "text-muted-foreground"}>{e.solution_appearance || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Notable exchanges */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Notable Exchanges</h2>
        {exchanges.filter(e => e.solution_appearance === "cloudy" || e.solution_appearance === "bloody").length === 0 ? (
          <p className="text-sm text-muted-foreground">No cloudy or bloody effluent events.</p>
        ) : (
          <div className="space-y-1 text-sm">
            {exchanges.filter(e => e.solution_appearance === "cloudy" || e.solution_appearance === "bloody").slice(0, 10).map((e, i) => (
              <div key={i} className="flex gap-3 border-b py-1">
                <span className="text-muted-foreground w-24">{fmtDate(e.logged_at)}</span>
                <span className="font-medium">{e.modality?.toUpperCase()}</span>
                <span>{e.dextrose_concentration}%</span>
                <span className="text-destructive">{e.solution_appearance}</span>
                <span>UF {e.ultrafiltration || 0} mL</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground border-t pt-4">
        This report is advisory only. Patients and clinicians should not change any treatment plan based solely on this information. Always seek professional medical help.
      </p>
    </div>
  );
}

function StatBox({ label, value, highlight }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-amber-300 bg-amber-50" : ""}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}

function windowDayText(days) {
  return `${days}-day`;
}