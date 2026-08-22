import { TrendingUp, TrendingDown, Minus } from "lucide-react";

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

export default function LabCard({ field, current, previous }) {
  const range = LAB_RANGES[field];
  if (!range) return null;
  const value = current?.[field];
  const prevValue = previous?.[field];

  if (value == null) {
    return (
      <div className="bg-card rounded-2xl border p-3 text-center">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{range.label}</p>
        <p className="text-lg font-bold mt-1 text-muted-foreground">—</p>
        <p className="text-[10px] text-muted-foreground">{range.unit}</p>
      </div>
    );
  }

  const inRange = value >= range.low && value <= range.high;
  const delta = prevValue != null ? value - prevValue : null;
  const trendIcon = delta == null ? null : delta > 0.01 ? <TrendingUp size={12} /> : delta < -0.01 ? <TrendingDown size={12} /> : <Minus size={12} />;
  const trendColor = delta == null ? "" : delta > 0.01 ? "text-amber-600" : delta < -0.01 ? "text-emerald-600" : "text-muted-foreground";

  return (
    <div className={`bg-card rounded-2xl border p-3 text-center ${!inRange ? "border-amber-300" : ""}`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{range.label}</p>
      <p className={`text-lg font-bold mt-1 ${!inRange ? "text-amber-600" : ""}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground">{range.unit}</p>
      {delta != null && (
        <p className={`text-[10px] font-medium mt-0.5 flex items-center justify-center gap-0.5 ${trendColor}`}>
          {trendIcon}{Math.abs(delta).toFixed(1)}
        </p>
      )}
    </div>
  );
}