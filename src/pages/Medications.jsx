import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pill, Trash2, Edit, Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MedicationForm from "@/components/medications/MedicationForm";
import moment from "moment";

export default function Medications() {
  const [meds, setMeds] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);

  const todayStart = moment().startOf("day").toISOString();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [m, l] = await Promise.all([
      base44.entities.Medication.list("-created_date", 50),
      base44.entities.MedicationLog.filter({ taken_at: { $gte: todayStart } }, "-taken_at", 100),
    ]);
    setMeds(m);
    setLogs(l);
    setLoading(false);
  };

  const handleAdd = async (data) => {
    await base44.entities.Medication.create(data);
    setShowForm(false);
    loadData();
  };

  const handleUpdate = async (data) => {
    await base44.entities.Medication.update(editingMed.id, data);
    setEditingMed(null);
    loadData();
  };

  const handleDelete = async (id) => {
    await base44.entities.Medication.delete(id);
    loadData();
  };

  const handleLogDose = async (med) => {
    await base44.entities.MedicationLog.create({
      medication_id: med.id,
      medication_name: med.name,
      taken_at: new Date().toISOString(),
      status: "taken",
    });
    loadData();
  };

  const isTakenToday = (medId) => logs.some(l => l.medication_id === medId);
  const todayLogCount = (medId) => logs.filter(l => l.medication_id === medId).length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Medications</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track your meds</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
          <Plus size={16} /> Add
        </Button>
      </div>

      {meds.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Pill size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No medications added yet</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 rounded-xl">Add your first medication</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {meds.filter(m => m.active).map(med => {
            const taken = isTakenToday(med.id);
            const count = todayLogCount(med.id);
            return (
              <div key={med.id} className={`rounded-2xl border p-4 transition-all ${taken ? "bg-emerald-50/30 border-emerald-200/50" : "bg-card"}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleLogDose(med)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      taken ? "bg-emerald-500 text-white" : "bg-secondary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {taken ? <Check size={18} /> : <Clock size={18} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage}{med.frequency ? ` · ${med.frequency}` : ""}</p>
                    {med.time_of_day?.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {med.time_of_day.map(t => (
                          <span key={t} className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">{t}</span>
                        ))}
                      </div>
                    )}
                    {med.instructions && <p className="text-xs text-muted-foreground mt-1.5 italic">{med.instructions}</p>}
                    {count > 0 && <p className="text-xs text-emerald-600 font-medium mt-1.5">Taken {count}× today</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditingMed(med)} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                      <Edit size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(med.id)} className="p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {meds.some(m => !m.active) && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Inactive</h3>
              {meds.filter(m => !m.active).map(med => (
                <div key={med.id} className="rounded-2xl border bg-card/50 p-4 opacity-60">
                  <p className="font-medium text-sm">{med.name} — {med.dosage}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">Add Medication</DialogTitle></DialogHeader>
          <MedicationForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingMed} onOpenChange={() => setEditingMed(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">Edit Medication</DialogTitle></DialogHeader>
          {editingMed && <MedicationForm initial={editingMed} onSubmit={handleUpdate} onCancel={() => setEditingMed(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}