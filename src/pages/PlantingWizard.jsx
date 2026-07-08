import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
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
    notes: "",
  };
  if (type === "Trees & Shrubs") return {
    ...base,
    trees: [{ id: generateId(), type: "", count: "", size: "" }],
    shrubs: [{ id: generateId(), type: "", count: "", size: "" }],
    hand_vs_machine: "",
    machine_type: "",
    ball_cart: "",
    tree_sling: "",
    tree_boom: "",
    ramps: "",
    stake_kit: "",
    cage: "",
    mulch_ring: "",
    haul_off_debris: "",
    watering_hours: "",
    watering_days: "",
    water_access: "",
    delivery_by: "",
    box_truck: "",
    flatbed: "",
    forklift: "",
    mycorrhizae_tablets: "",
  };
  if (type === "Perennials") return {
    ...base,
    large_plants: [{ id: generateId(), name: "", count: "" }],
    large_spacing: "",
    small_plants: [{ id: generateId(), name: "", count: "" }],
    small_spacing: "",
    bed_condition: "",
    watering_hours: "",
    water_access: "",
    mycorrhizae_tablets: "",
  };
  if (type === "Bulbs") return {
    ...base,
    bulbs: [{ id: generateId(), name: "", count: "" }],
    mulched_soil: "",
    bulb_fertilizer: "",
    milwaukee_drill: "",
    drill_auger: "",
    bulb_plugger: "",
    cut_weed_barrier: "",
    watering_hours: "",
    water_access: "",
  };
  if (type === "Annuals") return {
    ...base,
    annuals: [{ id: generateId(), name: "", count: "" }],
    watering_hours: "",
    water_access: "",
  };
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

/** Reusable plant list editor (name + count rows) */
function PlantList({ listKey, label, addLabel, form, setForm }) {
  function add() {
    setForm(f => ({ ...f, [listKey]: [...(f[listKey] || []), { id: generateId(), name: "", count: "" }] }));
  }
  function remove(id) {
    setForm(f => ({ ...f, [listKey]: f[listKey].filter(p => p.id !== id) }));
  }
  function update(id, key, val) {
    setForm(f => ({ ...f, [listKey]: f[listKey].map(p => p.id === id ? { ...p, [key]: val } : p) }));
  }
  const items = form[listKey] || [];
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3.5 w-3.5 mr-1" /> {addLabel || "Add"}
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((plant, idx) => (
          <div key={plant.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => remove(plant.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Name</Label>
                <Input className="mt-1 h-8 text-sm" value={plant.name || ""} onChange={e => update(plant.id, "name", e.target.value)} placeholder="Name" />
              </div>
              <div>
                <Label className="text-xs">Count</Label>
                <Input className="mt-1 h-8 text-sm" type="number" value={plant.count || ""} onChange={e => update(plant.id, "count", e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Reusable tree/shrub list (type + count + size) */
function TreeShrubList({ listKey, label, form, setForm }) {
  function add() {
    setForm(f => ({ ...f, [listKey]: [...(f[listKey] || []), { id: generateId(), type: "", count: "", size: "" }] }));
  }
  function remove(id) {
    setForm(f => ({ ...f, [listKey]: f[listKey].filter(p => p.id !== id) }));
  }
  function update(id, key, val) {
    setForm(f => ({ ...f, [listKey]: f[listKey].map(p => p.id === id ? { ...p, [key]: val } : p) }));
  }
  const items = form[listKey] || [];
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{label}</p>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {items.map((plant, idx) => (
          <div key={plant.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">#{idx + 1}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => remove(plant.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Input className="mt-1 h-8 text-sm" value={plant.type || ""} onChange={e => update(plant.id, "type", e.target.value)} placeholder="e.g. Oak" />
              </div>
              <div>
                <Label className="text-xs">Count</Label>
                <Input className="mt-1 h-8 text-sm" type="number" value={plant.count || ""} onChange={e => update(plant.id, "count", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label className="text-xs">Size</Label>
                <Input className="mt-1 h-8 text-sm" value={plant.size || ""} onChange={e => update(plant.id, "size", e.target.value)} placeholder="e.g. 3 gal" />
              </div>
            </div>
          </div>
        ))}
      </div>
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
      const a = await OfflineAreas.get(areaId);
      if (!a) { setArea(null); return; }
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
  }, [areaId, opId]);

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

  // Mulch ring cubic yards: 4ft ring (annular), 3" = 0.25ft depth
  // Area = π*(r_outer² - r_inner²), r_outer = tree radius + 4, r_inner = tree radius ≈ 0
  // Simplified: annular area for a 4ft-wide ring, assume inner r = 0 → area = π*(4²) = 50.27 sqft
  // CY = 50.27 * 0.25 / 27 ≈ 0.47 CY
  const MULCH_RING_CY = ((Math.PI * 4 * 4) * (3 / 12) / 27).toFixed(2);

  const treeCount = (form.trees || []).reduce((s, t) => s + (parseFloat(t.count) || 0), 0);
  const totalMulchRingCY = form.mulch_ring === "Yes" ? (treeCount * parseFloat(MULCH_RING_CY)).toFixed(2) : null;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.planting_data);
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? { ...form } : o);
    } else {
      updated = [...ops, { ...form, id: generateId() }];
    }
    await OfflineAreas.update(areaId, { planting_data: JSON.stringify(updated) });
    navigate(`/area/${areaId}`);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found. Please go back and try again.</p></div>;

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

          {/* ── Trees & Shrubs ── */}
          {plantingType === "Trees & Shrubs" && (
            <>
              <TreeShrubList listKey="trees" label="Trees" form={form} setForm={setForm} />
              <TreeShrubList listKey="shrubs" label="Shrubs" form={form} setForm={setForm} />

              <FlagField fieldKey="mycorrhizae_tablets" label="Mycorrhizae Tablets (count)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.mycorrhizae_tablets || ""} onChange={e => set("mycorrhizae_tablets", e.target.value)} placeholder="0" />
              </FlagField>

              <FlagField fieldKey="hand_vs_machine" label="Excavation: Hand or Machine?" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.hand_vs_machine} onChange={v => set("hand_vs_machine", v)} options={["Hand", "Machine"]} />
              </FlagField>
              {form.hand_vs_machine === "Machine" && (
                <FlagField fieldKey="machine_type" label="Machine Type" flags={form._flags || []} onToggle={toggleFlag}>
                  <SelectButtons value={form.machine_type} onChange={v => set("machine_type", v)} options={["Vermeer", "Dingo"]} />
                  <p className="text-xs text-amber-600 mt-1">⚠️ Check machine access before scheduling.</p>
                </FlagField>
              )}

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Equipment</p>
                <div className="grid grid-cols-2 gap-3">
                  <FlagField fieldKey="ball_cart" label="Ball Cart?" flags={form._flags || []} onToggle={toggleFlag}>
                    <YesNo value={form.ball_cart} onChange={v => set("ball_cart", v)} />
                  </FlagField>
                  <FlagField fieldKey="tree_sling" label="Tree Sling?" flags={form._flags || []} onToggle={toggleFlag}>
                    <YesNo value={form.tree_sling} onChange={v => set("tree_sling", v)} />
                  </FlagField>
                  <FlagField fieldKey="tree_boom" label="Tree Boom?" flags={form._flags || []} onToggle={toggleFlag}>
                    <YesNo value={form.tree_boom} onChange={v => set("tree_boom", v)} />
                  </FlagField>
                  <FlagField fieldKey="ramps" label="Ramps (count)" flags={form._flags || []} onToggle={toggleFlag}>
                    <Input type="number" value={form.ramps || ""} onChange={e => set("ramps", e.target.value)} placeholder="0" />
                  </FlagField>
                  <FlagField fieldKey="stake_kit" label="Stake Kit?" flags={form._flags || []} onToggle={toggleFlag}>
                    <YesNo value={form.stake_kit} onChange={v => set("stake_kit", v)} />
                  </FlagField>
                  <FlagField fieldKey="cage" label="Cage?" flags={form._flags || []} onToggle={toggleFlag}>
                    <YesNo value={form.cage} onChange={v => set("cage", v)} />
                  </FlagField>
                </div>
              </div>

              <FlagField fieldKey="mulch_ring" label="Mulch Ring? (4ft ring, 3in deep)" flags={form._flags || []} onToggle={toggleFlag}>
                <YesNo value={form.mulch_ring} onChange={v => set("mulch_ring", v)} />
                {form.mulch_ring === "Yes" && treeCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {treeCount} tree{treeCount !== 1 ? "s" : ""} × {MULCH_RING_CY} CY = <strong>{totalMulchRingCY} CY</strong>
                  </p>
                )}
              </FlagField>

              <FlagField fieldKey="haul_off_debris" label="Haul Off Debris or Extra Soil?" flags={form._flags || []} onToggle={toggleFlag}>
                <YesNo value={form.haul_off_debris} onChange={v => set("haul_off_debris", v)} />
              </FlagField>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Watering</p>
                <div className="grid grid-cols-2 gap-3">
                  <FlagField fieldKey="watering_hours" label="Hours" flags={form._flags || []} onToggle={toggleFlag}>
                    <Input type="number" value={form.watering_hours || ""} onChange={e => set("watering_hours", e.target.value)} placeholder="0" />
                  </FlagField>
                  <FlagField fieldKey="watering_days" label="Days" flags={form._flags || []} onToggle={toggleFlag}>
                    <Input type="number" value={form.watering_days || ""} onChange={e => set("watering_days", e.target.value)} placeholder="0" />
                  </FlagField>
                </div>
                <FlagField fieldKey="water_access" label="Water Access?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.water_access} onChange={v => set("water_access", v)} />
                </FlagField>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Delivery Method</p>
                <FlagField fieldKey="delivery_by" label="By Aspen or By Others?" flags={form._flags || []} onToggle={toggleFlag}>
                  <SelectButtons value={form.delivery_by} onChange={v => set("delivery_by", v)} options={["By Aspen", "By Others"]} />
                </FlagField>
                <div className="grid grid-cols-3 gap-3">
                  <FlagField fieldKey="box_truck" label="Box Truck?" flags={form._flags || []} onToggle={toggleFlag}>
                    <YesNo value={form.box_truck} onChange={v => set("box_truck", v)} />
                  </FlagField>
                  <FlagField fieldKey="flatbed" label="Flatbed?" flags={form._flags || []} onToggle={toggleFlag}>
                    <YesNo value={form.flatbed} onChange={v => set("flatbed", v)} />
                  </FlagField>
                  <FlagField fieldKey="forklift" label="Forklift?" flags={form._flags || []} onToggle={toggleFlag}>
                    <YesNo value={form.forklift} onChange={v => set("forklift", v)} />
                  </FlagField>
                </div>
              </div>
            </>
          )}

          {/* ── Perennials ── */}
          {plantingType === "Perennials" && (
            <>
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Large Perennials</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, large_plants: [...(f.large_plants || []), { id: generateId(), name: "", count: "" }] }))}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(form.large_plants || []).map((plant, idx) => (
                    <div key={plant.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Plant {idx + 1}</span>
                        {form.large_plants.length > 1 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, large_plants: f.large_plants.filter(p => p.id !== plant.id) }))} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Plant Name</Label>
                          <Input className="mt-1 h-8 text-sm" value={plant.name} onChange={e => setForm(f => ({ ...f, large_plants: f.large_plants.map(p => p.id === plant.id ? { ...p, name: e.target.value } : p) }))} placeholder="e.g. Hosta" />
                        </div>
                        <div>
                          <Label className="text-xs">Count</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" value={plant.count} onChange={e => setForm(f => ({ ...f, large_plants: f.large_plants.map(p => p.id === plant.id ? { ...p, count: e.target.value } : p) }))} placeholder="0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Spacing</Label>
                  <Input className="mt-1" value={form.large_spacing || ""} onChange={e => set("large_spacing", e.target.value)} placeholder='e.g. 18"' />
                </div>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Small Perennials</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, small_plants: [...(f.small_plants || []), { id: generateId(), name: "", count: "" }] }))}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {(form.small_plants || []).map((plant, idx) => (
                    <div key={plant.id} className="rounded-lg border p-3 space-y-2 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Plant {idx + 1}</span>
                        {form.small_plants.length > 1 && (
                          <button type="button" onClick={() => setForm(f => ({ ...f, small_plants: f.small_plants.filter(p => p.id !== plant.id) }))} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Plant Name</Label>
                          <Input className="mt-1 h-8 text-sm" value={plant.name} onChange={e => setForm(f => ({ ...f, small_plants: f.small_plants.map(p => p.id === plant.id ? { ...p, name: e.target.value } : p) }))} placeholder="e.g. Sedum" />
                        </div>
                        <div>
                          <Label className="text-xs">Count</Label>
                          <Input className="mt-1 h-8 text-sm" type="number" value={plant.count} onChange={e => setForm(f => ({ ...f, small_plants: f.small_plants.map(p => p.id === plant.id ? { ...p, count: e.target.value } : p) }))} placeholder="0" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-xs">Spacing</Label>
                  <Input className="mt-1" value={form.small_spacing || ""} onChange={e => set("small_spacing", e.target.value)} placeholder='e.g. 12"' />
                </div>
              </div>

              <FlagField fieldKey="bed_condition" label="Bed Condition" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.bed_condition} onChange={v => set("bed_condition", v)} options={["Unprepared bed", "Prepared bed"]} />
              </FlagField>

              <FlagField fieldKey="mycorrhizae_tablets" label="Mycorrhizae Tablets (count)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.mycorrhizae_tablets || ""} onChange={e => set("mycorrhizae_tablets", e.target.value)} placeholder="0" />
              </FlagField>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Watering</p>
                <FlagField fieldKey="watering_hours" label="Time for Watering (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.watering_hours || ""} onChange={e => set("watering_hours", e.target.value)} placeholder="0" />
                </FlagField>
                <FlagField fieldKey="water_access" label="Water Access?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.water_access} onChange={v => set("water_access", v)} />
                </FlagField>
              </div>
            </>
          )}

          {/* ── Bulbs ── */}
          {plantingType === "Bulbs" && (
            <>
              <PlantList listKey="bulbs" label="Bulbs" addLabel="Add Bulb" form={form} setForm={setForm} />

              <div className="grid grid-cols-2 gap-3">
                <FlagField fieldKey="mulched_soil" label="Mulched Soil?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.mulched_soil} onChange={v => set("mulched_soil", v)} />
                </FlagField>
                <FlagField fieldKey="bulb_fertilizer" label="Bulb Fertilizer?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.bulb_fertilizer} onChange={v => set("bulb_fertilizer", v)} />
                </FlagField>
                <FlagField fieldKey="milwaukee_drill" label="Milwaukee Drill?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.milwaukee_drill} onChange={v => set("milwaukee_drill", v)} />
                </FlagField>
                <FlagField fieldKey="drill_auger" label="Drill Auger?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.drill_auger} onChange={v => set("drill_auger", v)} />
                </FlagField>
                <FlagField fieldKey="bulb_plugger" label="Bulb Plugger?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.bulb_plugger} onChange={v => set("bulb_plugger", v)} />
                </FlagField>
                <FlagField fieldKey="cut_weed_barrier" label="Cut Weed Barrier?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.cut_weed_barrier} onChange={v => set("cut_weed_barrier", v)} />
                </FlagField>
              </div>

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Watering</p>
                <FlagField fieldKey="watering_hours" label="Time for Watering (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.watering_hours || ""} onChange={e => set("watering_hours", e.target.value)} placeholder="0" />
                </FlagField>
                <FlagField fieldKey="water_access" label="Water Access?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.water_access} onChange={v => set("water_access", v)} />
                </FlagField>
              </div>
            </>
          )}

          {/* ── Annuals ── */}
          {plantingType === "Annuals" && (
            <>
              <PlantList listKey="annuals" label="Annuals" addLabel="Add Annual" form={form} setForm={setForm} />

              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-semibold">Watering</p>
                <FlagField fieldKey="watering_hours" label="Time for Watering (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.watering_hours || ""} onChange={e => set("watering_hours", e.target.value)} placeholder="0" />
                </FlagField>
                <FlagField fieldKey="water_access" label="Water Access?" flags={form._flags || []} onToggle={toggleFlag}>
                  <YesNo value={form.water_access} onChange={v => set("water_access", v)} />
                </FlagField>
              </div>
            </>
          )}

          {/* ── Shared fields ── */}
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