import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const symptomTypes = [
  { value: "nausea", label: "Nausea" },
  { value: "abdominal_pain", label: "Abdominal Pain" },
  { value: "swelling", label: "Swelling / Edema" },
  { value: "shortness_of_breath", label: "Shortness of Breath" },
  { value: "fatigue", label: "Fatigue" },
  { value: "fever", label: "Fever" },
  { value: "chills", label: "Chills" },
  { value: "constipation", label: "Constipation" },
  { value: "exit_site_redness", label: "Exit Site Redness" },
  { value: "exit_site_drainage", label: "Exit Site Drainage" },
  { value: "muscle_cramps", label: "Muscle Cramps" },
  { value: "dizziness", label: "Dizziness" },
  { value: "itching", label: "Itching" },
  { value: "poor_appetite", label: "Poor Appetite" },
  { value: "sleep_issues", label: "Sleep Issues" },
  { value: "other", label: "Other" },
];

export default function SymptomForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    symptom_type: initial?.symptom_type || "",
    severity: initial?.severity ?? 3,
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symptom_type) return;
    setSaving(true);
    await onSubmit({ ...form, logged_at: initial?.logged_at || new Date().toISOString() });
    setSaving(false);
  };

  const severityLabels = ["", "Minimal", "Mild", "Moderate", "Significant", "Severe"];
  const severityColors = ["", "bg-emerald-400", "bg-lime-400", "bg-amber-400", "bg-orange-400", "bg-red-400"];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">What are you experiencing?</label>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
          {symptomTypes.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => setForm({ ...form, symptom_type: s.value })}
              className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all ${
                form.symptom_type === s.value ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
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
                form.severity === n ? `${severityColors[n]} text-white shadow-md scale-105` : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {n}
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
          {saving ? "Saving..." : (initial ? "Update" : "Log Symptom")}
        </Button>
      </div>
    </form>
  );
}