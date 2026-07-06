import { HeartPulse, Pencil, Trash2 } from "lucide-react";
import moment from "moment";

export default function VitalCard({ vital, onEdit, onDelete }) {
  const v = vital;
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border group">
      <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
        <HeartPulse size={18} className="text-rose-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          {v.weight_lbs && <span className="text-sm font-semibold">{v.weight_lbs} lbs</span>}
          {v.systolic_bp && <span className="text-sm font-semibold">{v.systolic_bp}/{v.diastolic_bp} mmHg</span>}
        </div>
        {v.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{v.notes}</p>}
        <p className="text-[10px] text-muted-foreground mt-1">{moment.utc(v.created_date).local().format("MMM D, YYYY · HH:mm")}</p>
      </div>
      {onEdit && onDelete && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => onEdit(v)} className="p-1.5 rounded-lg hover:bg-secondary transition-all">
            <Pencil size={14} className="text-muted-foreground" />
          </button>
          <button onClick={() => onDelete(v.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-all">
            <Trash2 size={14} className="text-destructive" />
          </button>
        </div>
      )}
    </div>
  );
}