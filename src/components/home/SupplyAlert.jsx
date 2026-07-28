import { AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function SupplyAlert({ supplies }) {
  const low = supplies.filter(
    (s) => s.reorder_point != null && s.qty != null && s.qty <= s.reorder_point && !s.ordered
  );
  if (low.length === 0) return null;
  const names = low.slice(0, 3).map((s) => s.title).join(", ");
  return (
    <Link
      to="/inventory"
      className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-200/60 hover:bg-amber-500/15 transition-all"
    >
      <AlertTriangle size={18} className="text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          Low supply: {names}{low.length > 3 ? "…" : ""}
        </p>
        <p className="text-xs text-amber-700/80">Tap to review and reorder</p>
      </div>
      <ArrowRight size={16} className="text-amber-600 shrink-0" />
    </Link>
  );
}