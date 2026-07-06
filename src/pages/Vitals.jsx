import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, HeartPulse, ChevronDown, ChevronRight, Scale, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VitalForm from "@/components/vitals/VitalForm";
import VitalCard from "@/components/vitals/VitalCard";
import moment from "moment";

const MONTH_START = moment().startOf("month");
const JUNE_START = moment().subtract(1, "month").startOf("month");
const eventDate = (v) => moment.utc(v.measured_at || v.created_date).local();

export default function Vitals() {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showHistorical, setShowHistorical] = useState(false);
  const [showJune, setShowJune] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadVitals(); }, []);

  const loadVitals = async () => {
    setLoading(true);
    const data = await base44.entities.VitalSign.list("-created_date", 500);
    data.sort((a, b) => eventDate(b) - eventDate(a));
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

  const recentVitals = vitals.filter(v => eventDate(v).valueOf() >= MONTH_START.valueOf());
  const juneVitals = vitals.filter(v => eventDate(v).valueOf() >= JUNE_START.valueOf() && eventDate(v).valueOf() < MONTH_START.valueOf());
  const historicalVitals = vitals.filter(v => eventDate(v).valueOf() < JUNE_START.valueOf());

  const searchResults = searchQuery.trim()
    ? vitals.filter(v => {
        const q = searchQuery.toLowerCase();
        return [
          v.weight_lbs ? `${v.weight_lbs} lbs` : "",
          v.systolic_bp ? `${v.systolic_bp}/${v.diastolic_bp} mmHg` : "",
          v.notes,
          eventDate(v).format("MMM D, YYYY HH:mm"),
        ].filter(Boolean).join(" ").toLowerCase().includes(q);
      })
    : null;

  const groupByDay = (items) => items.reduce((acc, v) => {
    const day = eventDate(v).format("YYYY-MM-DD");
    if (!acc[day]) acc[day] = [];
    acc[day].push(v);
    return acc;
  }, {});

  const recentGrouped = groupByDay(recentVitals);
  const juneGrouped = groupByDay(juneVitals);
  const historicalGrouped = groupByDay(historicalVitals);

  const handleEdit = (v) => { setEditing(v); setShowForm(true); };

  const renderDaySection = (day, items) => {
    const weights = items.filter(i => i.weight_lbs).map(i => i.weight_lbs);
    const dayDelta = weights.length >= 2 ? (weights[0] - weights[weights.length - 1]) : 0;
    return (
      <section key={day}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {moment(day).calendar(null, { sameDay: "[Today]", lastDay: "[Yesterday]", lastWeek: "dddd", sameElse: "MMM D, YYYY" })}
          </h3>
          {dayDelta !== 0 && (
            <span className="text-xs font-medium text-primary">
              {dayDelta > 0 ? "▲" : "▼"} {Math.abs(dayDelta).toFixed(1)} lbs
            </span>
          )}
        </div>
        <div className="space-y-2">
          {items.map(v => (
            <VitalCard key={v.id} vital={v} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      </section>
    );
  };

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
            <p className="text-xs text-muted-foreground mt-1">{moment.utc(latest.created_date).local().format("MMM D, HH:mm")}</p>
          </div>
        </div>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search vitals by weight, BP, notes, date..."
          className="rounded-xl pl-9"
        />
      </div>

      {vitals.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <HeartPulse size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No vitals recorded yet</p>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-4 rounded-xl">Record your vitals</Button>
        </div>
      ) : searchResults ? (
        searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No vitals match "{searchQuery}"</p>
          </div>
        ) : (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</h3>
            <div className="space-y-2">
              {searchResults.map(v => (
                <VitalCard key={v.id} vital={v} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        )
      ) : (
        <>
          {recentVitals.length === 0 && juneVitals.length === 0 && historicalVitals.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">All vitals are in the sections below</p>
            </div>
          )}
          {Object.entries(recentGrouped).map(([day, items]) => renderDaySection(day, items))}

          {juneVitals.length > 0 && (
            <section>
              <button
                onClick={() => setShowJune(!showJune)}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-all"
              >
                <div className="flex items-center gap-2">
                  {showJune ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <h3 className="text-sm font-semibold">June</h3>
                </div>
                <span className="text-xs text-muted-foreground">{juneVitals.length} entries</span>
              </button>
              {showJune && (
                <div className="space-y-6 mt-3">
                  {Object.entries(juneGrouped).map(([day, items]) => renderDaySection(day, items))}
                </div>
              )}
            </section>
          )}

          {historicalVitals.length > 0 && (
            <section>
              <button
                onClick={() => setShowHistorical(!showHistorical)}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-all"
              >
                <div className="flex items-center gap-2">
                  {showHistorical ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <h3 className="text-sm font-semibold">Historical</h3>
                </div>
                <span className="text-xs text-muted-foreground">{historicalVitals.length} entries · before June</span>
              </button>
              {showHistorical && (
                <div className="space-y-6 mt-3">
                  {Object.entries(historicalGrouped).map(([day, items]) => renderDaySection(day, items))}
                </div>
              )}
            </section>
          )}
        </>
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