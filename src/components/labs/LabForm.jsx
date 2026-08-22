import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import moment from "moment";

const LAB_FIELDS = [
  { key: "creatinine", label: "Creatinine", unit: "mg/dL" },
  { key: "bun", label: "BUN", unit: "mg/dL" },
  { key: "potassium", label: "Potassium", unit: "mEq/L" },
  { key: "hemoglobin", label: "Hemoglobin", unit: "g/dL" },
  { key: "calcium", label: "Calcium", unit: "mg/dL" },
  { key: "phosphorus", label: "Phosphorus", unit: "mg/dL" },
  { key: "pth", label: "PTH", unit: "pg/mL" },
  { key: "albumin", label: "Albumin", unit: "g/dL" },
  { key: "egfr", label: "eGFR", unit: "mL/min" },
];

export default function LabForm({ onSubmit, onCancel, initial }) {
  const [date, setDate] = useState(initial?.date || moment().format("YYYY-MM-DD"));
  const [values, setValues] = useState(() => {
    const v = {};
    LAB_FIELDS.forEach(f => { v[f.key] = initial?.[f.key] ?? ""; });
    return v;
  });
  const [notes, setNotes] = useState(initial?.notes || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { date, notes: notes || undefined };
    LAB_FIELDS.forEach(f => {
      const val = parseFloat(values[f.key]);
      if (!isNaN(val)) payload[f.key] = val;
    });
    await onSubmit(payload);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1.5">Date Drawn</label>
        <Input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="rounded-xl"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {LAB_FIELDS.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">{f.label}</label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                value={values[f.key]}
                onChange={e => setValues({ ...values, [f.key]: e.target.value })}
                placeholder="—"
                className="rounded-xl pr-14"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{f.unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any lab observations..."
          className="resize-none rounded-xl"
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-1">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>}
        <Button type="submit" disabled={saving} className="flex-1 rounded-xl h-12">
          {saving ? "Saving..." : (initial ? "Update" : "Save Labs")}
        </Button>
      </div>
    </form>
  );
}