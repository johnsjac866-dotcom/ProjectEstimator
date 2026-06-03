import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import FlagField from "@/components/FlagField";
import { parseOps } from "@/lib/opsUtils";

const MAINTENANCE_TYPES = [
  "Weeding",
  "Core Aeration / Overseed",
  "Follow up Care - Planting Bed Maintenance",
  "Lawn",
  "Seasonal Clean Up",
  "Trees & Shrubs",
];

function generateId() { return Math.random().toString(36).substr(2, 9); }

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

function CalcBox({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 border px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value} <span className="text-muted-foreground font-normal">{unit}</span></span>
    </div>
  );
}

export default function MaintenanceWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [maintenanceType, setMaintenanceType] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);
  const [plants, setPlants] = useState([{ id: generateId(), name: "", count: "", size: "" }]);

  const opId = new URLSearchParams(window.location.search).get("opId");

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      if (opId) {
        const ops = parseOps(a.maintenance_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) {
          setMaintenanceType(existing.maintenance_type);
          setForm(existing);
          if (existing.plants) setPlants(existing.plants);
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

  function handleDimChange(key, value) {
    setForm(f => {
      const updated = { ...f, [key]: value };
      const l = parseFloat(key === "length" ? value : f.length) || 0;
      const w = parseFloat(key === "width" ? value : f.width) || 0;
      updated.sf = l > 0 && w > 0 ? (l * w).toFixed(1) : f.sf;
      return updated;
    });
  }

  const sf = form.sf;

  function addPlant() {
    setPlants(p => [...p, { id: generateId(), name: "", count: "", size: "" }]);
  }
  function removePlant(id) {
    setPlants(p => p.filter(pl => pl.id !== id));
  }
  function setPlant(id, key, value) {
    setPlants(p => p.map(pl => pl.id === id ? { ...pl, [key]: value } : pl));
  }

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.maintenance_data);
    const entry = {
      ...form,
      maintenance_type: maintenanceType,
      sub_type: maintenanceType,
      ...(maintenanceType === "Trees & Shrubs" ? { plants } : {}),
    };
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? entry : o);
    } else {
      updated = [...ops, { ...entry, id: generateId() }];
    }
    await base44.entities.Area.update(areaId, { maintenance_data: JSON.stringify(updated) });
    navigate(`/area/${areaId}`);
  }

  if (!area) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-emerald-600" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Maintenance Type</h2>
          <div className="grid grid-cols-1 gap-3">
            {MAINTENANCE_TYPES.map(type => (
              <button key={type} type="button"
                onClick={() => { setMaintenanceType(type); setForm({ maintenance_type: type, sub_type: type }); setStep(2); }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all">
                <p className="font-medium text-sm">{type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && maintenanceType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{maintenanceType}</span>
          </div>

          {/* Weeding */}
          {maintenanceType === "Weeding" && (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dimensions</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Length (ft)</Label><Input className="mt-1" type="number" value={form.length || ""} onChange={e => handleDimChange("length", e.target.value)} placeholder="0" /></div>
                  <div><Label>Width (ft)</Label><Input className="mt-1" type="number" value={form.width || ""} onChange={e => handleDimChange("width", e.target.value)} placeholder="0" /></div>
                </div>
                {sf && <CalcBox label="Square Footage" value={sf} unit="SF" />}
              </div>
              <FlagField fieldKey="time_estimate" label="Time (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
              </FlagField>
              <FlagField fieldKey="herbicide" label="Herbicide Treatment?" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.herbicide} onChange={v => set("herbicide", v)} options={["Yes", "No"]} />
              </FlagField>
              {form.herbicide === "Yes" && (
                <div><Label>Herbicide SF</Label><Input className="mt-1" type="number" value={form.herbicide_sf || ""} onChange={e => set("herbicide_sf", e.target.value)} placeholder="0" /></div>
              )}
            </>
          )}

          {/* Core Aeration / Overseed */}
          {maintenanceType === "Core Aeration / Overseed" && (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dimensions</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Length (ft)</Label><Input className="mt-1" type="number" value={form.length || ""} onChange={e => handleDimChange("length", e.target.value)} placeholder="0" /></div>
                  <div><Label>Width (ft)</Label><Input className="mt-1" type="number" value={form.width || ""} onChange={e => handleDimChange("width", e.target.value)} placeholder="0" /></div>
                </div>
                {sf && <CalcBox label="Square Footage" value={sf} unit="SF" />}
              </div>
              <div><Label>Estimated Hours</Label><Input className="mt-1" type="number" value={form.estimated_hours || ""} onChange={e => set("estimated_hours", e.target.value)} placeholder="0" /></div>
              <div>
                <Label>Is overseed needed?</Label>
                <SelectButtons value={form.overseed_needed} onChange={v => set("overseed_needed", v)} options={["Yes", "No"]} />
              </div>
              {form.overseed_needed === "Yes" && (
                <div><Label>Seed Type</Label><Input className="mt-1" value={form.seed_type || ""} onChange={e => set("seed_type", e.target.value)} placeholder="e.g. Fescue, Bluegrass..." /></div>
              )}
              <div>
                <Label>Machine needed?</Label>
                <SelectButtons value={form.machine_needed} onChange={v => set("machine_needed", v)} options={["Vermeer", "Dingo", "By hand"]} />
              </div>
            </>
          )}

          {/* Follow up Care */}
          {maintenanceType === "Follow up Care - Planting Bed Maintenance" && (
            <>
              <div><Label>Number of Visits</Label><Input className="mt-1" type="number" value={form.visits || ""} onChange={e => set("visits", e.target.value)} placeholder="0" /></div>
              <div><Label>Hours per Visit</Label><Input className="mt-1" type="number" value={form.hours_per_visit || ""} onChange={e => set("hours_per_visit", e.target.value)} placeholder="0" /></div>
              <div><Label>Size of Beds</Label><Input className="mt-1" value={form.bed_size || ""} onChange={e => set("bed_size", e.target.value)} placeholder="e.g. 500 SF, small/medium/large" /></div>
              <div><Label>Travel Time</Label><Input className="mt-1" value={form.travel_time || ""} onChange={e => set("travel_time", e.target.value)} placeholder="e.g. 30 min" /></div>
            </>
          )}

          {/* Lawn */}
          {maintenanceType === "Lawn" && (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dimensions</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Length (ft)</Label><Input className="mt-1" type="number" value={form.length || ""} onChange={e => handleDimChange("length", e.target.value)} placeholder="0" /></div>
                  <div><Label>Width (ft)</Label><Input className="mt-1" type="number" value={form.width || ""} onChange={e => handleDimChange("width", e.target.value)} placeholder="0" /></div>
                </div>
                {sf && <CalcBox label="Square Footage" value={sf} unit="SF" />}
              </div>
              <div><Label>Number of Visits</Label><Input className="mt-1" type="number" value={form.visits || ""} onChange={e => set("visits", e.target.value)} placeholder="0" /></div>
              <div><Label>Hours per Visit</Label><Input className="mt-1" type="number" value={form.hours_per_visit || ""} onChange={e => set("hours_per_visit", e.target.value)} placeholder="0" /></div>
              <div><Label>Service Type</Label><Input className="mt-1" value={form.service_type || ""} onChange={e => set("service_type", e.target.value)} placeholder="e.g. Mow, Edge, Trim..." /></div>
              <div><Label>Travel Time</Label><Input className="mt-1" value={form.travel_time || ""} onChange={e => set("travel_time", e.target.value)} placeholder="e.g. 30 min" /></div>
            </>
          )}

          {/* Seasonal Clean Up */}
          {maintenanceType === "Seasonal Clean Up" && (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Area</p>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Length (ft)</Label><Input className="mt-1" type="number" value={form.length || ""} onChange={e => handleDimChange("length", e.target.value)} placeholder="0" /></div>
                  <div><Label>Width (ft)</Label><Input className="mt-1" type="number" value={form.width || ""} onChange={e => handleDimChange("width", e.target.value)} placeholder="0" /></div>
                </div>
                {sf && <CalcBox label="Square Footage" value={sf} unit="SF" />}
                <div><Label>Zones (if not using SF)</Label><Input className="mt-1" type="number" value={form.zones || ""} onChange={e => set("zones", e.target.value)} placeholder="0" /></div>
              </div>
              <div><Label>Estimated Hours</Label><Input className="mt-1" type="number" value={form.estimated_hours || ""} onChange={e => set("estimated_hours", e.target.value)} placeholder="0" /></div>
              <div>
                <Label>Spring or Fall scope?</Label>
                <SelectButtons value={form.season_scope} onChange={v => set("season_scope", v)} options={["Spring", "Fall"]} />
              </div>
              <div>
                <Label>Disposal needed?</Label>
                <SelectButtons value={form.disposal_needed} onChange={v => set("disposal_needed", v)} options={["Yes", "No"]} />
              </div>
              {form.disposal_needed === "Yes" && (
                <div><Label>Volume of Debris</Label><Input className="mt-1" value={form.debris_volume || ""} onChange={e => set("debris_volume", e.target.value)} placeholder="e.g. 2 CY, 1 truck load" /></div>
              )}
            </>
          )}

          {/* Trees & Shrubs */}
          {maintenanceType === "Trees & Shrubs" && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Plants</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addPlant}><Plus className="h-3 w-3 mr-1" />Add Plant</Button>
                </div>
                <div className="space-y-3">
                  {plants.map((plant, idx) => (
                    <div key={plant.id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Plant {idx + 1}</span>
                        {plants.length > 1 && (
                          <button type="button" onClick={() => removePlant(plant.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                      <Input placeholder="Plant Name" value={plant.name} onChange={e => setPlant(plant.id, "name", e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Count" type="number" value={plant.count} onChange={e => setPlant(plant.id, "count", e.target.value)} />
                        <Input placeholder="Size (e.g. 5 gal)" value={plant.size} onChange={e => setPlant(plant.id, "size", e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div><Label>Estimated Hours</Label><Input className="mt-1" type="number" value={form.estimated_hours || ""} onChange={e => set("estimated_hours", e.target.value)} placeholder="0" /></div>
              <div><Label>Service Type</Label><Input className="mt-1" value={form.service_type || ""} onChange={e => set("service_type", e.target.value)} placeholder="e.g. Prune, Deep Root Feed..." /></div>
              <div>
                <Label>Disposal needed?</Label>
                <SelectButtons value={form.disposal_needed} onChange={v => set("disposal_needed", v)} options={["Yes", "No"]} />
              </div>
              {form.disposal_needed === "Yes" && (
                <div><Label>Volume of Debris</Label><Input className="mt-1" value={form.debris_volume || ""} onChange={e => set("debris_volume", e.target.value)} placeholder="e.g. 2 CY, 1 truck load" /></div>
              )}
            </>
          )}

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