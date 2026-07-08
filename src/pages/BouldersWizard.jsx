import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseOps } from "@/lib/opsUtils";
import FlagField from "@/components/FlagField";

const STRUCTURE_TYPES = ["Boulders / Accents", "Structures - Fence", "Structures - Arbor", "Raised Garden Bed"];

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

  // Scroll to first flagged field
  useEffect(() => {
    if (step !== 2 || !(form._flags?.length > 0)) return;
    const timer = setTimeout(() => {
      for (const el of document.querySelectorAll('[data-flagfield]')) {
        if ((form._flags || []).includes(el.getAttribute('data-flagfield'))) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [step, form._flags]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function toggleFlag(key, label) {
    setForm(f => {
      const fl = f._flags || []; const lb = f._flag_labels || {};
      if (fl.includes(key)) { const u = { ...lb }; delete u[key]; return { ...f, _flags: fl.filter(x => x !== key), _flag_labels: u }; }
      return { ...f, _flags: [...fl, key], _flag_labels: { ...lb, [key]: label } };
    });
  }
  const flags = form._flags || [];

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
    const entry = { ...form, sub_type: structureType, total_sf: totalSF, total_cy: cy };
    const updated = opId ? ops.map(o => o.id === opId ? entry : o) : [...ops, { ...entry, id: generateId() }];
    await OfflineAreas.update(areaId, { boulders_data: JSON.stringify(updated) });
    setSaving(false);
    navigate(`/area/${areaId}`);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found.</p></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Boulders/Accents & Structures</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">{[1, 2].map(n => <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />)}</div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Type</h2>
          <div className="grid grid-cols-1 gap-3">
            {STRUCTURE_TYPES.map(type => (
              <button key={type} type="button" onClick={() => { setStructureType(type); setForm({ sub_type: type }); setStep(2); }}
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

          <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
          </FlagField>

          {structureType === "Boulders / Accents" && (<>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Size — Count per Range</p>
            <FlagField fieldKey="count_24_30" label='Number of 24" – 30"' flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.count_24_30 || ""} onChange={e => set("count_24_30", e.target.value)} placeholder="0" />
            </FlagField>
            <FlagField fieldKey="count_18_24" label='Number of 18" – 24"' flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.count_18_24 || ""} onChange={e => set("count_18_24", e.target.value)} placeholder="0" />
            </FlagField>
            <FlagField fieldKey="count_12_18" label='Number of 12" – 18"' flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.count_12_18 || ""} onChange={e => set("count_12_18", e.target.value)} placeholder="0" />
            </FlagField>
            <FlagField fieldKey="color_preference" label="Color Preference" flags={flags} onToggle={toggleFlag}>
              <Input value={form.color_preference || ""} onChange={e => set("color_preference", e.target.value)} placeholder="e.g. Grey, Brown, Mixed..." />
            </FlagField>
            <FlagField fieldKey="ball_cart_needed" label="Ball Cart Needed?" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.ball_cart_needed} onChange={v => set("ball_cart_needed", v)} options={["Yes", "No"]} />
            </FlagField>
            <FlagField fieldKey="dump_trailer_needed" label="Dump Trailer Needed?" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.dump_trailer_needed} onChange={v => set("dump_trailer_needed", v)} options={["Yes", "No"]} />
            </FlagField>
            <FlagField fieldKey="machine_access" label="Machine Access" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.machine_access} onChange={v => set("machine_access", v)} options={["Vermeer", "Dingo", "None"]} />
            </FlagField>
            <FlagField fieldKey="delivery_supplier" label="Supplier" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.delivery_supplier} onChange={v => set("delivery_supplier", v)} options={["Midwest", "Madison Block", "Special Order"]} />
            </FlagField>
            {form.delivery_supplier === "Special Order" && (
              <FlagField fieldKey="delivery_special_order" label="Special Order Details" flags={flags} onToggle={toggleFlag}>
                <Input value={form.delivery_special_order || ""} onChange={e => set("delivery_special_order", e.target.value)} placeholder="Specify supplier..." />
              </FlagField>
            )}
            <FlagField fieldKey="constraints" label="Constraints or Hazards" flags={flags} onToggle={toggleFlag}>
              <Textarea value={form.constraints || ""} onChange={e => set("constraints", e.target.value)} placeholder="Describe any constraints or hazards..." rows={3} />
            </FlagField>
          </>)}

          {structureType === "Structures - Fence" && (<>
            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-sm">⚠️ Note: Check property line and utilities before installation.</div>
            <div className="grid grid-cols-2 gap-3">
              <FlagField fieldKey="lf" label="Linear Feet (LF)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.lf || ""} onChange={e => set("lf", e.target.value)} placeholder="0" />
              </FlagField>
              <FlagField fieldKey="height" label="Height (ft)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.height || ""} onChange={e => set("height", e.target.value)} placeholder="0" />
              </FlagField>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gates</p>
            <div className="grid grid-cols-2 gap-3">
              <FlagField fieldKey="gate_count" label="Gate Count" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.gate_count || ""} onChange={e => set("gate_count", e.target.value)} placeholder="0" />
              </FlagField>
              <FlagField fieldKey="gate_width" label="Gate Width (ft)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.gate_width || ""} onChange={e => set("gate_width", e.target.value)} placeholder="0" />
              </FlagField>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Material</p>
            <div className="grid grid-cols-2 gap-3">
              <FlagField fieldKey="fence_cedar_2x2" label='Cedar 2x2" (count)' flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.fence_cedar_2x2 || ""} onChange={e => set("fence_cedar_2x2", e.target.value)} placeholder="0" />
              </FlagField>
              <FlagField fieldKey="fence_cedar_4x4" label="4x4x8' Rough Sawn Cedar (count)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.fence_cedar_4x4 || ""} onChange={e => set("fence_cedar_4x4", e.target.value)} placeholder="0" />
              </FlagField>
            </div>
            <FlagField fieldKey="fence_fasteners" label="Fasteners (count)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.fence_fasteners || ""} onChange={e => set("fence_fasteners", e.target.value)} placeholder="0" />
            </FlagField>
            <FlagField fieldKey="post_spacing" label="Post Spacing (ft)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.post_spacing || ""} onChange={e => set("post_spacing", e.target.value)} placeholder="0" />
            </FlagField>
            <FlagField fieldKey="fence_dig_mode" label="Hand or Machine" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.fence_dig_mode} onChange={v => set("fence_dig_mode", v)} options={["Hand", "Machine"]} />
            </FlagField>
            {form.fence_dig_mode === "Machine" && (
              <FlagField fieldKey="fence_machine_type" label="Machine Type" flags={flags} onToggle={toggleFlag}>
                <SelectButtons value={form.fence_machine_type} onChange={v => set("fence_machine_type", v)} options={["Dingo", "Vermeer"]} />
              </FlagField>
            )}
            <FlagField fieldKey="fence_dig_hours" label="Dig Post Holes — Unit Hours" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.fence_dig_hours || ""} onChange={e => set("fence_dig_hours", e.target.value)} placeholder="0" />
            </FlagField>
          </>)}

          {structureType === "Structures - Arbor" && (<>
            <div className="grid grid-cols-2 gap-3">
              <FlagField fieldKey="count" label="Count" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.count || ""} onChange={e => set("count", e.target.value)} placeholder="0" />
              </FlagField>
              <FlagField fieldKey="length" label="Length (ft)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.length || ""} onChange={e => set("length", e.target.value)} placeholder="0" />
              </FlagField>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FlagField fieldKey="height" label="Height (ft)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.height || ""} onChange={e => set("height", e.target.value)} placeholder="0" />
              </FlagField>
              <FlagField fieldKey="width" label="Width (ft)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" />
              </FlagField>
            </div>
            <FlagField fieldKey="footing" label="Footing Size / Depth" flags={flags} onToggle={toggleFlag}>
              <Input value={form.footing || ""} onChange={e => set("footing", e.target.value)} placeholder='e.g. 12" diameter / 36" deep' />
            </FlagField>
            <FlagField fieldKey="material" label="Material" flags={flags} onToggle={toggleFlag}>
              <Input value={form.material || ""} onChange={e => set("material", e.target.value)} placeholder="e.g. Cedar, Pressure Treated..." />
            </FlagField>
            <FlagField fieldKey="arbor_dig_mode" label="Hand or Machine" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.arbor_dig_mode} onChange={v => set("arbor_dig_mode", v)} options={["Hand", "Machine"]} />
            </FlagField>
            {form.arbor_dig_mode === "Machine" && (
              <FlagField fieldKey="arbor_machine_type" label="Machine Type" flags={flags} onToggle={toggleFlag}>
                <SelectButtons value={form.arbor_machine_type} onChange={v => set("arbor_machine_type", v)} options={["Dingo", "Vermeer"]} />
              </FlagField>
            )}
            <FlagField fieldKey="arbor_dig_hours" label="Dig Post Holes — Unit Hours" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.arbor_dig_hours || ""} onChange={e => set("arbor_dig_hours", e.target.value)} placeholder="0" />
            </FlagField>
            <FlagField fieldKey="needs_level_pad" label="Needs Level Pad?" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.needs_level_pad} onChange={v => set("needs_level_pad", v)} options={["Yes", "No"]} />
            </FlagField>
            <FlagField fieldKey="remove_count" label="Remove Count" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.remove_count || ""} onChange={e => set("remove_count", e.target.value)} placeholder="0" />
            </FlagField>
          </>)}

          {structureType === "Raised Garden Bed" && (<>
            <FlagField fieldKey="material" label="Material" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.material} onChange={v => set("material", v)} options={["Wood", "Metal"]} />
            </FlagField>
            <FlagField fieldKey="quantity" label="Quantity" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.quantity || ""} onChange={e => set("quantity", e.target.value)} placeholder="0" />
            </FlagField>
            <div className="grid grid-cols-2 gap-3">
              <FlagField fieldKey="length" label="Length (ft)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.length || ""} onChange={e => set("length", e.target.value)} placeholder="0" />
              </FlagField>
              <FlagField fieldKey="width" label="Width (ft)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" />
              </FlagField>
            </div>
            {totalSF && <CalcBox label="Total SF (all beds)" value={totalSF} unit="SF" />}
            <FlagField fieldKey="soil_depth" label="Soil Depth (in)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.soil_depth || ""} onChange={e => set("soil_depth", e.target.value)} placeholder="0" />
            </FlagField>
            {cy && <CalcBox label="Soil Volume (CY)" value={cy} unit="CY" />}
            <FlagField fieldKey="base_level" label="Base Level?" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.base_level} onChange={v => set("base_level", v)} options={["Yes", "No"]} />
            </FlagField>
            <FlagField fieldKey="machine_access" label="Machine Access" flags={flags} onToggle={toggleFlag}>
              <SelectButtons value={form.machine_access} onChange={v => set("machine_access", v)} options={["Vermeer", "Dingo", "None"]} />
            </FlagField>
          </>)}

          <FlagField fieldKey="notes" label="Additional Notes" flags={flags} onToggle={toggleFlag}>
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