import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

export default function ExchangeForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    modality: initial?.modality || "capd",
    dextrose_concentration: initial?.dextrose_concentration ?? 1.5,
    fill_volume: initial?.fill_volume ?? 2000,
    drain_volume: initial?.drain_volume ?? "",
    dwell_hours: initial?.dwell_hours ?? "",
    lost_dwell: initial?.lost_dwell ?? "",
    solution_appearance: initial?.solution_appearance || "clear",
    notes: initial?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const drain = parseFloat(form.drain_volume) || 0;
  const fill = parseFloat(form.fill_volume) || 0;
  const uf = drain - fill;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      ...form,
      fill_volume: fill,
      drain_volume: drain,
      ultrafiltration: uf,
      dwell_hours: form.dwell_hours ? parseFloat(form.dwell_hours) : null,
      lost_dwell: form.lost_dwell ? parseFloat(form.lost_dwell) : null,
      logged_at: initial?.logged_at || new Date().toISOString(),
    });
    setSaving(false);
  };

  const concentrations = [1.5, 2.5, 4.25];
  const appearances = [
    { value: "clear", label: "Clear", safe: true },
    { value: "cloudy", label: "Cloudy", safe: false },
    { value: "bloody", label: "Bloody", safe: false },
    { value: "fibrin", label: "Fibrin", safe: true },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium mb-2">Modality</label>
        <div className="flex gap-2">
          {[
            { value: "capd", label: "CAPD", sub: "Manual" },
            { value: "apd", label: "APD", sub: "Cycler" },
          ].map(m => (
            <button
              key={m.value}
              type="button"
              onClick={() => setForm({ ...form, modality: m.value })}
              className={`flex-1 py-3 rounded-xl text-center transition-all ${
                form.modality === m.value ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
              }`}
            >
              <span className="block text-sm font-semibold">{m.label}</span>
              <span className="text-[10px] opacity-80">{m.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Dextrose Concentration</label>
        <div className="flex gap-2">
          {concentrations.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, dextrose_concentration: c })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                form.dextrose_concentration === c ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
              }`}
            >
              {c}%
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1.5">Fill Volume (mL)</label>
          <Input
            type="number"
            step="100"
            value={form.fill_volume}
            onChange={e => setForm({ ...form, fill_volume: e.target.value })}
            className="rounded-xl"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">Drain Volume (mL)</label>
          <Input
            type="number"
            step="100"
            value={form.drain_volume}
            onChange={e => setForm({ ...form, drain_volume: e.target.value })}
            placeholder="e.g. 2200"
            className="rounded-xl"
          />
        </div>
      </div>

      {/* UF display */}
      <div className={`rounded-xl p-4 ${uf > 0 ? "bg-emerald-50 border border-emerald-200" : uf < 0 ? "bg-amber-50 border border-amber-200" : "bg-secondary"}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">Ultrafiltration (net fluid removed)</span>
          <span className={`text-xl font-bold ${uf > 0 ? "text-emerald-600" : uf < 0 ? "text-amber-600" : "text-foreground"}`}>
            {uf > 0 ? "+" : ""}{uf} mL
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Dwell Time (hours) <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Input
          type="number"
          step="0.5"
          value={form.dwell_hours}
          onChange={e => setForm({ ...form, dwell_hours: e.target.value })}
          placeholder="e.g. 4"
          className="rounded-xl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Lost Dwell (minutes) <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Input
          type="number"
          step="5"
          value={form.lost_dwell}
          onChange={e => setForm({ ...form, lost_dwell: e.target.value })}
          placeholder="e.g. 30"
          className="rounded-xl"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Solution Appearance</label>
        <div className="grid grid-cols-2 gap-2">
          {appearances.map(a => (
            <button
              key={a.value}
              type="button"
              onClick={() => setForm({ ...form, solution_appearance: a.value })}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                form.solution_appearance === a.value
                  ? a.safe ? "bg-primary text-primary-foreground shadow-md" : "bg-destructive text-destructive-foreground shadow-md"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {!a.safe && <AlertTriangle size={13} />}
              {a.label}
            </button>
          ))}
        </div>
        {form.solution_appearance === "cloudy" && (
          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
            <AlertTriangle size={12} /> Cloudy effluent may indicate peritonitis — contact your clinic.
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Any observations..."
          className="resize-none rounded-xl"
          rows={2}
        />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>}
        <Button type="submit" disabled={saving || !form.drain_volume} className="flex-1 rounded-xl h-12 text-base">
          {saving ? "Saving..." : (initial ? "Update" : "Log Exchange")}
        </Button>
      </div>
    </form>
  );
}