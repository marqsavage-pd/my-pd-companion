import { Flame } from "lucide-react";

export default function StreakBadge({ days }) {
  if (!days || days < 2) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-200/50 text-orange-700 text-xs font-medium">
      <Flame size={12} /> {days}-day streak
    </span>
  );
}