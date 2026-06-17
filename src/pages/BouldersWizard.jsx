import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseOps } from "@/lib/opsUtils";
import FlagField from "@/components/FlagField";

const STRUCTURE_TYPES = [
  "Boulders / Accents",
  "Structures - Fence",
  "Structures - Arbor",
  "Raised Garden Bed",
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

export default function BouldersWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [structureType, setStructureType] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);

  const opId = new URLSearchParams(window.location.search).get("opId");

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      if (!a) { setArea(null); return; }
      setArea(a);
      if (opId) {
        const ops = parseOps(a.boulders_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) { setStructureType(existing.sub_type); setForm(existing); setStep(2); }
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

  // Raised Garden Bed calculations
  const qty = parseFloat(form.quantity) || 0;
  const length = parseFloat(form.length) || 0;
  const width = parseFloat(form.width) || 0;
  const soilDepth = parseFloat(form.soil_depth) || 0;
  const sfPerBed = length > 0 && width > 0 ? length * width : null;
  const totalSF = sfPerBed && qty > 0 ? (sfPerBed * qty).toFixed(1) : null;
  const cy = totalSF && soilDepth > 0 ? ((parseFloat(totalSF) * soilDepth / 12) / 27).toFixed(2) : null;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.boulders_data);
    const newOpId = generateId();
    const entry = { ...form, sub_type: structureType, total_sf: totalSF, total_cy: cy };
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? entry : o);
    } else {
      updated = [...ops, { ...entry, id: newOpId }];
    }
    await OfflineAreas.update(areaId, { boulders_data: JSON.stringify(updated) });
    setSaving(false);
    navigate(`/area/${areaId}`);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found. Please go back and try again.</p></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Boulders/Accents & Structures</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Type</h2>
          <div className="grid grid-cols-1 gap-3">
            {STRUCTURE_TYPES.map(type => (
              <button key={type} type="button"
                onClick={() => { setStructureType(type); setForm({ sub_type: type }); setStep(2); }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all">
                <p className="font-medium text-sm">{type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && structureType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{structureType}</span>
          </div>

          {/* Time Estimate — all types */}
          <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
            <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
          </FlagField>

          {/* BOULDERS / ACCENTS */}
          {structureType === "Boulders / Accents" && (
            <>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Size — Count per Range</p>
                <div>
                  <Label>Number of 24" – 30"</Label>
                  <Input className="mt-1" type="number" value={form.count_24_30 || ""} onChange={e => set("count_24_30", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Number of 18" – 24"</Label>
                  <Input className="mt-1" type="number" value={form.count_18_24 || ""} onChange={e => set("count_18_24", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Number of 12" – 18"</Label>
                  <Input className="mt-1" type="number" value={form.count_12_18 || ""} onChange={e => set("count_12_18", e.target.value)} placeholder="0" />
                </div>
              </div>

              <div>
                <Label>Color Preference</Label>
                <Input className="mt-1" value={form.color_preference || ""} onChange={e => set("color_preference", e.target.value)} placeholder="e.g. Grey, Brown, Mixed..." />
              </div>

              <div>
                <Label>Ball Cart Needed?</Label>
                <SelectButtons value={form.ball_cart_needed} onChange={v => set("ball_cart_needed", v)} options={["Yes", "No"]} />
              </div>

              <div>
                <Label>Dump Trailer Needed?</Label>
                <SelectButtons value={form.dump_trailer_needed} onChange={v => set("dump_trailer_needed", v)} options={["Yes", "No"]} />
              </div>

              <div>
                <Label>Machine Access</Label>
                <SelectButtons value={form.machine_access} onChange={v => set("machine_access", v)} options={["Vermeer", "Dingo", "None"]} />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Delivery</p>
                <Label>Supplier</Label>
                <SelectButtons value={form.delivery_supplier} onChange={v => set("delivery_supplier", v)} options={["Midwest", "Madison Block", "Special Order"]} />
                {form.delivery_supplier === "Special Order" && (
                  <Input className="mt-2" value={form.delivery_special_order || ""} onChange={e => set("delivery_special_order", e.target.value)} placeholder="Specify supplier..." />
                )}
              </div>

              <div>
                <Label>Constraints or Hazards</Label>
                <Textarea className="mt-1" value={form.constraints || ""} onChange={e => set("constraints", e.target.value)} placeholder="Describe any constraints or hazards..." rows={3} />
              </div>
            </>
          )}

          {/* FENCE */}
          {structureType === "Structures - Fence" && (
            <>
              <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">
                ⚠️ Note: Check property line and utilities before installation.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Linear Feet (LF)</Label>
                  <Input className="mt-1" type="number" value={form.lf || ""} onChange={e => set("lf", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Height (ft)</Label>
                  <Input className="mt-1" type="number" value={form.height || ""} onChange={e => set("height", e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gates</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Gate Count</Label>
                    <Input className="mt-1" type="number" value={form.gate_count || ""} onChange={e => set("gate_count", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label>Gate Width (ft)</Label>
                    <Input className="mt-1" type="number" value={form.gate_width || ""} onChange={e => set("gate_width", e.target.value)} placeholder="0" />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Material</p>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Cedar 2x2" (count)</Label>
                      <Input className="mt-1" type="number" value={form.fence_cedar_2x2 || ""} onChange={e => set("fence_cedar_2x2", e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <Label>4x4x8' Rough Sawn Cedar (count)</Label>
                      <Input className="mt-1" type="number" value={form.fence_cedar_4x4 || ""} onChange={e => set("fence_cedar_4x4", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <div>
                    <Label>Fasteners (count)</Label>
                    <Input className="mt-1" type="number" value={form.fence_fasteners || ""} onChange={e => set("fence_fasteners", e.target.value)} placeholder="0" />
                  </div>
                </div>
              </div>

              <div>
                <Label>Post Spacing (ft)</Label>
                <Input className="mt-1" type="number" value={form.post_spacing || ""} onChange={e => set("post_spacing", e.target.value)} placeholder="0" />
              </div>

              <div>
                <Label>Hand or Machine</Label>
                <SelectButtons value={form.fence_dig_mode} onChange={v => set("fence_dig_mode", v)} options={["Hand", "Machine"]} />
              </div>
              {form.fence_dig_mode === "Hand" && (
                <div>
                  <Label>Dig Post Holes — Unit Hours</Label>
                  <Input className="mt-1" type="number" value={form.fence_dig_hours || ""} onChange={e => set("fence_dig_hours", e.target.value)} placeholder="0" />
                </div>
              )}
              {form.fence_dig_mode === "Machine" && (
                <>
                  <div>
                    <Label>Machine Type</Label>
                    <SelectButtons value={form.fence_machine_type} onChange={v => set("fence_machine_type", v)} options={["Dingo", "Vermeer"]} />
                  </div>
                  <div>
                    <Label>Dig Post Holes — Unit Hours</Label>
                    <Input className="mt-1" type="number" value={form.fence_dig_hours || ""} onChange={e => set("fence_dig_hours", e.target.value)} placeholder="0" />
                  </div>
                </>
              )}
            </>
          )}

          {/* ARBOR */}
          {structureType === "Structures - Arbor" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Count</Label>
                  <Input className="mt-1" type="number" value={form.count || ""} onChange={e => set("count", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Length (ft)</Label>
                  <Input className="mt-1" type="number" value={form.length || ""} onChange={e => set("length", e.target.value)} placeholder="0" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Height (ft)</Label>
                  <Input className="mt-1" type="number" value={form.height || ""} onChange={e => set("height", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Width (ft)</Label>
                  <Input className="mt-1" type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" />
                </div>
              </div>

              <div>
                <Label>Footing Size / Depth</Label>
                <Input className="mt-1" value={form.footing || ""} onChange={e => set("footing", e.target.value)} placeholder='e.g. 12" diameter / 36" deep' />
              </div>

              <div>
                <Label>Material</Label>
                <Input className="mt-1" value={form.material || ""} onChange={e => set("material", e.target.value)} placeholder="e.g. Cedar, Pressure Treated..." />
              </div>

              <div>
                <Label>Hand or Machine</Label>
                <SelectButtons value={form.arbor_dig_mode} onChange={v => set("arbor_dig_mode", v)} options={["Hand", "Machine"]} />
              </div>
              {form.arbor_dig_mode === "Hand" && (
                <div>
                  <Label>Dig Post Holes — Unit Hours</Label>
                  <Input className="mt-1" type="number" value={form.arbor_dig_hours || ""} onChange={e => set("arbor_dig_hours", e.target.value)} placeholder="0" />
                </div>
              )}
              {form.arbor_dig_mode === "Machine" && (
                <>
                  <div>
                    <Label>Machine Type</Label>
                    <SelectButtons value={form.arbor_machine_type} onChange={v => set("arbor_machine_type", v)} options={["Dingo", "Vermeer"]} />
                  </div>
                  <div>
                    <Label>Dig Post Holes — Unit Hours</Label>
                    <Input className="mt-1" type="number" value={form.arbor_dig_hours || ""} onChange={e => set("arbor_dig_hours", e.target.value)} placeholder="0" />
                  </div>
                </>
              )}

              <div>
                <Label>Needs Level Pad?</Label>
                <SelectButtons value={form.needs_level_pad} onChange={v => set("needs_level_pad", v)} options={["Yes", "No"]} />
              </div>

              <div>
                <Label>Remove Count</Label>
                <Input className="mt-1" type="number" value={form.remove_count || ""} onChange={e => set("remove_count", e.target.value)} placeholder="0" />
              </div>
            </>
          )}

          {/* RAISED GARDEN BED */}
          {structureType === "Raised Garden Bed" && (
            <>
              <div>
                <Label>Material</Label>
                <SelectButtons value={form.material} onChange={v => set("material", v)} options={["Wood", "Metal"]} />
              </div>

              <div>
                <Label>Quantity</Label>
                <Input className="mt-1" type="number" value={form.quantity || ""} onChange={e => set("quantity", e.target.value)} placeholder="0" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Length (ft)</Label>
                  <Input className="mt-1" type="number" value={form.length || ""} onChange={e => set("length", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Width (ft)</Label>
                  <Input className="mt-1" type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" />
                </div>
              </div>

              {totalSF && <CalcBox label="Total SF (all beds)" value={totalSF} unit="SF" />}

              <div>
                <Label>Soil Depth (in)</Label>
                <Input className="mt-1" type="number" value={form.soil_depth || ""} onChange={e => set("soil_depth", e.target.value)} placeholder="0" />
              </div>

              {cy && <CalcBox label="Soil Volume (CY)" value={cy} unit="CY" />}

              <div>
                <Label>Base Level?</Label>
                <SelectButtons value={form.base_level} onChange={v => set("base_level", v)} options={["Yes", "No"]} />
              </div>

              <div>
                <Label>Machine Access</Label>
                <SelectButtons value={form.machine_access} onChange={v => set("machine_access", v)} options={["Vermeer", "Dingo", "None"]} />
              </div>
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