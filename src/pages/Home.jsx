import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Droplets, HeartPulse, Activity, BookOpen, Plus, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExchangeForm from "@/components/exchanges/ExchangeForm";
import VitalForm from "@/components/vitals/VitalForm";
import moment from "moment";

export default function Home() {
  const [exchanges, setExchanges] = useState([]);
  const [recentExchanges, setRecentExchanges] = useState([]);
  const [vitals, setVitals] = useState([]);

  const [symptoms, setSymptoms] = useState([]);
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [user, setUser] = useState(null);

  const todayStart = moment().startOf("day").toISOString();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [u, ex, re, v, s, j] = await Promise.all([
      base44.auth.me(),
      base44.entities.Exchange.filter({ created_date: { $gte: todayStart } }, "-created_date", 20),
      base44.entities.Exchange.list("-created_date", 5),
      base44.entities.VitalSign.list("-created_date", 5),
      base44.entities.Symptom.filter({ created_date: { $gte: todayStart } }, "-created_date", 10),
      base44.entities.JournalEntry.filter({ created_date: { $gte: todayStart } }, "-created_date", 5),
    ]);
    setUser(u);
    setExchanges(ex);
    setRecentExchanges(re);
    setVitals(v);
    setSymptoms(s);
    setJournal(j);
    setLoading(false);
  };

  const handleLogExchange = async (data) => {
    await base44.entities.Exchange.create(data);
    setShowExchangeForm(false);
    loadData();
  };

  const handleLogVitals = async (data) => {
    await base44.entities.VitalSign.create(data);
    setShowVitalForm(false);
    loadData();
  };


  const lastSession = recentExchanges[0];
  const totalUF = lastSession?.ultrafiltration || 0;
  const latestVital = vitals[0];
  const hasCloudy = exchanges.some(e => e.solution_appearance === "cloudy");

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold">
          {greeting()}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">{moment().format("dddd, MMMM D")}</p>
      </div>

      {hasCloudy && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/30">
          <AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Cloudy effluent detected</p>
            <p className="text-xs text-destructive/80">This may indicate peritonitis. Please contact your dialysis clinic promptly.</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setShowExchangeForm(true)}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Plus size={20} className="text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-blue-900">Log Exchange</p>
            <p className="text-xs text-blue-600/70">{exchanges.length} today</p>
          </div>
        </button>
        <button onClick={() => setShowVitalForm(true)}
          className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200/50 hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <HeartPulse size={20} className="text-rose-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-rose-900">Record Vitals</p>
            <p className="text-xs text-rose-600/70">Weight & BP</p>
          </div>
        </button>
      </div>

      {/* Today's fluid summary */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Fluid Removed</p>
            <p className="text-3xl font-bold text-primary mt-1">{totalUF > 0 ? "+" : ""}{totalUF} <span className="text-lg font-medium">mL</span></p>
          </div>
          <Droplets size={32} className="text-primary/30" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">{lastSession ? `Previous session · ${moment.utc(lastSession.created_date).local().format("HH:mm")}` : "No sessions logged yet"}</p>
      </div>

      {/* Latest vitals */}
      {latestVital && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">Latest Vitals</h2>
            <Link to="/vitals" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-card rounded-2xl border p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Weight</p>
              <p className="text-lg font-bold mt-1">{latestVital.weight_lbs ? `${latestVital.weight_lbs}` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">lbs</p>
            </div>
            <div className="bg-card rounded-2xl border p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">BP</p>
              <p className="text-lg font-bold mt-1">{latestVital.systolic_bp ? `${latestVital.systolic_bp}/${latestVital.diastolic_bp}` : "—"}</p>
              <p className="text-[10px] text-muted-foreground">mmHg</p>
            </div>
            <div className="bg-card rounded-2xl border p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Logged</p>
              <p className="text-lg font-bold mt-1">{moment.utc(latestVital.created_date).local().format("HH:mm")}</p>
              <p className="text-[10px] text-muted-foreground">{moment.utc(latestVital.created_date).local().format("MMM D")}</p>
            </div>
          </div>
        </section>
      )}

      {/* Recent sessions */}
      {recentExchanges.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">Recent Sessions</h2>
            <Link to="/exchanges" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="space-y-2">
            {recentExchanges.map(e => {
              const uf = e.ultrafiltration || 0;
              const isCloudy = e.solution_appearance === "cloudy";
              return (
                <div key={e.id} className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Droplets size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold capitalize">{e.modality}</span>
                      <span className="text-xs text-muted-foreground">{e.dextrose_concentration}% dextrose</span>
                      {isCloudy && <span className="text-[10px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">cloudy</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{moment.utc(e.created_date).local().format("MMM D · HH:mm")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${uf > 0 ? "text-emerald-600" : uf < 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                      {uf > 0 ? "+" : ""}{uf}
                    </p>
                    <p className="text-[10px] text-muted-foreground">mL UF</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent symptoms */}
      {symptoms.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">Today's Symptoms</h2>
            <Link to="/symptoms" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {symptoms.slice(0, 6).map(s => {
              const severityColors = ["", "bg-emerald-100 text-emerald-700", "bg-lime-100 text-lime-700", "bg-amber-100 text-amber-700", "bg-orange-100 text-orange-700", "bg-red-100 text-red-700"];
              return (
                <div key={s.id} className="shrink-0 p-3 rounded-2xl bg-card border min-w-[120px]">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mb-1.5 ${severityColors[s.severity]}`}>{s.severity}/5</span>
                  <p className="text-sm font-medium capitalize">{s.symptom_type.replace(/_/g, " ")}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{moment.utc(s.created_date).local().format("HH:mm")}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {journal.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-lg font-semibold">Journal</h2>
            <Link to="/journal" className="text-sm text-primary font-medium flex items-center gap-1 hover:underline">Write <ArrowRight size={14} /></Link>
          </div>
          <div className="bg-card rounded-2xl border p-4">
            {journal[0].title && <p className="text-sm font-semibold mb-1">{journal[0].title}</p>}
            <p className="text-sm text-muted-foreground line-clamp-2">{journal[0].content}</p>
            <p className="text-xs text-muted-foreground mt-2">{moment.utc(journal[0].created_date).local().format("HH:mm")}</p>
          </div>
        </section>
      )}

      <Dialog open={showExchangeForm} onOpenChange={setShowExchangeForm}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl">Log Exchange</DialogTitle></DialogHeader>
          <ExchangeForm onSubmit={handleLogExchange} onCancel={() => setShowExchangeForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={showVitalForm} onOpenChange={setShowVitalForm}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">Record Vitals</DialogTitle></DialogHeader>
          <VitalForm onSubmit={handleLogVitals} onCancel={() => setShowVitalForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}