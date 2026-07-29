import { Plus, Package, CheckCircle2, TrendingUp } from "lucide-react";

export default function SmartNextAction({ sessionCount, dailyTarget, progressPct, lowSupplies, onLogExchange, onReorder }) {
  let suggestion;
  if (sessionCount === 0) {
    suggestion = {
      icon: Plus, tone: "primary",
      title: "Log your first exchange today",
      desc: "Tap to record your first session.",
      action: "Log Exchange", onAction: onLogExchange,
    };
  } else if (lowSupplies.length > 0) {
    suggestion = {
      icon: Package, tone: "amber",
      title: `Low supply: ${lowSupplies[0]}`,
      desc: lowSupplies.length > 1 ? `${lowSupplies.length} items need reordering.` : "Reorder before you run out.",
      action: "Reorder", onAction: onReorder,
    };
  } else if (progressPct < 100) {
    const remaining = dailyTarget - sessionCount;
    suggestion = {
      icon: TrendingUp, tone: "blue",
      title: `${sessionCount} of ${dailyTarget} sessions done`,
      desc: remaining === 1 ? "One more to hit today's target!" : `${remaining} more to hit today's target.`,
      action: "Log Exchange", onAction: onLogExchange,
    };
  } else {
    suggestion = {
      icon: CheckCircle2, tone: "emerald",
      title: "Today's target reached!",
      desc: "Great work today. Consider recording your vitals.",
      action: null, onAction: null,
    };
  }

  const tones = {
    primary: "bg-primary/10 border-primary/30 text-primary",
    amber: "bg-amber-500/10 border-amber-300/50 text-amber-700",
    blue: "bg-blue-500/10 border-blue-300/50 text-blue-700",
    emerald: "bg-emerald-500/10 border-emerald-300/50 text-emerald-700",
  };
  const Icon = suggestion.icon;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl border ${tones[suggestion.tone]}`}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-white/60">
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{suggestion.title}</p>
        <p className="text-xs opacity-80 mt-0.5">{suggestion.desc}</p>
      </div>
      {suggestion.onAction && (
        <button onClick={suggestion.onAction}
          className="shrink-0 px-3.5 py-2 rounded-full bg-white/80 text-xs font-bold hover:bg-white transition-all shadow-sm">
          {suggestion.action}
        </button>
      )}
    </div>
  );
}