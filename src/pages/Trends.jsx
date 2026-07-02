import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import moment from "moment";

const symptomLabels = {
  tremor: "Tremor", stiffness: "Stiffness", slowness: "Slowness", balance: "Balance",
  freezing: "Freezing", fatigue: "Fatigue", pain: "Pain", sleep_issues: "Sleep",
  anxiety: "Anxiety", depression: "Low Mood", brain_fog: "Brain Fog", other: "Other",
};

export default function Trends() {
  const [symptoms, setSymptoms] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => { loadData(); }, [range]);

  const loadData = async () => {
    setLoading(true);
    const since = moment().subtract(range, "days").startOf("day").toISOString();
    const [s, e] = await Promise.all([
      base44.entities.Symptom.filter({ logged_at: { $gte: since } }, "logged_at", 500),
      base44.entities.Exercise.filter({ logged_at: { $gte: since } }, "logged_at", 500),
    ]);
    setSymptoms(s);
    setExercises(e);
    setLoading(false);
  };

  // Symptom severity by day
  const symptomByDay = () => {
    const days = {};
    for (let i = range - 1; i >= 0; i--) {
      const day = moment().subtract(i, "days").format("YYYY-MM-DD");
      days[day] = { date: moment(day).format("MMM D"), avg: 0, count: 0, total: 0 };
    }
    symptoms.forEach(s => {
      const day = moment(s.logged_at).format("YYYY-MM-DD");
      if (days[day]) {
        days[day].total += s.severity;
        days[day].count += 1;
      }
    });
    Object.values(days).forEach(d => {
      d.avg = d.count > 0 ? Math.round((d.total / d.count) * 10) / 10 : 0;
    });
    return Object.values(days);
  };

  // Exercise minutes by day
  const exerciseByDay = () => {
    const days = {};
    for (let i = range - 1; i >= 0; i--) {
      const day = moment().subtract(i, "days").format("YYYY-MM-DD");
      days[day] = { date: moment(day).format("MMM D"), minutes: 0 };
    }
    exercises.forEach(e => {
      const day = moment(e.logged_at).format("YYYY-MM-DD");
      if (days[day]) days[day].minutes += e.duration_minutes || 0;
    });
    return Object.values(days);
  };

  // Most frequent symptoms
  const topSymptoms = () => {
    const counts = {};
    symptoms.forEach(s => {
      counts[s.symptom_type] = (counts[s.symptom_type] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, label: symptomLabels[type] || type, count }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Trends</h1>
        <p className="text-sm text-muted-foreground mt-1">See patterns in your data</p>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {[7, 14, 30].map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              range === r ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
            }`}
          >
            {r} days
          </button>
        ))}
      </div>

      {/* Symptom severity chart */}
      <section className="bg-card rounded-2xl border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Average Symptom Severity</h3>
        {symptoms.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No symptom data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={symptomByDay()}>
              <defs>
                <linearGradient id="severityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(200, 60%, 42%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(200, 60%, 42%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Area type="monotone" dataKey="avg" name="Avg Severity" stroke="hsl(200, 60%, 42%)" fill="url(#severityGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Exercise chart */}
      <section className="bg-card rounded-2xl border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Exercise Minutes</h3>
        {exercises.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No exercise data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={exerciseByDay()}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 13 }} />
              <Bar dataKey="minutes" name="Minutes" fill="hsl(160, 40%, 45%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* Top symptoms */}
      <section className="bg-card rounded-2xl border p-5">
        <h3 className="font-heading text-base font-semibold mb-4">Most Frequent Symptoms</h3>
        {topSymptoms().length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
        ) : (
          <div className="space-y-3">
            {topSymptoms().map((s, i) => {
              const max = topSymptoms()[0].count;
              return (
                <div key={s.type} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium capitalize">{s.label}</span>
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