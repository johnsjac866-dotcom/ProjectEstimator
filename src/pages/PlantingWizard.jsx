import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import FlagField from "@/components/FlagField";
import { parseOps } from "@/lib/opsUtils";

const PLANTING_TYPES = ["Trees & Shrubs", "Perennials", "Bulbs", "Annuals"];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function getDefaultForm(type) {
  const base = {
    planting_type: type,
    sub_type: type,
    additional_time_rocky: "",
    additional_time_roots: "",
    delivery_method: "",
    water_access: "",
    notes: "",
  };
  if (type === "Trees & Shrubs") return { ...base, plants: [{ id: generateId(), type: "", count: "", size: "" }], hand_vs_machine: "" };
  if (type === "Perennials")     return { ...base, large_plants: [{ id: generateId(), name: "", count: "" }], large_spacing: "", small_plants: [{ id: generateId(), name: "", count: "" }], small_spacing: "", bed_condition: "" };
  if (type === "Bulbs")          return { ...base, count: "" };
  if (type === "Annuals")        return { ...base, count: "" };
  return base;
}

function YesNo({ value, onChange }) {
  return (
    <div className="flex gap-3 mt-1">
      {["Yes", "No"].map(v => (
        <button key={v} type="button" onClick={() => onChange(v)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${value === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
          {v}
        </button>
      ))}
    </div>
  );
}

function SelectButtons({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${value === opt ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function PlantingWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [plantingType, setPlantingType] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const opId = urlParams.get("opId");

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      if (opId) {
        const ops = parseOps(a.planting_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) {
          setPlantingType(existing.planting_type);
          setForm(existing);
          setStep(2);
        }
      }
    })();
  }, [areaId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function toggleFlag(key, label) {
    setForm(f => {
      const flags = f._flags || [];
      const flagLabels = f._flag_labels || {};
      if (flags.includes(key)) {
        const updated = { ...flagLabels }; delete updated[key];
        return { ...f, _flags: flags.filter(x => x !== key), _flag_labels: updated };
      }
      return { ...f, _flags: [...flags, key], _flag_labels: { ...flagLabels, [key]: label } };
    });
  }

  function addPlant() {
    setForm(f => ({ ...f, plants: [...(f.plants || []), { id: generateId(), type: "", count: "", size: "" }] }));
  }
  function removePlant(id) {
    setForm(f => ({ ...f, plants: f.plants.filter(p => p.id !== id) }));
  }
  function updatePlant(id, key, val) {
    setForm(f => ({ ...f, plants: f.plants.map(p => p.id === id ? { ...p, [key]: val } : p) }));
  }

  function addPerennial(sizeKey) {
    setForm(f => ({ ...f, [sizeKey]: [...(f[sizeKey] || []), { id: generateId(), name: "", count: "" }] }));
  }
  function removePerennial(sizeKey, id) {
    setForm(f => ({ ...f, [sizeKey]: f[sizeKey].filter(p => p.id !== id) }));
  }
  function updatePerennial(sizeKey, id, key, val) {
    setForm(f => ({ ...f, [sizeKey]: f[sizeKey].map(p => p.id === id ? { ...p, [key]: val } : p) }));
  }

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.planting_data);
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? { ...form } : o);
    } else {
      updated = [...ops, { ...form, id: generateId() }];
    }
    await base44.entities.Area.update(areaId, { planting_data: JSON.stringify(updated) });
    navigate(`/area/${areaId}`);
  }

  if (!area) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Planting</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Planting Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {PLANTING_TYPES.map(type => (
              <button key={type} type="button"
                onClick={() => { setPlantingType(type); setForm(getDefaultForm(type)); setStep(2); }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all">
                <p className="font-medium text-sm">{type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && plantingType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{plantingType}</span>
          </div>

          {/* Trees & Shrubs */}
          {plantingType === "Trees & Shrubs" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Plants</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPlant}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Plant
                  </Button>
                </div>
                <div className="space-y-3">
                  {(form.plants || []).map((plant, idx) => (
                    <div key={plant.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Plant {idx + 1}</span>
                        {form.plants.length > 1 && (
                          <button type="button" onClick={() => removePlant(plant.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs">Type</Label>
                          <Input className="mt-1 h-8 text-sm" value={plant.type} onChange={e => updatePlant(plant.id, "type", e.target.value)} placeholder="e.g. Oak" />
                        </div>
                        <div>
                          <Label className="text-xs">Count</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" value={plant.count} onChange={e => updatePlant(plant.id, "count", e.target.value)} placeholder="0" />
                        </div>
                        <div>
                          <Label className="text-xs">Size</Label>
                          <Input className="mt-1 h-8 text-sm" value={plant.size} onChange={e => updatePlant(plant.id, "size", e.target.value)} placeholder="e.g. 3 gal" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label>Hand vs Machine Use</Label>
                <SelectButtons value={form.hand_vs_machine} onChange={v => set("hand_vs_machine", v)} options={["Hand", "Machine"]} />
              </div>
            </>
          )}

          {/* Perennials */}
          {plantingType === "Perennials" && (
            <>
              {/* Large Perennials */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Large Perennials</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPerennial("large_plants")}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(form.large_plants || []).map((plant, idx) => (
                    <div key={plant.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Plant {idx + 1}</span>
                        {form.large_plants.length > 1 && (
                          <button type="button" onClick={() => removePerennial("large_plants", plant.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Plant Name</Label>
                          <Input className="mt-1 h-8 text-sm" value={plant.name} onChange={e => updatePerennial("large_plants", plant.id, "name", e.target.value)} placeholder="e.g. Hosta" />
                        </div>
                        <div>
                          <Label className="text-xs">Count</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" value={plant.count} onChange={e => updatePerennial("large_plants", plant.id, "count", e.target.value)} placeholder="0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Spacing</Label>
                  <Input className="mt-1" value={form.large_spacing} onChange={e => set("large_spacing", e.target.value)} placeholder='e.g. 18"' />
                </div>
              </div>

              {/* Small Perennials */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Small Perennials</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => addPerennial("small_plants")}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(form.small_plants || []).map((plant, idx) => (
                    <div key={plant.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Plant {idx + 1}</span>
                        {form.small_plants.length > 1 && (
                          <button type="button" onClick={() => removePerennial("small_plants", plant.id)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Plant Name</Label>
                          <Input className="mt-1 h-8 text-sm" value={plant.name} onChange={e => updatePerennial("small_plants", plant.id, "name", e.target.value)} placeholder="e.g. Sedum" />
                        </div>
                        <div>
                          <Label className="text-xs">Count</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" value={plant.count} onChange={e => updatePerennial("small_plants", plant.id, "count", e.target.value)} placeholder="0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Spacing</Label>
                  <Input className="mt-1" value={form.small_spacing} onChange={e => set("small_spacing", e.target.value)} placeholder='e.g. 12"' />
                </div>
              </div>

              <div>
                <Label>Bed Condition</Label>
                <SelectButtons value={form.bed_condition} onChange={v => set("bed_condition", v)} options={["Unprepared bed", "Prepared bed"]} />
              </div>
            </>
          )}

          {/* Bulbs / Annuals */}
          {(plantingType === "Bulbs" || plantingType === "Annuals") && (
            <div><Label>Count</Label><Input className="mt-1" type="number" value={form.count} onChange={e => set("count", e.target.value)} placeholder="0" /></div>
          )}

          {/* Shared fields for all types */}
          <div className="space-y-4 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Additional Time Factors</p>
            <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
              <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
            </FlagField>
            <div className="grid grid-cols-2 gap-4">
              <FlagField fieldKey="additional_time_rocky" label="Rocky Soil" flags={form._flags || []} onToggle={toggleFlag}>
                <YesNo value={form.additional_time_rocky} onChange={v => set("additional_time_rocky", v)} />
              </FlagField>
              <FlagField fieldKey="additional_time_roots" label="Roots" flags={form._flags || []} onToggle={toggleFlag}>
                <YesNo value={form.additional_time_roots} onChange={v => set("additional_time_roots", v)} />
              </FlagField>
            </div>
            <FlagField fieldKey="delivery_method" label="Delivery Method" flags={form._flags || []} onToggle={toggleFlag}>
              <Input value={form.delivery_method} onChange={e => set("delivery_method", e.target.value)} placeholder="e.g. Truck delivery, Pick up" />
            </FlagField>
            <FlagField fieldKey="water_access" label="Water Access?" flags={form._flags || []} onToggle={toggleFlag}>
              <YesNo value={form.water_access} onChange={v => set("water_access", v)} />
            </FlagField>
          </div>

          <FlagField fieldKey="notes" label="Additional Notes" flags={form._flags || []} onToggle={toggleFlag}>
            <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes..." rows={3} />
          </FlagField>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}