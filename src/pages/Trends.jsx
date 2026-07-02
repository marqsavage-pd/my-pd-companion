import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ReferenceLine } from "recharts";
import moment from "moment";

const symptomLabels = {
  nausea: "Nausea", abdominal_pain: "Abdominal Pain", swelling: "Swelling", shortness_of_breath: "SOB",
  fatigue: "Fatigue", fever: "Fever", chills: "Chills", constipation: "Constipation",
  exit_site_redness: "Exit Site Red", exit_site_drainage: "Exit Site Drain", muscle_cramps: "Cramps",
  dizziness: "Dizziness", itching: "Itching", poor_appetite: "Poor Appetite", sleep_issues: "Sleep", other: "Other",
};

export default function Trends() {
  const [exchanges, setExchanges] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => { loadData(); }, [range]);

  const loadData = async () => {
    setLoading(true);
    const since = moment().subtract(range, "days").startOf("day").toISOString();
    const [ex, v, s] = await Promise.all([
      base44.entities.Exchange.filter({ logged_at: { $gte: since } }, "logged_at", 500),
      base44.entities.VitalSign.filter({ measured_at: { $gte: since } }, "measured_at", 500),
      base44.entities.Symptom.filter({ logged_at: { $gte: since } }, "logged_at", 500),
    ]);
    setExchanges(ex);
    setVitals(v);
    setSymptoms(s);
    setLoading(false);
  };

  const buildDays = () => {
    const days = {};
    for (let i = range - 1; i >= 0; i--) {
      const day = moment().subtract(i, "days").format("YYYY-MM-DD");
      days[day] = { date: moment(day).format("MMM D"), uf: 0, weight: null, sys: null, dia: null };
    }
    return days;
  };

  const ufByDay = () => {
    const days = buildDays();
    exchanges.forEach(e => {
      const day = moment(e.logged_at).format("YYYY-MM-DD");
      if (days[day]) days[day].uf += e.ultrafiltration || 0;
    });
    return Object.values(days);
  };

  const weightByDay = () => {
    const days = buildDays();
    vitals.forEach(v => {
      const day = moment(v.measured_at).format("YYYY-MM-DD");
      if (days[day] && v.weight_lbs) days[day].weight = v.weight_lbs;
    });
    return Object.values(days);
  };

  const bpByDay = () => {
    const days = buildDays();
    vitals.forEach(v => {
      const day = moment(v.measured_at).format("YYYY-MM-DD");
      if (days[day] && v.systolic_bp) {
        days[day].sys = v.systolic_bp;
        days[day].dia = v.diastolic_bp;
      }
    });
    return Object.values(days);
  };

  const topSymptoms = () => {
    const counts = {};
    symptoms.forEach(s => { counts[s.symptom_type] = (counts[s.symptom_type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([type, count]) => ({ type, label: symptomLabels[type] || type, count }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Trends</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor your fluid balance & vitals</p>
      </div>

      <div className="flex gap-2">
        {[7, 14, 30].map(r => (
          <button key={r} onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${range === r ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
            {r} days
          </button>
        ))}
      </div>

      {/* UF chart */}
      <section className="bg-card rounded-2xl border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Daily Ultrafiltration</h3>
        {exchanges.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No exchange data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ufByDay()}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <ReferenceLine y={0} stroke="hsl(var(--border))" />
              <Bar dataKey="uf" name="UF (mL)" fill="hsl(200, 60%, 42%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Weight chart */}
      <section className="bg-card rounded-2xl border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Weight Trend</h3>
        {vitals.filter(v => v.weight_lbs).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No weight data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightByDay()}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Line type="monotone" dataKey="weight" name="Weight (lbs)" stroke="hsl(160, 40%, 45%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* BP chart */}
      <section className="bg-card rounded-2xl border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Blood Pressure Trend</h3>
        {vitals.filter(v => v.systolic_bp).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No BP data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bpByDay()}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Line type="monotone" dataKey="sys" name="Systolic" stroke="hsl(350, 60%, 55%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
              <Line type="monotone" dataKey="dia" name="Diastolic" stroke="hsl(200, 60%, 42%)" strokeWidth={2} dot={{ r: 3 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Top symptoms */}
      <section className="bg-card rounded-2xl border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Most Frequent Symptoms</h3>
        {topSymptoms().length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No symptom data yet</p>
        ) : (
          <div className="space-y-3">
            {topSymptoms().map((s, i) => {
              const max = topSymptoms()[0].count;
              return (
                <div key={s.type} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.count}×</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(s.count / max) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}