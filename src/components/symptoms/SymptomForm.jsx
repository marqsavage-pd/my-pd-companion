import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import moment from "moment";

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

export default function SymptomForm({ onSubmit, onCancel, initial, recentExchanges = [] }) {
  const [form, setForm] = useState({
    symptom_type: initial?.symptom_type || "",
    severity: initial?.severity ?? null,
    notes: initial?.notes || "",
    associated_exchange_id: initial?.associated_exchange_id || "",
  });
  const [saving, setSaving] = useState(false);

  const isHighSeverity = form.severity >= 4;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.symptom_type) return;
    setSaving(true);
    await onSubmit({
      ...form,
      associated_exchange_id: form.associated_exchange_id || null,
      logged_at: initial?.logged_at || new Date().toISOString(),
    });
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
        <label className="block text-sm font-medium mb-2">How are you feeling about it? {!form.severity && <span className="text-muted-foreground font-normal">— pick one</span>}</label>
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

      {/* Context-aware correlation prompt for high-severity symptoms */}
      {isHighSeverity && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={15} />
            <p className="text-sm font-semibold">Help your clinic connect the dots</p>
          </div>
          <p className="text-xs text-amber-700/90">Was this symptom during or right after an exchange? Linking it helps spot patterns.</p>
          <select
            value={form.associated_exchange_id}
            onChange={e => setForm({ ...form, associated_exchange_id: e.target.value })}
            className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <option value="">Not during an exchange</option>
            {recentExchanges.map(ex => (
              <option key={ex.id} value={ex.id}>
                {moment.utc(ex.logged_at || ex.created_date).local().format("MMM D, HH:mm")} · {ex.modality?.toUpperCase()} · {ex.dextrose_concentration}% · UF {ex.ultrafiltration || 0} mL
              </option>
            ))}
          </select>
        </div>
      )}

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
        <Button type="submit" disabled={!form.symptom_type || !form.severity || saving} className="flex-1 rounded-xl h-12 text-base">
          {saving ? "Saving..." : (initial ? "Update" : "Log Symptom")}
        </Button>
      </div>
    </form>
  );
}