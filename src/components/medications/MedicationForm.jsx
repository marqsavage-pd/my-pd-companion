import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function MedicationForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState(initial || {
    name: "",
    dosage: "",
    frequency: "",
    instructions: "",
    time_of_day: [],
  });
  const [saving, setSaving] = useState(false);
  const [timeInput, setTimeInput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.dosage) return;
    setSaving(true);
    await onSubmit({ ...form, active: true });
    setSaving(false);
  };

  const addTime = () => {
    if (timeInput && !form.time_of_day.includes(timeInput)) {
      setForm({ ...form, time_of_day: [...form.time_of_day, timeInput] });
      setTimeInput("");
    }
  };

  const removeTime = (t) => {
    setForm({ ...form, time_of_day: form.time_of_day.filter(x => x !== t) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Medication Name</label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Levodopa/Carbidopa" className="rounded-xl" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Dosage</label>
        <Input value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} placeholder="e.g. 25/100 mg" className="rounded-xl" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Frequency</label>
        <Input value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} placeholder="e.g. 3 times daily" className="rounded-xl" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Scheduled Times</label>
        <div className="flex gap-2 mb-2">
          <Input type="time" value={timeInput} onChange={e => setTimeInput(e.target.value)} className="rounded-xl" />
          <Button type="button" variant="outline" onClick={addTime} className="rounded-xl">Add</Button>
        </div>
        {form.time_of_day.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.time_of_day.map(t => (
              <span key={t} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                {t}
                <button type="button" onClick={() => removeTime(t)} className="hover:text-destructive ml-1">×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Special Instructions <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="e.g. Take with food" className="resize-none rounded-xl" rows={2} />
      </div>
      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>}
        <Button type="submit" disabled={!form.name || !form.dosage || saving} className="flex-1 rounded-xl h-12 text-base">
          {saving ? "Saving..." : (initial ? "Update" : "Add Medication")}
        </Button>
      </div>
    </form>
  );
}