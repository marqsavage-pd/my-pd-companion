import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { StickyNote, Plus, Check, Trash2, MessageCircleQuestion, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import moment from "moment";

export default function Notes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("question");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.AppointmentNote.list("-created_date", 500);
    setNotes(data);
    setLoading(false);
  };

  const add = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    await base44.entities.AppointmentNote.create({ text: text.trim(), category });
    setText("");
    setSaving(false);
    load();
  };

  const toggle = async (n) => {
    await base44.entities.AppointmentNote.update(n.id, { resolved: !n.resolved });
    load();
  };

  const remove = async (id) => {
    await base44.entities.AppointmentNote.delete(id);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  const open = notes.filter(n => !n.resolved);
  const resolved = notes.filter(n => n.resolved);
  const openQuestions = open.filter(n => n.category === "question");
  const openSupplies = open.filter(n => n.category === "supply");

  const renderNote = (n) => (
    <div key={n.id} className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border group">
      <button onClick={() => toggle(n)} className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${n.resolved ? "bg-primary border-primary" : "border-muted-foreground/30 hover:border-primary"}`}>
        {n.resolved && <Check size={14} className="text-primary-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${n.resolved ? "text-muted-foreground line-through" : "text-foreground"}`}>{n.text}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{moment.utc(n.created_date).local().format("MMM D")}</p>
      </div>
      <button onClick={() => remove(n.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-destructive/10 transition-all shrink-0">
        <Trash2 size={14} className="text-muted-foreground" />
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><StickyNote size={24} /> Notes</h1>
        <p className="text-sm text-muted-foreground mt-1">Things to ask about at your next appointment</p>
      </div>

      <form onSubmit={add} className="bg-card border rounded-2xl p-4 space-y-3">
        <Input value={text} onChange={e => setText(e.target.value)} placeholder="Add a question or supply to request..." className="rounded-xl" />
        <div className="flex gap-2">
          {[
            { value: "question", label: "Ask at appointment", icon: MessageCircleQuestion },
            { value: "supply", label: "Supply to request", icon: Package },
          ].map(c => (
            <button key={c.value} type="button" onClick={() => setCategory(c.value)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${category === c.value ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"}`}>
              <c.icon size={15} /> {c.label}
            </button>
          ))}
        </div>
        <Button type="submit" disabled={saving || !text.trim()} className="w-full rounded-xl h-11">
          <Plus size={16} /> {saving ? "Adding..." : "Add Note"}
        </Button>
      </form>

      {notes.length === 0 && (
        <div className="text-center py-12">
          <div className="w-14 h-14 rounded-2xl bg-secondary mx-auto mb-3 flex items-center justify-center">
            <StickyNote size={22} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">No notes yet. Add questions or supplies to discuss at your next appointment.</p>
        </div>
      )}

      {openQuestions.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2"><MessageCircleQuestion size={18} /> To Ask ({openQuestions.length})</h2>
          <div className="space-y-2">{openQuestions.map(renderNote)}</div>
        </section>
      )}

      {openSupplies.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-semibold mb-3 flex items-center gap-2"><Package size={18} /> Supplies to Request ({openSupplies.length})</h2>
          <div className="space-y-2">{openSupplies.map(renderNote)}</div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-semibold mb-3 text-muted-foreground">Resolved ({resolved.length})</h2>
          <div className="space-y-2">{resolved.map(renderNote)}</div>
        </section>
      )}
    </div>
  );
}