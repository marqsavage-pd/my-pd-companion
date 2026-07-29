export default function WeightSparkline({ vitals }) {
  const weights = (vitals || [])
    .filter((v) => v.weight_lbs != null)
    .map((v) => ({ w: v.weight_lbs, t: new Date(v.created_date).getTime() }))
    .sort((a, b) => a.t - b.t);
  if (weights.length < 2) return null;
  const w = 72;
  const h = 22;
  const min = Math.min(...weights.map((d) => d.w));
  const max = Math.max(...weights.map((d) => d.w));
  const range = max - min || 1;
  const pts = weights
    .map((d, i) => {
      const x = (i / (weights.length - 1)) * w;
      const y = h - ((d.w - min) / range) * (h - 2) - 1;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <div className="mt-1.5">
      <svg width={w} height={h} className="mx-auto block" aria-hidden="true">
        <polyline
          points={pts}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-[9px] text-muted-foreground mt-0.5">{min}–{max} lbs</p>
    </div>
  );
}