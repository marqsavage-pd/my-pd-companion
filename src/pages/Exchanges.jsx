import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Droplets, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExchangeForm from "@/components/exchanges/ExchangeForm";
import ExchangeCard from "@/components/exchanges/ExchangeCard";
import moment from "moment";

const MONTH_START = moment().startOf("month");
const JUNE_START = moment().subtract(1, "month").startOf("month");
const prevMonthLabel = moment().subtract(1, "month").format("MMMM");
const eventDate = (e) => {
  const ts = e.logged_at || e.created_date;
  if (!ts) return moment();
  return ts.length <= 10 ? moment(ts) : moment.utc(ts).local();
};

export default function Exchanges() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHistorical, setShowHistorical] = useState(false);
  const [showPrevMonth, setShowPrevMonth] = useState(false);

  useEffect(() => { loadExchanges(); }, []);

  const loadExchanges = async () => {
    setLoading(true);
    const data = await base44.entities.Exchange.list("-created_date", 500);
    data.sort((a, b) => eventDate(b) - eventDate(a));
    setExchanges(data);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await base44.entities.Exchange.update(editing.id, data);
    } else {
      await base44.entities.Exchange.create(data);
    }
    setShowForm(false);
    setEditing(null);
    loadExchanges();
  };

  const handleDelete = async (id) => {
    await base44.entities.Exchange.delete(id);
    loadExchanges();
  };

  const recentExchanges = exchanges.filter(e => eventDate(e).valueOf() >= MONTH_START.valueOf());
  const prevMonthExchanges = exchanges.filter(e => eventDate(e).valueOf() >= JUNE_START.valueOf() && eventDate(e).valueOf() < MONTH_START.valueOf());
  const historicalExchanges = exchanges.filter(e => eventDate(e).valueOf() < JUNE_START.valueOf());

  const searchResults = searchQuery.trim()
    ? exchanges.filter(e => {
        const q = searchQuery.toLowerCase();
        return [
          e.modality,
          `${e.dextrose_concentration}% dextrose`,
          e.solution_appearance,
          e.notes,
          eventDate(e).format("MMM D, YYYY HH:mm"),
        ].filter(Boolean).join(" ").toLowerCase().includes(q);
      })
    : null;

  const groupByDay = (items) => items.reduce((acc, e) => {
    const day = eventDate(e).format("YYYY-MM-DD");
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  const recentGrouped = groupByDay(recentExchanges);
  const prevMonthGrouped = groupByDay(prevMonthExchanges);
  const historicalGrouped = groupByDay(historicalExchanges);

  const lastSession = exchanges[0];
  const lastUF = lastSession?.ultrafiltration || 0;

  const handleEdit = (e) => { setEditing(e); setShowForm(true); };

  const renderDaySection = (day, items) => {
    const dayUF = items.reduce((acc, e) => acc + (e.ultrafiltration || 0), 0);
    return (
      <section key={day}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {moment(day).calendar(null, { sameDay: "[Today]", lastDay: "[Yesterday]", lastWeek: "dddd", sameElse: "MMM D, YYYY" })}
          </h3>
          <span className="text-xs font-medium text-primary">UF: {dayUF > 0 ? "+" : ""}{dayUF} mL</span>
        </div>
        <div className="space-y-2">
          {items.map(e => (
            <ExchangeCard key={e.id} exchange={e} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      </section>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Exchanges</h1>
          <p className="text-sm text-muted-foreground mt-1">Track each dialysis exchange</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Log
        </Button>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Last Session UF</p>
        <p className="text-3xl font-bold text-primary mt-1">{lastUF > 0 ? "+" : ""}{lastUF} <span className="text-lg font-medium">mL</span></p>
        <p className="text-xs text-muted-foreground mt-2">{lastSession ? `Previous session · ${eventDate(lastSession).format("MMM D, HH:mm")}` : "No sessions logged yet"}</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search exchanges by modality, appearance, notes, date..."
          className="rounded-xl pl-9"
        />
      </div>

      {exchanges.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Droplets size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No exchanges logged yet</p>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-4 rounded-xl">Log your first exchange</Button>
        </div>
      ) : searchResults ? (
        searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No exchanges match "{searchQuery}"</p>
          </div>
        ) : (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</h3>
            <div className="space-y-2">
              {searchResults.map(e => (
                <ExchangeCard key={e.id} exchange={e} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        )
      ) : (
        <>
          {recentExchanges.length === 0 && prevMonthExchanges.length === 0 && historicalExchanges.length > 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">All exchanges are in the sections below</p>
            </div>
          )}
          {Object.entries(recentGrouped).map(([day, items]) => renderDaySection(day, items))}

          {prevMonthExchanges.length > 0 && (
            <section>
              <button
                onClick={() => setShowPrevMonth(!showPrevMonth)}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-all"
              >
                <div className="flex items-center gap-2">
                  {showPrevMonth ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <h3 className="text-sm font-semibold">{prevMonthLabel}</h3>
                </div>
                <span className="text-xs text-muted-foreground">{prevMonthExchanges.length} entries</span>
              </button>
              {showPrevMonth && (
                <div className="space-y-6 mt-3">
                  {Object.entries(prevMonthGrouped).map(([day, items]) => renderDaySection(day, items))}
                </div>
              )}
            </section>
          )}

          {historicalExchanges.length > 0 && (
            <section>
              <button
                onClick={() => setShowHistorical(!showHistorical)}
                className="flex items-center justify-between w-full p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-all"
              >
                <div className="flex items-center gap-2">
                  {showHistorical ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  <h3 className="text-sm font-semibold">Historical</h3>
                </div>
                <span className="text-xs text-muted-foreground">{historicalExchanges.length} entries · before {prevMonthLabel}</span>
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
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? "Edit Exchange" : "Log Exchange"}</DialogTitle></DialogHeader>
          <ExchangeForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}