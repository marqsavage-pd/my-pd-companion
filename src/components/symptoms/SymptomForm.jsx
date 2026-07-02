import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const symptomTypes = [
  { value: "tremor", label: "Tremor" },
  { value: "stiffness", label: "Stiffness / Rigidity" },
  { value: "slowness", label: "Slowness of Movement" },
  { value: "balance", label: "Balance Issues" },
  { value: "freezing", label: "Freezing" },
  { value: "fatigue", label: "Fatigue" },
  { value: "pain", label: "Pain / Discomfort" },
  { value: "sleep_issues", label: "Sleep Issues" },
  { value: "anxiety", label: "Anxiety" },
  { value: "depression", label: "Low Mood" },
  { value: "brain_fog", label: "Brain Fog" },
  { value: "other", label: "Other" },
];

const bodySides = [
  { value: "left", label: "Left Side" },
  { value: "right", label: "Right Side" },
  { value: "both", label: "Both Sides" },
  { value: "not_applicable", label: "N/A" },
];

export default function SymptomForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    symptom_type: "",
    severity: 3,
    body_side: "not_applicable",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symptom_type) return;
    setSaving(true);
    await onSubmit({ ...form, logged_at: new Date().toISOString() });
    setSaving(false);
  };

  const severityLabels = ["", "Minimal", "Mild", "Moderate", "Significant", "Severe"];
  const severityColors = ["", "bg-emerald-400", "bg-lime-400", "bg-amber-400", "bg-orange-400", "bg-red-400"];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">What are you experiencing?</label>
        <Select value={form.symptom_type} onValueChange={v => setForm({ ...form, symptom_type: v })}>
          <SelectTrigger><SelectValue placeholder="Select symptom type" /></SelectTrigger>
          <SelectContent>
            {symptomTypes.map(s => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">How severe? <span className="text-muted-foreground font-normal">— {severityLabels[form.severity]}</span></label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => setForm({ ...form, severity: n })}
              className={`flex-1 h-12 rounded-xl text-sm font-semibold transition-all duration-200 ${
                form.severity === n
                  ? `${severityColors[n]} text-white shadow-md scale-105`
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Which side?</label>
        <div className="flex gap-2">
          {bodySides.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm({ ...form, body_side: s.value })}
              className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${
                form.body_side === s.value
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Any details about what you're feeling..."
          className="resize-none rounded-xl"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>}
        <Button type="submit" disabled={!form.symptom_type || saving} className="flex-1 rounded-xl h-12 text-base">
          {saving ? "Saving..." : "Log Symptom"}
        </Button>
      </div>
    </form>
  );
}