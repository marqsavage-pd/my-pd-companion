import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Activity, Pill, Dumbbell, BookOpen, Plus, Check, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SymptomForm from "@/components/symptoms/SymptomForm";
import moment from "moment";

const moodEmojis = { great: "😊", good: "🙂", okay: "😐", rough: "😟", difficult: "😣" };

export default function Home() {
  const [symptoms, setSymptoms] = useState([]);
  const [meds, setMeds] = useState([]);
  const [medLogs, setMedLogs] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [user, setUser] = useState(null);

  const todayStart = moment().startOf("day").toISOString();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [u, s, m, ml, e, j] = await Promise.all([
      base44.auth.me(),
      base44.entities.Symptom.filter({ logged_at: { $gte: todayStart } }, "-logged_at", 20),
      base44.entities.Medication.filter({ active: true }),
      base44.entities.MedicationLog.filter({ taken_at: { $gte: todayStart } }, "-taken_at", 50),
      base44.entities.Exercise.filter({ logged_at: { $gte: todayStart } }, "-logged_at", 10),
      base44.entities.JournalEntry.filter({ created_date: { $gte: todayStart } }, "-created_date", 5),
    ]);
    setUser(u);
    setSymptoms(s);
    setMeds(m);
    setMedLogs(ml);
    setExercises(e);
    setJournal(j);
    setLoading(false);
  };

  const handleLogSymptom = async (data) => {
    await base44.entities.Symptom.create(data);
    setShowSymptomForm(false);
    loadData();
  };

  const handleQuickMedLog = async (med) => {
    await base44.entities.MedicationLog.create({
      medication_id: med.id,
      medication_name: med.name,
      taken_at: new Date().toISOString(),
      status: "taken",
    });
    loadData();
  };

  const isMedTaken = (medId) => medLogs.some(l => l.medication_id === medId);
  const totalExerciseMin = exercises.reduce((acc, e) => acc + (e.duration_minutes || 0), 0);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Greeting */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">
          {greeting()}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">{moment().format("dddd, MMMM D")}</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowSymptomForm(true)}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 hover:shadow-md transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Plus size={20} className="text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-blue-900">Log Symptom</p>
            <p className="text-xs text-blue-600/70">{symptoms.length} today</p>
          </div>
        </button>
        <Link
          to="/exercise"
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200/50 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Dumbbell size={20} className="text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-emerald-900">Exercise</p>
            <p className="text-xs text-emerald-600/70">{totalExerciseMin} min today</p>
          </div>
        </Link>
      </div>

      {/* Medications due */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading text-lg font-semibold">Medications</h2>
          <Link to="/medications" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
            Manage <ArrowRight size={14} />
          </Link>
        </div>
        {meds.length === 0 ? (
          <div className="bg-card rounded-2xl border p-6 text-center">
            <Pill size={28} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No medications added yet</p>
            <Link to="/medications" className="text-sm text-primary font-medium hover:underline mt-1 inline-block">Add medication</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {meds.map(med => {
              const taken = isMedTaken(med.id);
              return (
                <div key={med.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${taken ? "bg-emerald-50/50 border-emerald-200/50" : "bg-card"}`}>
                  <button
                    onClick={() => !taken && handleQuickMedLog(med)}
                    disabled={taken}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      taken ? "bg-emerald-500 text-white" : "bg-secondary hover:bg-primary hover:text-primary-foreground"
                    }`}
                  >
                    {taken ? <Check size={18} /> : <Clock size={18} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${taken ? "line-through text-muted-foreground" : ""}`}>{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.dosage}{med.frequency ? ` · ${med.frequency}` : ""}</p>
                  </div>
                  {taken && <span className="text-xs text-emerald-600 font-medium">Taken</span>}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent symptoms */}
      {symptoms.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">Today's Symptoms</h2>
            <Link to="/symptoms" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {symptoms.slice(0, 6).map(s => {
              const severityColors = ["", "bg-emerald-100 text-emerald-700", "bg-lime-100 text-lime-700", "bg-amber-100 text-amber-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];
              return (
                <div key={s.id} className="shrink-0 p-3 rounded-2xl bg-card border min-w-[120px]">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1.5 ${severityColors[s.severity]}`}>
                    {s.severity}/5
                  </span>
                  <p className="text-sm font-medium capitalize">{s.symptom_type.replace("_", " ")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{moment(s.logged_at).format("h:mm A")}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent journal */}
      {journal.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">Journal</h2>
            <Link to="/journal" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">
              Write <ArrowRight size={14} />
            </Link>
          </div>
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{moodEmojis[journal[0].mood]}</span>
              <p className="text-sm font-medium capitalize">{journal[0].mood}</p>
              <span className="text-xs text-muted-foreground ml-auto">{moment(journal[0].created_date).format("h:mm A")}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">{journal[0].content}</p>
          </div>
        </section>
      )}

      {/* Symptom form dialog */}
      <Dialog open={showSymptomForm} onOpenChange={setShowSymptomForm}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Log a Symptom</DialogTitle>
          </DialogHeader>
          <SymptomForm onSubmit={handleLogSymptom} onCancel={() => setShowSymptomForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}