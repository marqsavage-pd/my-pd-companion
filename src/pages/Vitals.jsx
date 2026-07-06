import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, HeartPulse, Trash2, Scale, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VitalForm from "@/components/vitals/VitalForm";
import moment from "moment";

export default function Vitals() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { loadVitals(); }, []);

  const loadVitals = async () => {
    setLoading(true);
    const data = await base44.entities.VitalSign.list("-created_date", 100);
    setVitals(data);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await base44.entities.VitalSign.update(editing.id, data);
    } else {
      await base44.entities.VitalSign.create(data);
    }
    setShowForm(false);
    setEditing(null);
    loadVitals();
  };

  const handleDelete = async (id) => {
    await base44.entities.VitalSign.delete(id);
    loadVitals();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  const latest = vitals[0];
  const prev = vitals[1];
  const weightDelta = latest?.weight_lbs && prev?.weight_lbs ? (latest.weight_lbs - prev.weight_lbs) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Vitals</h1>
          <p className="text-sm text-muted-foreground mt-1">Weight & blood pressure</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Record
        </Button>
      </div>

      {latest && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <Scale size={16} className="text-primary" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest Weight</p>
            </div>
            {latest.weight_lbs ? (
              <>
                <p className="text-2xl font-bold">{latest.weight_lbs} <span className="text-sm font-medium text-muted-foreground">lbs</span></p>
                {weightDelta !== 0 && (
                  <p className={`text-xs font-medium mt-1 ${weightDelta > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                    {weightDelta > 0 ? "▲" : "▼"} {Math.abs(weightDelta).toFixed(1)} lbs from last
                  </p>
                )}
              </>
            ) : <p className="text-2xl font-bold text-muted-foreground">—</p>}
          </div>
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse size={16} className="text-rose-500" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Latest BP</p>
            </div>
            {latest.systolic_bp ? (
              <p className="text-2xl font-bold">{latest.systolic_bp}/{latest.diastolic_bp} <span className="text-sm font-medium text-muted-foreground">mmHg</span></p>
            ) : <p className="text-2xl font-bold text-muted-foreground">—</p>}
            <p className="text-xs text-muted-foreground mt-1">{moment.utc(latest.created_date).local().format("MMM D, h:mm A")}</p>
          </div>
        </div>
      )}

      {vitals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <HeartPulse size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No vitals recorded yet</p>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-4 rounded-xl">Record your vitals</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {vitals.map(v => (
            <div key={v.id} className="flex items-center gap-3 p-4 rounded-2xl bg-card border group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0">
                <HeartPulse size={18} className="text-rose-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  {v.weight_lbs && <span className="text-sm font-semibold">{v.weight_lbs} lbs</span>}
                  {v.systolic_bp && <span className="text-sm font-semibold">{v.systolic_bp}/{v.diastolic_bp} mmHg</span>}
                </div>
                {v.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{v.notes}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{moment.utc(v.created_date).local().format("MMM D, YYYY · h:mm A")}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => { setEditing(v); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-secondary transition-all">
                  <Pencil size={14} className="text-muted-foreground" />
                </button>
                <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-all">
                  <Trash2 size={14} className="text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? "Edit Vitals" : "Record Vitals"}</DialogTitle></DialogHeader>
          <VitalForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}