import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Package, Trash2, Pencil, AlertTriangle, CheckCircle2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SupplyForm from "@/components/supplies/SupplyForm";
import moment from "moment";

export default function Inventory() {
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.Supply.list("-updated_date", 200);
    setSupplies(data);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await base44.entities.Supply.update(editing.id, data);
    } else {
      await base44.entities.Supply.create(data);
    }
    setShowForm(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    await base44.entities.Supply.delete(id);
    load();
  };

  const handleRestock = async (item, added) => {
    await base44.entities.Supply.update(item.id, {
      qty: (item.qty || 0) + added,
      last_restocked: moment().format("YYYY-MM-DD"),
      ordered: false,
      ordered_date: undefined,
      expected_delivery: undefined,
    });
    load();
  };

  const toggleOrdered = async (item) => {
    const nowOrdered = !item.ordered;
    await base44.entities.Supply.update(item.id, {
      ordered: nowOrdered,
      ordered_date: nowOrdered ? moment().format("YYYY-MM-DD") : undefined,
      expected_delivery: nowOrdered ? moment().add(5, "days").format("YYYY-MM-DD") : undefined,
    });
    load();
  };

  const lowStock = supplies.filter(s => s.qty != null && s.reorder_point != null && s.qty <= s.reorder_point);
  const totalItems = supplies.length;

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">Track medical & home supply stock</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Add
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl p-5">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">Tracked Items</p>
          <p className="text-3xl font-bold text-primary mt-1">{totalItems}</p>
        </div>
        <div className={`border rounded-2xl p-5 ${lowStock.length > 0 ? "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200" : "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200"}`}>
          <p className={`text-xs font-semibold uppercase tracking-wider ${lowStock.length > 0 ? "text-amber-700" : "text-emerald-700"}`}>Need Reorder</p>
          <p className={`text-3xl font-bold mt-1 ${lowStock.length > 0 ? "text-amber-700" : "text-emerald-700"}`}>{lowStock.length}</p>
        </div>
      </div>

      {supplies.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Package size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No supplies tracked yet</p>
          <Button onClick={() => setShowForm(true)} className="mt-4 rounded-xl">Add your first item</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {supplies.map(item => {
            const isLow = item.qty != null && item.reorder_point != null && item.qty <= item.reorder_point;
            return (
              <div key={item.id} className="p-4 rounded-2xl bg-card border group">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLow ? "bg-amber-100" : "bg-primary/10"}`}>
                    {isLow ? <AlertTriangle size={18} className="text-amber-600" /> : <Package size={18} className="text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.ordered && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
                          <ShoppingCart size={10} /> Ordered
                        </span>
                      )}
                    </div>
                    {item.detail && <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>}
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">On hand</p>
                        <p className={`text-sm font-bold ${isLow ? "text-amber-600" : ""}`}>{item.qty ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase">Reorder at</p>
                        <p className="text-sm font-medium">{item.reorder_point ?? "—"}</p>
                      </div>
                      {item.expected_delivery && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Delivery</p>
                          <p className="text-sm font-medium">{moment(item.expected_delivery).format("MMM D")}</p>
                        </div>
                      )}
                      {item.last_restocked && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase">Restocked</p>
                          <p className="text-sm font-medium">{moment(item.last_restocked).format("MMM D")}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => handleRestock(item, 1)}>
                        +1
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={() => handleRestock(item, 5)}>
                        +5
                      </Button>
                      {isLow && !item.ordered && (
                        <Button size="sm" className="h-7 text-xs rounded-lg gap-1" onClick={() => toggleOrdered(item)}>
                          <ShoppingCart size={11} /> Mark ordered
                        </Button>
                      )}
                      {item.ordered && (
                        <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg gap-1" onClick={() => toggleOrdered(item)}>
                          <CheckCircle2 size={11} /> Restocked
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-secondary">
                      <Pencil size={14} className="text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-destructive/10">
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? "Edit Item" : "Add Supply"}</DialogTitle></DialogHeader>
          <SupplyForm onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} initial={editing} />
        </DialogContent>
      </Dialog>
    </div>
  );
}