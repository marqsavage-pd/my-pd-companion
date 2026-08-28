import { useState } from "react";
import { Droplets, HeartPulse, BookOpen, ChevronDown } from "lucide-react";
import { parseTimestamp } from "@/lib/dateUtils";

const fmtTime = (ts) => {
  if (!ts) return "";
  const m = parseTimestamp(ts);
  if (!m) return "";
  return ts.length <= 10 ? m.format("DD-MMM-YY") : m.format("DD-MMM-YY · HH:mm");
};

export default function ActivityTimeline({ exchanges = [], symptoms = [], journal = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  const items = [
    ...exchanges.map(e => ({ id: e.id, type: "exchange", ts: e.logged_at || e.created_date, data: e })),
    ...symptoms.map(s => ({ id: s.id, type: "symptom", ts: s.created_date, data: s })),
    ...journal.map(j => ({ id: j.id, type: "journal", ts: j.created_date, data: j })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts));

  if (items.length === 0) return null;

  const summaryFor = (item) => {
    if (item.type === "exchange") {
      const e = item.data;
      return `${e.modality?.toUpperCase()} · ${e.dextrose_concentration}% · ${e.ultrafiltration > 0 ? "+" : ""}${e.ultrafiltration || 0} mL UF`;
    }
    if (item.type === "symptom") {
      return `${item.data.symptom_type.replace(/_/g, " ")} · ${item.data.severity}/5`;
    }
    return item.data.title || "Journal entry";
  };

  const iconFor = (type) => {
    if (type === "exchange") return { Icon: Droplets, bg: "bg-blue-500/10", color: "text-blue-600" };
    if (type === "symptom") return { Icon: HeartPulse, bg: "bg-rose-500/10", color: "text-rose-600" };
    return { Icon: BookOpen, bg: "bg-purple-500/10", color: "text-purple-600" };
  };

  return (
    <div className="relative pl-4">
      <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
      <div className="space-y-3">
        {items.map(item => {
          const { Icon, bg, color } = iconFor(item.type);
          const isExchange = item.type === "exchange";
          const isOpen = expandedId === item.id;
          return (
            <div key={item.id} className="relative">
              <div className="absolute -left-4 top-2 w-2 h-2 rounded-full bg-border" />
              <button
                onClick={isExchange ? () => setExpandedId(isOpen ? null : item.id) : undefined}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl bg-card border text-left ${isExchange ? "hover:bg-secondary/50 cursor-pointer" : ""}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                  <Icon size={15} className={color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium capitalize truncate">{summaryFor(item)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{fmtTime(item.ts)}</p>
                </div>
                {isExchange && (
                  <ChevronDown size={16} className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                )}
              </button>
              {isExchange && isOpen && (
                <div className="ml-11 mt-1.5 mb-1 space-y-1 text-xs text-muted-foreground">
                  <p>Appearance: <span className="font-medium capitalize">{item.data.solution_appearance}</span></p>
                  <p>Fill: {item.data.fill_volume} mL · Drain: {item.data.drain_volume} mL</p>
                  {item.data.tfr != null && <p>TFR: {item.data.tfr} mL</p>}
                  {item.data.dwell_hours != null && <p>Dwell: {item.data.dwell_hours}h</p>}
                  {item.data.notes && <p className="italic">"{item.data.notes}"</p>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}