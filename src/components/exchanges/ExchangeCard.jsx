import { Droplets, AlertTriangle, Pencil, Trash2 } from "lucide-react";
import moment from "moment";

const formatDwell = (hours) => {
  if (!hours) return "—";
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}:${m.toString().padStart(2, "0")}`;
};

const appearanceColors = {
  clear: "bg-emerald-100 text-emerald-700",
  cloudy: "bg-red-100 text-red-700",
  bloody: "bg-orange-100 text-orange-700",
  fibrin: "bg-amber-100 text-amber-700",
};

export default function ExchangeCard({ exchange, onEdit, onDelete }) {
  const e = exchange;
  return (
    <div className="p-4 rounded-2xl bg-card border group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Droplets size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold uppercase">{e.modality}</p>
            <span className="text-xs text-muted-foreground">{e.dextrose_concentration}% dextrose</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${appearanceColors[e.solution_appearance] || "bg-secondary text-muted-foreground"}`}>
              {e.solution_appearance}
            </span>
            {e.solution_appearance === "cloudy" && <AlertTriangle size={13} className="text-destructive" />}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">UF</p>
              <p className={`text-sm font-bold ${e.ultrafiltration >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                {e.ultrafiltration > 0 ? "+" : ""}{e.ultrafiltration} mL
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Dwell Time</p>
              <p className="text-sm font-medium">{formatDwell(e.dwell_hours)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Lost Dwell</p>
              <p className="text-sm font-medium">{e.lost_dwell ? `${e.lost_dwell} mL` : "—"}</p>
            </div>
          </div>
          {e.notes && <p className="text-xs text-muted-foreground mt-2 italic">{e.notes}</p>}
          <p className="text-[10px] text-muted-foreground mt-1">{moment.utc(e.created_date).local().format("HH:mm")}</p>
        </div>
        {onEdit && onDelete && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button onClick={() => onEdit(e)} className="p-1.5 rounded-lg hover:bg-secondary transition-all">
              <Pencil size={14} className="text-muted-foreground" />
            </button>
            <button onClick={() => onDelete(e.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-all">
              <Trash2 size={14} className="text-destructive" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}