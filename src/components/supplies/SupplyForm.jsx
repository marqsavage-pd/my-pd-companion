import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function SupplyForm({ onSubmit, onCancel, initial }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    detail: initial?.detail || "",
    qty: initial?.qty ?? "",
    reorder_point: initial?.reorder_point ?? "",
    ordered: initial?.ordered || false,
    ordered_date: initial?.ordered_date || "",
    expected_delivery: initial?.expected_delivery || "",
    last_restocked: initial?.last_restocked || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const data = {
      title: form.title.trim(),
      detail: form.detail.trim() || undefined,
      qty: form.qty !== "" ? Number(form.qty) : undefined,
      reorder_point: form.reorder_point !== "" ? Number(form.reorder_point) : undefined,
      ordered: form.ordered,
      ordered_date: form.ordered_date || undefined,
      expected_delivery: form.expected_delivery || undefined,
      last_restocked: form.last_restocked || undefined,
    };
    await onSubmit(data);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Item name</Label>
        <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. PD Solution 2.5% 2L bags" className="mt-1" />
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea value={form.detail} onChange={e => setForm({ ...form, detail: e.target.value })}
          placeholder="e.g. Clinic-supplied, baseline 30/month" className="mt-1" rows={2} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Quantity on hand</Label>
          <Input type="number" value={form.qty} onChange={e => setForm({ ...form, qty: e.target.value })}
            placeholder="0" className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Reorder point</Label>
          <Input type="number" value={form.reorder_point} onChange={e => setForm({ ...form, reorder_point: e.target.value })}
            placeholder="0" className="mt-1" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Ordered date</Label>
          <Input type="date" value={form.ordered_date} onChange={e => setForm({ ...form, ordered_date: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Expected delivery</Label>
          <Input type="date" value={form.expected_delivery} onChange={e => setForm({ ...form, expected_delivery: e.target.value })} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs">Last restocked</Label>
          <Input type="date" value={form.last_restocked} onChange={e => setForm({ ...form, last_restocked: e.target.value })} className="mt-1" />
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.ordered} onChange={e => setForm({ ...form, ordered: e.target.checked })}
          className="w-4 h-4 rounded accent-primary" />
        <span className="text-sm">Reorder currently in progress</span>
      </label>
      <div className="flex gap-2 pt-2">
        <Button onClick={submit} disabled={saving || !form.title.trim()} className="flex-1 rounded-xl">
          {saving ? "Saving..." : initial ? "Update" : "Add"}
        </Button>
        <Button variant="outline" onClick={onCancel} className="rounded-xl">Cancel</Button>
      </div>
    </div>
  );
}