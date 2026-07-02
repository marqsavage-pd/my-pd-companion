import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function TripForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    destination: initial?.destination || "",
    start_date: initial?.start_date || "",
    end_date: initial?.end_date || "",
    modality: initial?.modality || "capd",
    exchanges_per_day: initial?.exchanges_per_day ?? 4,
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.destination.trim() || !form.start_date || !form.end_date) return;
    setSaving(true);
    await onSubmit({
      destination: form.destination.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      modality: form.modality,
      exchanges_per_day: Number(form.exchanges_per_day) || 1,
      notes: form.notes.trim() || undefined,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Destination</Label>
        <Input value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })}
          placeholder="e.g. Family visit — Denver, CO" className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Start date</Label>
          <Input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">End date</Label>
          <Input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Modality</Label>
          <select value={form.modality} onChange={e => setForm({ ...form, modality: e.target.value })}
            className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="capd">CAPD</option>
            <option value="apd">APD</option>
          </select>
        </div>
        <div>
          <Label className="text-xs">Exchanges per day</Label>
          <Input type="number" min="1" value={form.exchanges_per_day} onChange={e => setForm({ ...form, exchanges_per_day: e.target.value })} className="mt-1" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Any extra context" className="mt-1" rows={2} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={submit} disabled={saving || !form.destination.trim() || !form.start_date || !form.end_date} className="flex-1 rounded-xl">
          {saving ? "Saving..." : initial ? "Update" : "Add trip"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
      </div>
    </div>
  );
}