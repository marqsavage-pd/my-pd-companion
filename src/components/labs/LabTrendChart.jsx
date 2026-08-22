import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea } from "recharts";
import moment from "moment";

const LAB_RANGES = {
  creatinine: { low: 0.6, high: 1.2, label: "Creatinine", unit: "mg/dL" },
  bun: { low: 7, high: 20, label: "BUN", unit: "mg/dL" },
  potassium: { low: 3.5, high: 5.0, label: "Potassium", unit: "mEq/L" },
  hemoglobin: { low: 11, high: 12, label: "Hemoglobin", unit: "g/dL" },
  calcium: { low: 8.4, high: 10.2, label: "Calcium", unit: "mg/dL" },
  phosphorus: { low: 3.5, high: 5.5, label: "Phosphorus", unit: "mg/dL" },
  pth: { low: 150, high: 600, label: "PTH", unit: "pg/mL" },
  albumin: { low: 3.5, high: 5.0, label: "Albumin", unit: "g/dL" },
  egfr: { low: 0, high: 15, label: "eGFR", unit: "mL/min" },
};

export default function LabTrendChart({ field, labs }) {
  const range = LAB_RANGES[field];
  if (!range) return null;

  const data = labs
    .filter(l => l[field] != null)
    .map(l => ({ date: l.date, value: l[field] }))
    .reverse(); // chronological order

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No data for {range.label}</p>;
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values, range.low);
  const maxVal = Math.max(...values, range.high);
  const padding = (maxVal - minVal) * 0.15 || 1;

  return (
    <div className="bg-card rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold">{range.label}</h3>
          <p className="text-xs text-muted-foreground">Normal: {range.low}–{range.high} {range.unit}</p>
        </div>
        <span className="text-2xl font-bold">{data[data.length - 1].value}</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
          <ReferenceArea y1={range.low} y2={range.high} fill="hsl(142 71% 45% / 0.08)" />
          <XAxis
            dataKey="date"
            tickFormatter={d => moment(d).format("DD-MMM")}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--border))"
          />
          <YAxis
            domain={[minVal - padding, maxVal + padding]}
            tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
            stroke="hsl(var(--border))"
          />
          <Tooltip
            labelFormatter={d => moment(d).format("DD-MMM-YY")}
            formatter={v => [`${v} ${range.unit}`, range.label]}
            contentStyle={{ borderRadius: "0.75rem", border: "1px solid hsl(var(--border))", fontSize: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 3, fill: "hsl(var(--primary))" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}