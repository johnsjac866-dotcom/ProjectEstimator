import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseOps } from "@/lib/opsUtils";
import FlagField from "@/components/FlagField";

const DRAIN_TYPES = [
  "Buried Downspout",
  "Buried Drain",
  "Buried Sump Line",
  "Curtain Drain",
  "French Drain",
  "Dry Stream Bed",
];

// Groups for shared logic
const PIPE_GROUP = ["Buried Downspout", "Buried Drain", "Buried Sump Line"];
const FILTER_GROUP = ["Curtain Drain", "French Drain"];

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

// CY from LF × pipe diameter (in) × excavation depth (in)
// trench width ≈ pipe_size + 6 inches for buried pipes; for curtain/french use pipe_size + 12
function calcCY(lf, pipeSizeIn, depthIn, wide = false) {
  if (!lf || !pipeSizeIn || !depthIn) return null;
  const widthFt = (parseFloat(pipeSizeIn) + (wide ? 12 : 6)) / 12;
  return ((parseFloat(lf) * widthFt * (parseFloat(depthIn) / 12)) / 27).toFixed(2);
}

// Stone CY for curtain/french: same trench volume
function calcStoneCY(lf, pipeSizeIn, depthIn) {
  return calcCY(lf, pipeSizeIn, depthIn, true);
}

// Dry stream bed stone CY from SF × depth
function calcStreamStoneCY(sf, depthIn) {
  if (!sf || !depthIn) return null;
  return ((parseFloat(sf) * (parseFloat(depthIn) / 12)) / 27).toFixed(2);
}

export default function DrainageWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [drainType, setDrainType] = useState(null);
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
        const ops = parseOps(a.drainage_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) { setDrainType(existing.drain_type); setForm(existing); setStep(2); }
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

  // Derived calcs
  const lf = parseFloat(form.lf) || 0;
  const pipeIn = parseFloat(form.pipe_size) || 0;
  const excDepthIn = parseFloat(form.excavation_depth) || 0;
  const streamWidth = parseFloat(form.width) || 0;
  const streamDepth = parseFloat(form.stream_depth) || 0;

  const sf = drainType === "Dry Stream Bed" && lf && streamWidth ? (lf * streamWidth).toFixed(1) : null;
  const excavCY = lf && pipeIn && excDepthIn ? calcCY(lf, pipeIn, excDepthIn, FILTER_GROUP.includes(drainType)) : null;
  const stoneCY = FILTER_GROUP.includes(drainType) && form.stone_needed === "Yes" && lf && pipeIn && excDepthIn
    ? calcStoneCY(lf, pipeIn, excDepthIn) : null;
  const streamStoneCY = drainType === "Dry Stream Bed" && sf && streamDepth
    ? calcStreamStoneCY(sf, streamDepth) : null;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.drainage_data);
    const entry = { ...form, drain_type: drainType, sub_type: drainType, sf, excavCY, stoneCY, streamStoneCY };
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? entry : o);
    } else {
      updated = [...ops, { ...entry, id: generateId() }];
    }
    await OfflineAreas.update(areaId, { drainage_data: JSON.stringify(updated) });
    navigate(`/area/${areaId}`);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found. Please go back and try again.</p></div>;

  const isPipe = PIPE_GROUP.includes(drainType);
  const isFilter = FILTER_GROUP.includes(drainType);
  const isStream = drainType === "Dry Stream Bed";

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Drainage</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Drain Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {DRAIN_TYPES.map(type => (
              <button key={type} type="button"
                onClick={() => { setDrainType(type); setForm({ drain_type: type, sub_type: type }); setStep(2); }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all">
                <p className="font-medium text-sm">{type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && drainType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{drainType}</span>
          </div>

          {/* Time Estimate */}
          <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
            <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
          </FlagField>

          {/* LF — all types */}
          <FlagField fieldKey="lf" label="Linear Feet (LF)" flags={form._flags || []} onToggle={toggleFlag}>
            <Input type="number" value={form.lf || ""} onChange={e => set("lf", e.target.value)} placeholder="0" />
          </FlagField>

          {/* Dry Stream Bed: width + stream depth */}
          {isStream && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Width (ft)</Label>
                  <Input className="mt-1" type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label>Depth (in)</Label>
                  <Input className="mt-1" type="number" value={form.stream_depth || ""} onChange={e => set("stream_depth", e.target.value)} placeholder="0" />
                </div>
              </div>
              {sf && <CalcBox label="Square Footage" value={sf} unit="SF" />}
            </>
          )}

          {/* Pipe size — pipe + filter groups */}
          {(isPipe || isFilter) && (
            <div>
              <Label>Pipe Size (in)</Label>
              <Input className="mt-1" type="number" value={form.pipe_size || ""} onChange={e => set("pipe_size", e.target.value)} placeholder='e.g. 4' />
            </div>
          )}

          {/* Existing downspout/drain */}
          {isPipe && (
            <div>
              <Label>Existing Downspout?</Label>
              <SelectButtons value={form.existing_downspout} onChange={v => set("existing_downspout", v)} options={["Yes", "No"]} />
              {form.existing_downspout === "Yes" && (
                <div className="mt-2">
                  <Label className="text-xs">Existing LF</Label>
                  <Input className="mt-1" type="number" value={form.existing_lf || ""} onChange={e => set("existing_lf", e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
          )}
          {isFilter && (
            <div>
              <Label>Existing Drain?</Label>
              <SelectButtons value={form.existing_drain} onChange={v => set("existing_drain", v)} options={["Yes", "No"]} />
              {form.existing_drain === "Yes" && (
                <div className="mt-2">
                  <Label className="text-xs">Existing LF</Label>
                  <Input className="mt-1" type="number" value={form.existing_lf || ""} onChange={e => set("existing_lf", e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
          )}
          {isStream && (
            <div>
              <Label>Existing Downspout?</Label>
              <SelectButtons value={form.existing_downspout} onChange={v => set("existing_downspout", v)} options={["Yes", "No"]} />
              {form.existing_downspout === "Yes" && (
                <div className="mt-2">
                  <Label className="text-xs">Existing LF</Label>
                  <Input className="mt-1" type="number" value={form.existing_lf || ""} onChange={e => set("existing_lf", e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
          )}

          {/* Excavation depth + spoil */}
          <div className="space-y-3 border rounded-lg p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Excavation</p>
            <div>
              <Label>Excavation Depth (in)</Label>
              <Input className="mt-1" type="number" value={form.excavation_depth || ""} onChange={e => set("excavation_depth", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Spoil Type</Label>
              <SelectButtons value={form.spoil_type} onChange={v => set("spoil_type", v)} options={["Remain on site", "Hauled off"]} />
              {form.spoil_type === "Hauled off" && (
                <div className="mt-2">
                  <Label className="text-xs">Disposal Site</Label>
                  <Input className="mt-1" value={form.disposal_site || ""} onChange={e => set("disposal_site", e.target.value)} placeholder="Disposal site location" />
                </div>
              )}
            </div>
            {excavCY && <CalcBox label="Excavation CY" value={excavCY} unit="CY" />}
          </div>

          {/* Number of bends — pipe + filter + stream */}
          <div className="space-y-2">
            <Label>Number of Bends</Label>
            <div className="grid grid-cols-3 gap-3">
              {["22.5°", "30°", "45°"].map(deg => (
                <div key={deg}>
                  <Label className="text-xs">{deg}</Label>
                  <Input className="mt-1" type="number" value={form[`bends_${deg}`] || ""} onChange={e => set(`bends_${deg}`, e.target.value)} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Miter drain — pipe group */}
          {isPipe && (
            <div>
              <Label>Miter Drain?</Label>
              <SelectButtons value={form.miter_drain} onChange={v => set("miter_drain", v)} options={["Yes", "No"]} />
              {form.miter_drain === "Yes" && (
                <div className="mt-2">
                  <Label className="text-xs">How Many</Label>
                  <Input className="mt-1" type="number" value={form.miter_drain_count || ""} onChange={e => set("miter_drain_count", e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
          )}

          {/* Stone + Fabric — filter group */}
          {isFilter && (
            <>
              <div>
                <Label>Stone Needed?</Label>
                <SelectButtons value={form.stone_needed} onChange={v => set("stone_needed", v)} options={["Yes", "No"]} />
                {stoneCY && <div className="mt-2"><CalcBox label="Stone CY" value={stoneCY} unit="CY" /></div>}
              </div>
              <div>
                <Label>Fabric Needed?</Label>
                <SelectButtons value={form.fabric_needed} onChange={v => set("fabric_needed", v)} options={["Yes", "No"]} />
                {form.fabric_needed === "Yes" && (
                  <div className="mt-2">
                    <Label className="text-xs">How Much (SF)</Label>
                    <Input className="mt-1" type="number" value={form.fabric_sf || ""} onChange={e => set("fabric_sf", e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Dry Stream Bed — stone type + decorative */}
          {isStream && (
            <>
              <div>
                <Label>Stone Type</Label>
                <Input className="mt-1" value={form.stone_type || ""} onChange={e => set("stone_type", e.target.value)} placeholder="e.g. River rock, Cobble" />
                {streamStoneCY && <div className="mt-2"><CalcBox label="Stone CY" value={streamStoneCY} unit="CY" /></div>}
              </div>
              <div>
                <Label>Decorative vs Functional?</Label>
                <SelectButtons value={form.stream_purpose} onChange={v => set("stream_purpose", v)} options={["Decorative", "Functional"]} />
              </div>
            </>
          )}

          {/* Notes */}
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