import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Droplets, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExchangeForm from "@/components/exchanges/ExchangeForm";
import moment from "moment";

const appearanceColors = {
  clear: "bg-emerald-100 text-emerald-700",
  cloudy: "bg-red-100 text-red-700",
  bloody: "bg-orange-100 text-orange-700",
  fibrin: "bg-amber-100 text-amber-700",
};

export default function Exchanges() {
  const [exchanges, setExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadExchanges(); }, []);

  const loadExchanges = async () => {
    setLoading(true);
    const data = await base44.entities.Exchange.list("-logged_at", 100);
    setExchanges(data);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    await base44.entities.Exchange.create(data);
    setShowForm(false);
    loadExchanges();
  };

  const handleDelete = async (id) => {
    await base44.entities.Exchange.delete(id);
    loadExchanges();
  };

  const grouped = exchanges.reduce((acc, e) => {
    const day = moment(e.logged_at).format("YYYY-MM-DD");
    if (!acc[day]) acc[day] = [];
    acc[day].push(e);
    return acc;
  }, {});

  const todayUF = exchanges
    .filter(e => moment(e.logged_at).isSame(moment(), "day"))
    .reduce((acc, e) => acc + (e.ultrafiltration || 0), 0);

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
        <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
          <Plus size={16} /> Log
        </Button>
      </div>

      <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider">Today's Total UF</p>
        <p className="text-3xl font-bold text-primary mt-1">{todayUF > 0 ? "+" : ""}{todayUF} <span className="text-lg font-medium">mL</span></p>
      </div>

      {exchanges.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Droplets size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No exchanges logged yet</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 rounded-xl">Log your first exchange</Button>
        </div>
      ) : (
        Object.entries(grouped).map(([day, items]) => {
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
                  <div key={e.id} className="p-4 rounded-2xl bg-card border group">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Droplets size={18} className="text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold uppercase">{e.modality}</p>
                          <span className="text-xs text-muted-foreground">{e.dextrose_concentration}% dextrose</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${appearanceColors[e.solution_appearance] || "bg-secondary text-muted-foreground"}`}>
                            {e.solution_appearance}
                          </span>
                          {e.solution_appearance === "cloudy" && <AlertTriangle size={13} className="text-destructive" />}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Fill</p>
                            <p className="text-sm font-medium">{e.fill_volume} mL</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">Drain</p>
                            <p className="text-sm font-medium">{e.drain_volume} mL</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase">UF</p>
                            <p className={`text-sm font-bold ${e.ultrafiltration >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                              {e.ultrafiltration > 0 ? "+" : ""}{e.ultrafiltration} mL
                            </p>
                          </div>
                        </div>
                        {e.dwell_hours && <p className="text-xs text-muted-foreground mt-1">Dwell: {e.dwell_hours} hrs</p>}
                        {e.notes && <p className="text-xs text-muted-foreground mt-1 italic">{e.notes}</p>}
                        <p className="text-[10px] text-muted-foreground mt-1">{moment(e.logged_at).format("h:mm A")}</p>
                      </div>
                      <button onClick={() => handleDelete(e.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all">
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl">Log Exchange</DialogTitle></DialogHeader>
          <ExchangeForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}