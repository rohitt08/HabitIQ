import { useState } from "react";
import { CATEGORIES, COLORS, ICONS } from "../utils/constants.js";
import SelectDropdown from "./SelectDropdown.jsx";

export default function HabitForm({ initial, onSubmit, onCancel, submitting }) {
  const isCustomCategory = initial?.category && !CATEGORIES.includes(initial.category);

  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    category: isCustomCategory ? "Other" : (initial?.category || "Health"),
    customCategory: isCustomCategory ? initial.category : "",
    frequency: initial?.frequency || "daily",
    targetDays: initial?.targetDays || 7,
    color: initial?.color || COLORS[0],
    icon: initial?.icon || ICONS[0],
  });

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target ? e.target.value : e,
    }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    // Determine the final category string
    let finalCategory = form.category;
    if (form.category === "Other") {
       finalCategory = form.customCategory.trim() || "Other";
    }

    // Strip out the local 'customCategory' state when submitting
    const { customCategory, ...submitData } = form;

    onSubmit({
      ...submitData,
      category: finalCategory,
      targetDays: Number(form.targetDays),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Habit name</label>
        <input
          className="input"
          placeholder="e.g. Drink 2L of water"
          value={form.name}
          onChange={set("name")}
          autoFocus
          required
        />
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={2}
          placeholder="Why does this habit matter to you?"
          value={form.description}
          onChange={set("description")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-30">
        <div className="flex flex-col gap-2">
          <label className="label mb-0">Category</label>
          <SelectDropdown
            value={form.category}
            onChange={set("category")}
            options={CATEGORIES}
          />
          {form.category === "Other" && (
            <input
              className="input animate-fade-in text-sm"
              placeholder="Custom category name..."
              value={form.customCategory}
              onChange={set("customCategory")}
              maxLength={20}
              required
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="label mb-0">Frequency</label>
          <SelectDropdown
            value={form.frequency === "daily" ? "Daily" : "Weekly"}
            onChange={(val) => set("frequency")(val.toLowerCase())}
            options={["Daily", "Weekly"]}
          />
        </div>
      </div>

      <div>
        <label className="label">
          Target days per week:{" "}
          <span className="font-semibold">{form.targetDays}</span>
        </label>
        <input
          type="range"
          min={1}
          max={7}
          value={form.targetDays}
          onChange={set("targetDays")}
          className="w-full accent-brand-600"
        />
      </div>

      <div>
        <label className="label">Icon</label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map((i) => (
            <button
              type="button"
              key={i}
              onClick={() => set("icon")(i)}
              className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${form.icon === i
                ? "ring-2 ring-brand-500 bg-brand-500/15"
                : "glass hover:bg-[var(--surface-hover)]"
                }`}
            >
              {i}
            </button>
          ))}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <input 
              type="text" 
              maxLength={4} 
              className={`w-full h-full text-center rounded-xl text-xl transition focus:outline-none focus:ring-2 focus:ring-brand-500 bg-transparent placeholder-soft ${
                 (!ICONS.includes(form.icon) && form.icon !== "") ? "ring-2 ring-brand-500 bg-brand-500/15" : "glass hover:bg-[var(--surface-hover)]"
              }`}
              placeholder="+"
              value={!ICONS.includes(form.icon) ? form.icon : ""}
              onChange={(e) => set("icon")(e.target.value)}
              onFocus={() => {
                if (ICONS.includes(form.icon)) set("icon")("");
              }}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="label">Color</label>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => set("color")(c)}
              className={`w-8 h-8 rounded-full transition ${form.color === c
                ? "ring-4 ring-offset-2 ring-offset-[var(--bg-base)] ring-[var(--surface-ring)]"
                : ""
                }`}
              style={{ background: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      </div>

      <div className="sticky bottom-0 bg-[var(--bg-base)] dark:bg-[var(--surface)] -mx-6 px-6 py-4 border-t divider mt-6 z-10 flex justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : initial ? "Save changes" : "Create habit"}
        </button>
      </div>
    </form>
  );
}
