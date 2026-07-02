import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const activitySuggestions = ["Walking", "Stretching", "Yoga", "Swimming", "Cycling", "Dance", "Tai Chi", "Boxing", "Strength Training", "Balance Exercises"];

export default function ExerciseForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    activity: "",
    duration_minutes: 30,
    intensity: "moderate",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.activity) return;
    setSaving(true);
    await onSubmit({ ...form, logged_at: new Date().toISOString() });
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Activity</label>
        <Input value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} placeholder="What did you do?" className="rounded-xl mb-2" />
        <div className="flex flex-wrap gap-1.5">
          {activitySuggestions.map(a => (
            <button
              key={a}
              type="button"
              onClick={() => setForm({ ...form, activity: a })}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                form.activity === a ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Duration — {form.duration_minutes} min</label>
        <input
          type="range"
          min={5}
          max={120}
          step={5}
          value={form.duration_minutes}
          onChange={e => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>5 min</span><span>120 min</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Intensity</label>
        <div className="flex gap-2">
          {["light", "moderate", "vigorous"].map(i => (
            <button
              key={i}
              type="button"
              onClick={() => setForm({ ...form, intensity: i })}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all ${
                form.intensity === i ? "bg-primary text-primary-foreground shadow-md" : "bg-secondary text-muted-foreground"
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
        <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="How did it feel?" className="resize-none rounded-xl" rows={2} />
      </div>

      <div className="flex gap-3 pt-2">
        {onCancel && <Button type="button" variant="outline" onClick={onCancel} className="flex-1 rounded-xl">Cancel</Button>}
        <Button type="submit" disabled={!form.activity || saving} className="flex-1 rounded-xl h-12 text-base">
          {saving ? "Saving..." : "Log Exercise"}
        </Button>
      </div>
    </form>
  );
}