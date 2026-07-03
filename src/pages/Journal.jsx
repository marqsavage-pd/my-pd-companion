import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, BookOpen, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import moment from "moment";

const moods = [
  { value: "great", emoji: "😊", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "rough", emoji: "😟", label: "Rough" },
  { value: "difficult", emoji: "😣", label: "Difficult" },
];

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", mood: "okay" });
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => { loadEntries(); }, []);

  const loadEntries = async () => {
    setLoading(true);
    const data = await base44.entities.JournalEntry.list("-created_date", 100);
    setEntries(data);
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.content || !form.mood) return;
    setSaving(true);
    if (editingId) {
      await base44.entities.JournalEntry.update(editingId, form);
    } else {
      await base44.entities.JournalEntry.create(form);
    }
    setSaving(false);
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", content: "", mood: "okay" });
    loadEntries();
  };

  const handleEdit = (entry) => {
    setEditingId(entry.id);
    setForm({ title: entry.title || "", content: entry.content || "", mood: entry.mood || "okay" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.JournalEntry.delete(id);
    loadEntries();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-secondary border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Reflect on your day</p>
        </div>
        <Button onClick={() => { setEditingId(null); setForm({ title: "", content: "", mood: "okay" }); setShowForm(true); }} className="rounded-xl gap-2">
          <Plus size={16} /> Write
        </Button>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto mb-4 flex items-center justify-center">
            <BookOpen size={24} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No journal entries yet</p>
          <Button onClick={() => { setEditingId(null); setForm({ title: "", content: "", mood: "okay" }); setShowForm(true); }} className="mt-4 rounded-xl">Write your first entry</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const moodObj = moods.find(m => m.value === entry.mood);
            const isExpanded = expandedId === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-card rounded-2xl border p-4 cursor-pointer hover:shadow-sm transition-all group"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">{moodObj?.emoji || "😐"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {entry.title && <p className="text-sm font-semibold">{entry.title}</p>}
                      <span className="text-xs text-muted-foreground capitalize">{moodObj?.label}</span>
                    </div>
                    <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-2"}`}>{entry.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{moment(entry.created_date).format("MMM D, YYYY · h:mm A")}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(entry); }}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-all"
                    >
                      <Pencil size={14} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 size={14} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={(open) => { setShowForm(open); if (!open) setEditingId(null); }}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-heading text-xl">{editingId ? "Edit Entry" : "New Entry"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">How are you feeling?</label>
              <div className="flex gap-2">
                {moods.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setForm({ ...form, mood: m.value })}
                    className={`flex-1 flex flex-col items-center py-3 rounded-xl transition-all ${
                      form.mood === m.value ? "bg-primary/10 ring-2 ring-primary scale-105" : "bg-secondary hover:bg-secondary/80"
                    }`}
                  >
                    <span className="text-xl mb-1">{m.emoji}</span>
                    <span className="text-[10px] font-medium">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Title <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="A few words to capture the moment" className="rounded-xl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">What's on your mind?</label>
              <Textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                placeholder="Write freely — observations, feelings, questions for your doctor..."
                className="resize-none rounded-xl"
                rows={5}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button type="submit" disabled={!form.content || saving} className="flex-1 rounded-xl h-12 text-base">
                {saving ? "Saving..." : (editingId ? "Update" : "Save Entry")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}