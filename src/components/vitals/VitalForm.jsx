import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function VitalForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    weight_kg: "",
    systolic_bp: "",
    diastolic_bp: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.weight_kg && !form.systolic_bp) return;
    setSaving(true);
    await onSubmit({
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : null,
      systolic_bp: form.systolic_bp ? parseInt(form.systolic_bp) : null,
      diastolic_bp: form.diastolic_bp ? parseInt(form.diastolic_bp) : null,
      notes: form.notes,
      measured_at: new Date().toISOString(),
    });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Weight (kg)</label>
        <Input
          type="number"
          step="0.1"
          value={form.weight_kg}
          onChange={e => setForm({ ...form, weight_kg: e.target.value })}
          placeholder="e.g. 70.5"
          className="rounded-xl"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Blood Pressure</label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={form.systolic_bp}
            onChange={e => setForm({ ...form, systolic_bp: e.target.value })}
            placeholder="Systolic"
            className="rounded-xl"
          />
          <span className="text-muted-foreground font-medium">/</span>
          <Input
            type="number"
            value={form.diastolic_bp}
            onChange={e => setForm({ ...form, diastolic_bp: e.target.value })}
            placeholder="Diastolic"
            className="rounded-xl"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1.5">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="How are you feeling today?"
          className="resize-none rounded-xl"
          rows={2}
        />
      </div>
      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>}
        <Button type="submit" disabled={saving || (!form.weight_kg && !form.systolic_bp)} className="flex-1 rounded-xl h-12 text-base">
          {saving ? "Saving..." : "Save Vitals"}
        </Button>
      </div>
    </form>
  );
}