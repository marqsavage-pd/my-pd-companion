import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, AlertTriangle, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SymptomForm from "@/components/symptoms/SymptomForm";
import moment from "moment";

const symptomLabels = {
  nausea: "Nausea", abdominal_pain: "Abdominal Pain", swelling: "Swelling / Edema",
  shortness_of_breath: "Shortness of Breath", fatigue: "Fatigue", fever: "Fever",
  chills: "Chills", constipation: "Constipation", exit_site_redness: "Exit Site Redness",
  exit_site_drainage: "Exit Site Drainage", muscle_cramps: "Muscle Cramps",
  dizziness: "Dizziness", itching: "Itching", poor_appetite: "Poor Appetite",
  sleep_issues: "Sleep Issues", other: "Other",
};

const severityColors = ["", "bg-emerald-100 text-emerald-700", "bg-lime-100 text-lime-700", "bg-amber-100 text-amber-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];
const severityLabels = ["", "Minimal", "Mild", "Moderate", "Significant", "Severe"];

export default function Symptoms() {
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { loadSymptoms(); }, []);

  const loadSymptoms = async () => {
    setLoading(true);
    const data = await base44.entities.Symptom.list("-created_date", 100);
    setSymptoms(data);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await base44.entities.Symptom.update(editing.id, data);
    } else {
      await base44.entities.Symptom.create(data);
    }
    setShowForm(false);
    setEditing(null);
    loadSymptoms();
  };

  const handleDelete = async (id) => {
    await base44.entities.Symptom.delete(id);
    loadSymptoms();
  };

  const grouped = symptoms.reduce((acc, s) => {
    const day = moment.utc(s.created_date).local().format("YYYY-MM-DD");
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {});

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Symptoms</h1>
          <p className="text-sm text-muted-foreground mt-1">Track how you're feeling</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Log
        </Button>
      </div>

      {symptoms.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Plus size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No symptoms logged yet</p>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-4 rounded-xl">Log your first symptom</Button>
        </div>
      ) : (
        Object.entries(grouped).map(([day, items]) => (
          <section key={day}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {moment(day).calendar(null, { sameDay: "[Today]", lastDay: "[Yesterday]", lastWeek: "dddd", sameElse: "MMM D, YYYY" })}
            </h3>
            <div className="space-y-2">
              {items.map(s => {
                const isExitSite = s.symptom_type.startsWith("exit_site");
                return (
                  <div key={s.id} className={`flex items-start gap-3 p-4 rounded-2xl border group ${isExitSite && s.severity >= 3 ? "bg-destructive/5 border-destructive/20" : "bg-card"}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${severityColors[s.severity]}`}>
                      {s.severity}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{symptomLabels[s.symptom_type] || s.symptom_type}</p>
                        <span className="text-xs text-muted-foreground">{severityLabels[s.severity]}</span>
                        {isExitSite && s.severity >= 3 && <AlertTriangle size={13} className="text-destructive" />}
                      </div>
                      {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.notes}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">{moment.utc(s.created_date).local().format("h:mm A")}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => { setEditing(s); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-secondary transition-all">
                        <Pencil size={14} className="text-muted-foreground" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-all">
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? "Edit Symptom" : "Log a Symptom"}</DialogTitle></DialogHeader>
          <SymptomForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}