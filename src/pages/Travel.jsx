import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Plane, Trash2, Calendar, Droplets, Package, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TripForm from "@/components/travel/TripForm";
import moment from "moment";

function estimateSupplies(trip) {
  const days = moment(trip.end_date).diff(moment(trip.start_date), "days") + 1;
  const exchanges = days * (trip.exchanges_per_day || 1);
  const spare = Math.ceil(exchanges * 0.2);
  const isApd = trip.modality === "apd";

  return [
    { name: "PD Solution bags", qty: exchanges + spare, hint: `${exchanges} + 20% spare` },
    { name: isApd ? "Cycler tubing sets" : "Transfer sets / tubing", qty: Math.ceil(days / 30) + 2, hint: "Replace monthly + spares" },
    { name: "Drain bags", qty: isApd ? days + 2 : exchanges + spare, hint: isApd ? "1/day + spares" : "1 per exchange" },
    { name: "Mini caps + betadine", qty: exchanges + spare, hint: "1 per exchange" },
    { name: "Masks", qty: exchanges * 2, hint: "2 per exchange" },
    { name: "Gloves", qty: exchanges * 2, hint: "2 per exchange" },
    { name: "Hand sanitizer", qty: Math.ceil(days / 3), hint: "1 bottle per 3 days" },
    { name: "Exit-site care kits", qty: days, hint: "1 per day" },
    { name: "Sharps container", qty: Math.max(1, Math.ceil(days / 14)), hint: "1 per ~2 weeks" },
  ];
}

export default function Travel() {
  const [trips, setTrips] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [tripData, supplyData] = await Promise.all([
      base44.entities.Trip.list("-start_date", 100),
      base44.entities.Supply.list("-updated_date", 200),
    ]);
    setTrips(tripData);
    setSupplies(supplyData);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    await base44.entities.Trip.create(data);
    setShowForm(false);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Trip.delete(id);
    load();
  };

  const findSupplyMatch = (name) => {
    const lower = name.toLowerCase();
    return supplies.find(s => {
      const t = (s.title || "").toLowerCase();
      return t.includes(lower) || lower.includes(t) || t.includes("solution") && lower.includes("solution") ||
        t.includes("mask") && lower.includes("mask") || t.includes("glove") && lower.includes("glove") ||
        t.includes("sanitizer") && lower.includes("sanitizer") || t.includes("drain") && lower.includes("drain") ||
        t.includes("tubing") && lower.includes("tubing") || t.includes("transfer") && lower.includes("transfer") ||
        t.includes("sharps") && lower.includes("sharps") || t.includes("exit") && lower.includes("exit") ||
        t.includes("cap") && lower.includes("cap") && !t.includes("escape");
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Travel</h1>
          <p className="text-sm text-muted-foreground mt-1">Estimate supplies for planned trips</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="rounded-xl gap-2">
          <Plus size={16} /> Trip
        </Button>
      </div>

      {trips.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Plane size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No trips planned yet</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 rounded-xl">Plan your first trip</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map(trip => {
            const days = moment(trip.end_date).diff(moment(trip.start_date), "days") + 1;
            const estimates = estimateSupplies(trip);
            const expanded = expandedId === trip.id;
            const upcoming = moment(trip.start_date).isSameOrAfter(moment(), "day");
            return (
              <div key={trip.id} className="rounded-2xl bg-card border overflow-hidden">
                <button onClick={() => setExpandedId(expanded ? null : trip.id)} className="w-full p-4 text-left flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${upcoming ? "bg-primary/10" : "bg-secondary"}`}>
                    <Plane size={18} className={upcoming ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{trip.destination}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar size={11} /> {moment(trip.start_date).format("MMM D")} – {moment(trip.end_date).format("MMM D")}
                      </span>
                      <span className="text-xs text-muted-foreground">{days} day{days !== 1 ? "s" : ""}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Droplets size={11} /> {trip.modality.toUpperCase()} · {trip.exchanges_per_day}/day
                      </span>
                    </div>
                  </div>
                  <div className="bg-primary/10 rounded-lg px-2.5 py-1 shrink-0">
                    <span className="text-xs font-bold text-primary">{estimates.length}</span>
                    <span className="text-[10px] text-primary ml-1">items</span>
                  </div>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 border-t pt-3 space-y-2">
                    {trip.notes && <p className="text-xs text-muted-foreground italic mb-2">{trip.notes}</p>}
                    {estimates.map((est, i) => {
                      const match = findSupplyMatch(est.name);
                      const hasEnough = match && match.qty != null && match.qty >= est.qty;
                      const shortBy = match && match.qty != null ? est.qty - match.qty : null;
                      return (
                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/50">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${hasEnough ? "bg-emerald-100" : "bg-amber-100"}`}>
                            {hasEnough ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Package size={15} className="text-amber-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{est.name}</p>
                            <p className="text-[10px] text-muted-foreground">{est.hint}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold">{est.qty}</p>
                            {match ? (
                              <p className={`text-[10px] ${hasEnough ? "text-emerald-600" : "text-amber-600"}`}>
                                {hasEnough ? `Have ${match.qty}` : `Short ${shortBy}`}
                              </p>
                            ) : (
                              <p className="text-[10px] text-muted-foreground">not tracked</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between items-center pt-1">
                      <p className="text-xs text-muted-foreground">Check inventory levels above against your stock</p>
                      <button onClick={() => handleDelete(trip.id)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                        <Trash2 size={14} className="text-destructive" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl">Plan a Trip</DialogTitle></DialogHeader>
          <TripForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}