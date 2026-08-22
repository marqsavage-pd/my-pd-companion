import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FlaskConical, ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LabForm from "@/components/labs/LabForm";
import LabCard from "@/components/labs/LabCard";
import LabTrendChart from "@/components/labs/LabTrendChart";
import moment from "moment";

const LAB_FIELDS = [
  "creatinine", "bun", "potassium", "hemoglobin",
  "calcium", "phosphorus", "pth", "albumin", "egfr",
];

export default function Labs() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [expandedLab, setExpandedLab] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => { loadLabs(); }, []);

  const loadLabs = async () => {
    setLoading(true);
    const data = await base44.entities.LabResult.list("-date", 500);
    setLabs(data);
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    if (editing) {
      await base44.entities.LabResult.update(editing.id, data);
    } else {
      await base44.entities.LabResult.create(data);
    }
    setShowForm(false);
    setEditing(null);
    loadLabs();
  };

  const handleDelete = async (id) => {
    await base44.entities.LabResult.delete(id);
    loadLabs();
  };

  const handleEdit = (lab) => { setEditing(lab); setShowForm(true); };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  const latest = labs[0];
  const prev = labs[1];

  const searchResults = searchQuery.trim()
    ? labs.filter(l => {
        const q = searchQuery.toLowerCase();
        return [
          l.date,
          ...LAB_FIELDS.map(f => l[f] != null ? `${l[f]} ${f}` : ""),
          l.notes,
        ].filter(Boolean).join(" ").toLowerCase().includes(q);
      })
    : null;

  const groupByMonth = (items) => items.reduce((acc, l) => {
    const m = moment(l.date).format("MMMM YYYY");
    if (!acc[m]) acc[m] = [];
    acc[m].push(l);
    return acc;
  }, {});

  const grouped = groupByMonth(labs);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Labs</h1>
          <p className="text-sm text-muted-foreground mt-1">Renal lab results & trends</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Add
        </Button>
      </div>

      {latest && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Most Recent · {moment(latest.date).format("DD-MMM-YY")}</h2>
          <div className="grid grid-cols-3 gap-2">
            {LAB_FIELDS.map(f => (
              <LabCard key={f} field={f} current={latest} previous={prev} />
            ))}
          </div>
        </section>
      )}

      {/* Trend charts */}
      {labs.length > 1 && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Trends</h2>
          <div className="space-y-2">
            {LAB_FIELDS.map(f => {
              const hasData = labs.some(l => l[f] != null);
              if (!hasData) return null;
              const isExpanded = expandedLab === f;
              return (
                <div key={f}>
                  <button
                    onClick={() => setExpandedLab(isExpanded ? null : f)}
                    className="flex items-center justify-between w-full p-3 rounded-2xl bg-card border hover:bg-secondary/50 transition-all"
                  >
                    <span className="text-sm font-medium">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{latest[f] ?? "—"}</span>
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-2">
                      <LabTrendChart field={f} labs={labs} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search labs by value, date, notes..."
          className="rounded-xl pl-9"
        />
      </div>

      {labs.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <FlaskConical size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No lab results yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add manually or sync from your tracking sheet</p>
          <Button onClick={() => { setEditing(null); setShowForm(true); }} className="mt-4 rounded-xl">Add your first lab results</Button>
        </div>
      ) : searchResults ? (
        searchResults.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No labs match "{searchQuery}"</p>
          </div>
        ) : (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</h3>
            <div className="space-y-2">
              {searchResults.map(l => (
                <LabResultRow key={l.id} lab={l} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        )
      ) : (
        Object.entries(grouped).map(([month, items]) => (
          <section key={month}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">{month}</h3>
            <div className="space-y-2">
              {items.map(l => (
                <LabResultRow key={l.id} lab={l} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          </section>
        ))
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditing(null); }}>
        <DialogContent className="rounded-2xl max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editing ? "Edit Lab Results" : "Add Lab Results"}</DialogTitle></DialogHeader>
          <LabForm initial={editing} onSubmit={handleSubmit} onCancel={() => { setShowForm(false); setEditing(null); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LabResultRow({ lab, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const filledFields = LAB_FIELDS.filter(f => lab[f] != null);

  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full p-4 hover:bg-secondary/30 transition-all"
      >
        <div className="text-left">
          <p className="text-sm font-semibold">{moment(lab.date).format("DD-MMM-YY")}</p>
          <p className="text-xs text-muted-foreground">{filledFields.length} value{filledFields.length !== 1 ? "s" : ""}{lab.notes ? " · has notes" : ""}</p>
        </div>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {LAB_FIELDS.map(f => (
              <LabCard key={f} field={f} current={lab} previous={null} />
            ))}
          </div>
          {lab.notes && <p className="text-xs text-muted-foreground pt-2 border-t">{lab.notes}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(lab)} className="rounded-xl flex-1">Edit</Button>
            <Button variant="outline" size="sm" onClick={() => onDelete(lab.id)} className="rounded-xl flex-1 text-destructive">Delete</Button>
          </div>
        </div>
      )}
    </div>
  );
}