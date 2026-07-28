import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Droplets, HeartPulse, Activity, BookOpen, Plus, ArrowRight, AlertTriangle, ExternalLink, StickyNote, MessageCircleQuestion, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExchangeForm from "@/components/exchanges/ExchangeForm";
import VitalForm from "@/components/vitals/VitalForm";
import StreakBadge from "@/components/home/StreakBadge";
import SupplyAlert from "@/components/home/SupplyAlert";
import WeightSparkline from "@/components/home/WeightSparkline";
import moment from "moment";

export default function Home() {
  const [exchanges, setExchanges] = useState([]);
  const [recentExchanges, setRecentExchanges] = useState([]);
  const [vitals, setVitals] = useState([]);
  const [weightVitals, setWeightVitals] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [exchanges30, setExchanges30] = useState([]);

  const [symptoms, setSymptoms] = useState([]);
  const [journal, setJournal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExchangeForm, setShowExchangeForm] = useState(false);
  const [showVitalForm, setShowVitalForm] = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteCategory, setNoteCategory] = useState("question");
  const [savingNote, setSavingNote] = useState(false);
  const [user, setUser] = useState(null);

  const todayStart = moment().startOf("day").toISOString();
  const thirtyDaysAgo = moment().subtract(30, "days").toISOString();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [u, ex, re, v, wv, s, j, sup, ex30] = await Promise.all([
      base44.auth.me(),
      base44.entities.Exchange.filter({ logged_at: { $gte: todayStart } }, "-logged_at", 20),
      base44.entities.Exchange.list("-logged_at", 3),
      base44.entities.VitalSign.list("-created_date", 5),
      base44.entities.VitalSign.list("-created_date", 30),
      base44.entities.Symptom.filter({ created_date: { $gte: todayStart } }, "-created_date", 10),
      base44.entities.JournalEntry.filter({ created_date: { $gte: todayStart } }, "-created_date", 5),
      base44.entities.Supply.list(),
      base44.entities.Exchange.filter({ logged_at: { $gte: thirtyDaysAgo } }, "logged_at", 200),
    ]);
    setUser(u);
    setExchanges(ex);
    setRecentExchanges(re);
    setVitals(v);
    setWeightVitals(wv);
    setSymptoms(s);
    setJournal(j);
    setSupplies(sup);
    setExchanges30(ex30);
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

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setSavingNote(true);
    await base44.entities.AppointmentNote.create({ text: noteText.trim(), category: noteCategory });
    setNoteText("");
    setNoteCategory("question");
    setSavingNote(false);
    setShowNoteForm(false);
  };


  const hasToday = exchanges.length > 0;
  const totalUF = hasToday
    ? exchanges.reduce((sum, e) => sum + (e.ultrafiltration || 0), 0)
    : (recentExchanges[0]?.ultrafiltration || 0);
  const lastSession = exchanges[0] || recentExchanges[0];
  const latestVital = vitals[0];
  const hasCloudy = exchanges.some(e => e.solution_appearance === "cloudy");

  const streakDays = (() => {
    const days = new Set();
    exchanges30.forEach(e => {
      const ts = e.logged_at || e.created_date;
      if (!ts) return;
      const d = ts.length <= 10 ? moment(ts) : moment.utc(ts).local();
      days.add(d.format("YYYY-MM-DD"));
    });
    let cursor = moment().startOf("day");
    if (!days.has(cursor.format("YYYY-MM-DD"))) {
      cursor.subtract(1, "day");
      if (!days.has(cursor.format("YYYY-MM-DD"))) return 0;
    }
    let n = 0;
    while (days.has(cursor.format("YYYY-MM-DD"))) { n++; cursor.subtract(1, "day"); }
    return n;
  })();

  const isCapdToday = exchanges.some(e => e.modality === "capd");
  const dailyTarget = isCapdToday ? 4 : 1;
  const sessionCount = exchanges.length;
  const progressPct = Math.min(100, (sessionCount / dailyTarget) * 100);

  const formatDwell = (hours) => {
    if (!hours) return null;
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}:${m.toString().padStart(2, "0")}`;
  };

  // logged_at may be stored as a date-only string (e.g. "2026-07-13"); parsing it
  // as UTC midnight then shifting to local shifts the date back a day, so treat
  // date-only values as local. Full datetime strings keep UTC->local conversion.
  const formatSessionTime = (e, sep = ", ") => {
    const ts = e.logged_at || e.created_date;
    if (!ts) return "—";
    if (ts.length <= 10) return moment(ts).format("MMM D");
    return /[Zz]$|[+-]\d{2}:\d{2}$/.test(ts) ? moment.utc(ts).local().format(`MMM D${sep}HH:mm`) : moment(ts).format(`MMM D${sep}HH:mm`);
  };

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
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">
            {greeting()}{user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1">{moment().format("dddd, MMMM D")}</p>
        </div>
        <StreakBadge days={streakDays} />
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
      <div className="flex gap-2">
        <button onClick={() => setShowExchangeForm(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-blue-500/10 border border-blue-200/50 hover:bg-blue-500/15 transition-all">
          <Plus size={15} className="text-blue-600" />
          <span className="text-sm font-semibold text-blue-900">Log Exchange</span>
        </button>
        <button onClick={() => setShowVitalForm(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-rose-500/10 border border-rose-200/50 hover:bg-rose-500/15 transition-all">
          <HeartPulse size={15} className="text-rose-600" />
          <span className="text-sm font-semibold text-rose-900">Record Vitals</span>
        </button>
        <button onClick={() => setShowNoteForm(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-amber-500/10 border border-amber-200/50 hover:bg-amber-500/15 transition-all">
          <StickyNote size={15} className="text-amber-600" />
          <span className="text-sm font-semibold text-amber-900">Note</span>
        </button>
      </div>

      {/* Today zone */}
      <div className="flex items-center gap-3 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Today</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Today's fluid summary */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Today's Fluid Removed</p>
            <p className="text-2xl font-bold text-primary mt-0.5 leading-tight">{totalUF > 0 ? "+" : ""}{totalUF} <span className="text-sm font-medium">mL</span></p>
          </div>
          <Droplets size={24} className="text-primary/30 shrink-0" />
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5">{lastSession ? `${hasToday ? `${exchanges.length} session${exchanges.length !== 1 ? "s" : ""} today` : "Most recent session"} · ${formatSessionTime(lastSession)}` : "No sessions logged yet"}</p>
        {hasToday && (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground font-medium">{sessionCount} of {dailyTarget} sessions</span>
              <span className="text-[10px] text-primary font-semibold">{Math.round(progressPct)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-primary/10 overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        )}
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
              <WeightSparkline vitals={weightVitals} />
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

      {/* Recent zone */}
      <div className="flex items-center gap-3 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Recent</span>
        <div className="flex-1 h-px bg-border" />
      </div>

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
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${e.solution_appearance === "clear" ? "bg-emerald-100 text-emerald-700" : e.solution_appearance === "cloudy" ? "bg-red-100 text-red-700" : e.solution_appearance === "bloody" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>
                        {e.solution_appearance}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatSessionTime(e, " · ")}</p>
                    {formatDwell(e.dwell_hours) && <p className="text-[10px] text-muted-foreground mt-0.5">Dwell: {formatDwell(e.dwell_hours)}</p>}
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

      {/* Actions zone */}
      <div className="flex items-center gap-3 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <SupplyAlert supplies={supplies} />

      {/* Order supplies */}
      <section>
        <h2 className="font-heading text-lg font-semibold mb-3">Order Supplies</h2>
        <div className="grid grid-cols-2 gap-3">
          <a href="https://account.vantive.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-card border hover:shadow-md transition-all">
            <div>
              <p className="text-sm font-semibold">Vantive</p>
              <p className="text-xs text-muted-foreground">PD supply portal</p>
            </div>
            <ExternalLink size={16} className="text-muted-foreground" />
          </a>
          <a href="https://davita.welldyne.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between p-4 rounded-2xl bg-card border hover:shadow-md transition-all">
            <div>
              <p className="text-sm font-semibold">WellDyne</p>
              <p className="text-xs text-muted-foreground">Pharmacy refills</p>
            </div>
            <ExternalLink size={16} className="text-muted-foreground" />
          </a>
        </div>
      </section>

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

      <Dialog open={showNoteForm} onOpenChange={(o) => { setShowNoteForm(o); if (!o) setNoteText(""); }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">Quick Note</DialogTitle></DialogHeader>
          <form onSubmit={handleAddNote} className="space-y-4">
            <Input value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a question or supply to request..." className="rounded-xl" autoFocus />
            <div className="flex gap-2">
              {[
                { value: "question", label: "Ask", icon: MessageCircleQuestion },
                { value: "supply", label: "Supply", icon: Package },
              ].map(c => (
                <button key={c.value} type="button" onClick={() => setNoteCategory(c.value)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${noteCategory === c.value ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
                  <c.icon size={15} /> {c.label}
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={() => setShowNoteForm(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={savingNote || !noteText.trim()} className="flex-1 rounded-xl">
                {savingNote ? "Adding..." : "Add Note"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}