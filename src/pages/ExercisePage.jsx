import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Dumbbell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExerciseForm from "@/components/exercise/ExerciseForm";
import moment from "moment";

const intensityColors = {
  light: "bg-blue-100 text-blue-700",
  moderate: "bg-amber-100 text-amber-700",
  vigorous: "bg-red-100 text-red-700",
};

export default function ExercisePage() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadExercises(); }, []);

  const loadExercises = async () => {
    setLoading(true);
    const data = await base44.entities.Exercise.list("-logged_at", 100);
    setExercises(data);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    await base44.entities.Exercise.create(data);
    setShowForm(false);
    loadExercises();
  };

  const handleDelete = async (id) => {
    await base44.entities.Exercise.delete(id);
    loadExercises();
  };

  const grouped = exercises.reduce((acc, e) => {
    const day = moment(e.logged_at).format("YYYY-MM-DD");
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  const todayTotal = exercises
    .filter(e => moment(e.logged_at).isSame(moment(), "day"))
    .reduce((acc, e) => acc + (e.duration_minutes || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Exercise</h1>
          <p className="text-sm text-muted-foreground mt-1">Stay active, stay strong</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
          <Plus size={16} /> Log
        </Button>
      </div>

      {/* Today summary */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 rounded-2xl p-5">
        <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Today's Activity</p>
        <p className="text-3xl font-bold text-emerald-800 mt-1">{todayTotal} <span className="text-lg font-medium">minutes</span></p>
      </div>

      {exercises.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Dumbbell size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No exercises logged yet</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 rounded-xl">Log your first exercise</Button>
        </div>
      ) : (
        Object.entries(grouped).map(([day, items]) => (
          <section key={day}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
              {moment(day).calendar(null, { sameDay: "[Today]", lastDay: "[Yesterday]", lastWeek: "dddd", sameElse: "MMM D, YYYY" })}
            </h3>
            <div className="space-y-2">
              {items.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-4 rounded-2xl bg-card border group">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <Dumbbell size={18} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{e.activity}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${intensityColors[e.intensity] || "bg-secondary text-muted-foreground"}`}>
                        {e.intensity}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{e.duration_minutes} minutes · {moment(e.logged_at).format("h:mm A")}</p>
                    {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all">
                    <Trash2 size={14} className="text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">Log Exercise</DialogTitle></DialogHeader>
          <ExerciseForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}