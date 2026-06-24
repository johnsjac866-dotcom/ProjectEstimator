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
  "Impervious Membrane",
];

const PIPE_GROUP = ["Buried Downspout", "Buried Drain", "Buried Sump Line"];
const FILTER_GROUP = ["Curtain Drain", "French Drain"];
const SOIL_OPTS = ["Rubble", "Dirt", "Sod", "Stone"];

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

function SoilMultiSelect({ value = [], onChange }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter(x => x !== opt) : [...value, opt]);
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {SOIL_OPTS.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${value.includes(opt) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function ExcavationSection({ form, set, excavCY, drainType }) {
  const soilComp = form.soil_composition || [];
  const toggleSoil = (opt) => set("soil_composition", soilComp.includes(opt) ? soilComp.filter(x => x !== opt) : [...soilComp, opt]);
  return (
    <div className="space-y-3 border rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Excavation</p>
      <div>
        <Label>Excavation Method</Label>
        <SelectButtons value={form.excavation_mode} onChange={v => set("excavation_mode", v)} options={["Machine", "Hand"]} />
        {form.excavation_mode === "Machine" && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
            <p className="text-xs text-amber-700 font-medium">⚠️ Check access before proceeding</p>
            <Label className="text-xs">Machine Type</Label>
            <SelectButtons value={form.excavation_machine_type} onChange={v => set("excavation_machine_type", v)} options={["Vermeer", "Dingo"]} />
          </div>
        )}
      </div>
      <div>
        <Label>Trencher or Excavator Attachment Needed?</Label>
        <SelectButtons value={form.trencher_attachment} onChange={v => set("trencher_attachment", v)} options={["Yes", "No"]} />
      </div>
      <div>
        <Label>Excavation Depth (in)</Label>
        <Input className="mt-1" type="number" value={form.excavation_depth || ""} onChange={e => set("excavation_depth", e.target.value)} placeholder="0" />
      </div>
      <div>
        <Label>Soil Type (select all that apply)</Label>
        <SoilMultiSelect value={soilComp} onChange={toggleSoil} />
      </div>
      <div>
        <Label>Spoil Disposal</Label>
        <SelectButtons value={form.spoil_type} onChange={v => set("spoil_type", v)} options={["Remain on site", "Hauled off"]} />
        {form.spoil_type === "Hauled off" && (
          <div className="mt-2">
            <Label className="text-xs">Disposal Site</Label>
            <Input className="mt-1" value={form.disposal_site || ""} onChange={e => set("disposal_site", e.target.value)} placeholder="Disposal site location" />
          </div>
        )}
      </div>
      {excavCY && <CalcBox label="Excavation CY" value={excavCY} unit="CY" />}
      <div>
        <Label>Sod Removal?</Label>
        <SelectButtons value={form.sod_removal} onChange={v => set("sod_removal", v)} options={["Yes", "No"]} />
        {drainType === "Curtain Drain" && form.sod_removal === "Yes" && (
          <div className="mt-2">
            <Label className="text-xs">Disposal Method</Label>
            <Input className="mt-1" value={form.sod_disposal_method || ""} onChange={e => set("sod_disposal_method", e.target.value)} placeholder="Disposal method..." />
          </div>
        )}
      </div>
      <div>
        <Label>Extra Time for Rocks / Roots / Obstructions (hrs)</Label>
        <Input className="mt-1" type="number" value={form.obstruction_hours || ""} onChange={e => set("obstruction_hours", e.target.value)} placeholder="0" />
      </div>
      <div>
        <Label>Zip Level Needed?</Label>
        <SelectButtons value={form.zip_level} onChange={v => set("zip_level", v)} options={["Yes", "No"]} />
      </div>
    </div>
  );
}

const PVC_FITTINGS = [
  { k: "fit_90_long_turn", l: "90° Long Turn" },
  { k: "fit_90_tight", l: "Std 90° Tight" },
  { k: "fit_22_5_elbow", l: "22.5° Elbow" },
  { k: "fit_hub_45_elbow", l: "Hub 45° Elbow" },
  { k: "fit_tee", l: "Tee" },
  { k: "fit_wye", l: "Wye" },
  { k: "fit_cleanout", l: "Cleanout Assembly" },
];

function PVCFittingsSection({ form, set }) {
  return (
    <div className="space-y-3 border rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PVC Supplies &amp; Fittings</p>
      <div>
        <Label>PVC Glue, Primer &amp; Supplies Needed?</Label>
        <SelectButtons value={form.pvc_supplies_needed} onChange={v => set("pvc_supplies_needed", v)} options={["Yes", "No"]} />
        {form.pvc_supplies_needed === "Yes" && (
          <div className="mt-2">
            <Label className="text-xs">Count</Label>
            <Input className="mt-1" type="number" value={form.pvc_supplies_count || ""} onChange={e => set("pvc_supplies_count", e.target.value)} placeholder="0" />
          </div>
        )}
      </div>
      <div>
        <Label>PVC Fittings Needed?</Label>
        <SelectButtons value={form.pvc_fittings_needed} onChange={v => set("pvc_fittings_needed", v)} options={["Yes", "No"]} />
        {form.pvc_fittings_needed === "Yes" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {PVC_FITTINGS.map(f => (
              <div key={f.k}>
                <Label className="text-xs">{f.l}</Label>
                <Input className="mt-1" type="number" value={form[f.k] || ""} onChange={e => set(f.k, e.target.value)} placeholder="0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiterDrainSection({ form, set }) {
  return (
    <div>
      <Label>Miter Drain Needed?</Label>
      <SelectButtons value={form.miter_drain} onChange={v => set("miter_drain", v)} options={["Yes", "No"]} />
      {form.miter_drain === "Yes" && (
        <div className="mt-2 space-y-2">
          <div>
            <Label className="text-xs">Heavy Duty or Light Duty?</Label>
            <SelectButtons value={form.miter_drain_type} onChange={v => set("miter_drain_type", v)} options={["Heavy duty", "Light duty"]} />
          </div>
          <div>
            <Label className="text-xs">Count</Label>
            <Input className="mt-1" type="number" value={form.miter_drain_count || ""} onChange={e => set("miter_drain_count", e.target.value)} placeholder="0" />
          </div>
        </div>
      )}
    </div>
  );
}

function CatchBasinSection({ form, set }) {
  return (
    <div>
      <Label>Catch Basin Needed?</Label>
      <SelectButtons value={form.catch_basin_needed} onChange={v => set("catch_basin_needed", v)} options={["Yes", "No"]} />
      {form.catch_basin_needed === "Yes" && (
        <div className="mt-2 space-y-2">
          <div>
            <Label className="text-xs">Size</Label>
            <SelectButtons value={form.catch_basin_size} onChange={v => set("catch_basin_size", v)} options={['9" × 9"', '12" × 12" with grate']} />
          </div>
          <div>
            <Label className="text-xs">Count</Label>
            <Input className="mt-1" type="number" value={form.catch_basin_count || ""} onChange={e => set("catch_basin_count", e.target.value)} placeholder="0" />
          </div>
        </div>
      )}
    </div>
  );
}

function LawnRepairNote({ form, set }) {
  return (
    <div>
      <Label>Lawn Repair Needed?</Label>
      <SelectButtons value={form.lawn_repair} onChange={v => set("lawn_repair", v)} options={["Yes", "No"]} />
      <p className="text-xs text-muted-foreground mt-1">⚠️ Lawn repair is not included unless work area is added.</p>
    </div>
  );
}

function calcCY(lf, pipeSizeIn, depthIn, wide = false) {
  if (!lf || !pipeSizeIn || !depthIn) return null;
  const widthFt = (parseFloat(pipeSizeIn) + (wide ? 12 : 6)) / 12;
  return ((parseFloat(lf) * widthFt * (parseFloat(depthIn) / 12)) / 27).toFixed(2);
}

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

  const flags = form._flags || [];
  const lf = parseFloat(form.lf) || 0;
  const pipeIn = parseFloat(form.pipe_size) || 0;
  const excDepthIn = parseFloat(form.excavation_depth) || 0;
  const streamWidth = parseFloat(form.width) || 0;
  const streamDepth = parseFloat(form.stream_depth) || 0;

  const sf = drainType === "Dry Stream Bed" && lf && streamWidth ? (lf * streamWidth).toFixed(1) : null;
  const excavCY = lf && pipeIn && excDepthIn ? calcCY(lf, pipeIn, excDepthIn, FILTER_GROUP.includes(drainType)) : null;
  const stoneCY = FILTER_GROUP.includes(drainType) && form.stone_needed === "Yes" && lf && pipeIn && excDepthIn
    ? calcCY(lf, pipeIn, excDepthIn, true) : null;
  const streamStoneCY = drainType === "Dry Stream Bed" && sf && streamDepth ? calcStreamStoneCY(sf, streamDepth) : null;

  // Impervious Membrane calcs
  const memL = parseFloat(form.mem_length) || 0;
  const memW = parseFloat(form.mem_width) || 0;
  const memD = parseFloat(form.mem_depth) || 0;
  const membraneCY = memL && memW && memD ? ((memL * memW * memD / 12) / 27).toFixed(2) : null;

  // Sump Line topsoil CY recommendation
  const topsoilSF = lf && pipeIn ? (lf * (pipeIn + 6) / 12).toFixed(0) : null;
  const topsoilCYrecommend = topsoilSF ? ((parseFloat(topsoilSF) * 0.25) / 27).toFixed(2) : null;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.drainage_data);
    const entry = { ...form, drain_type: drainType, sub_type: drainType, sf, excavCY, stoneCY, streamStoneCY, membraneCY };
    const updated = opId ? ops.map(o => o.id === opId ? entry : o) : [...ops, { ...entry, id: generateId() }];
    await OfflineAreas.update(areaId, { drainage_data: JSON.stringify(updated) });
    setSaving(false);
    navigate(`/area/${areaId}`);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found.</p></div>;

  const isPipe = PIPE_GROUP.includes(drainType);
  const isFilter = FILTER_GROUP.includes(drainType);
  const isStream = drainType === "Dry Stream Bed";
  const isMembrane = drainType === "Impervious Membrane";

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Drainage</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />)}
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

          {/* ── IMPERVIOUS MEMBRANE ── */}
          {isMembrane && (<>
            <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
            </FlagField>

            <div>
              <Label>Rough Grading, Excavation &amp; Hauling Needed?</Label>
              <SelectButtons value={form.rough_grading_needed} onChange={v => set("rough_grading_needed", v)} options={["Yes", "No"]} />
            </div>

            {form.rough_grading_needed === "Yes" && (
              <div className="space-y-3 border rounded-lg p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rough Grading &amp; Excavation</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Length (ft)</Label>
                    <Input className="mt-1" type="number" value={form.mem_length || ""} onChange={e => set("mem_length", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Width (ft)</Label>
                    <Input className="mt-1" type="number" value={form.mem_width || ""} onChange={e => set("mem_width", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Depth (in)</Label>
                    <Input className="mt-1" type="number" value={form.mem_depth || ""} onChange={e => set("mem_depth", e.target.value)} placeholder="0" />
                  </div>
                </div>
                {membraneCY && <CalcBox label="Excavation CY" value={membraneCY} unit="CY" />}
                <div>
                  <Label>Excavation Method</Label>
                  <SelectButtons value={form.excavation_mode} onChange={v => set("excavation_mode", v)} options={["Machine", "Hand"]} />
                  {form.excavation_mode === "Machine" && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                      <p className="text-xs text-amber-700 font-medium">⚠️ Check access before proceeding</p>
                      <Label className="text-xs">Machine Type</Label>
                      <SelectButtons value={form.excavation_machine_type} onChange={v => set("excavation_machine_type", v)} options={["Vermeer", "Dingo"]} />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <Label>Detail Excavation for Appropriate Pitches — Labor (hrs)</Label>
              <Input className="mt-1" type="number" value={form.detail_excavation_hours || ""} onChange={e => set("detail_excavation_hours", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Place Membrane Sandwiched in Woven Fabric — Labor (hrs)</Label>
              <Input className="mt-1" type="number" value={form.place_membrane_hours || ""} onChange={e => set("place_membrane_hours", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Rubber Roofing Membrane Needed?</Label>
              <SelectButtons value={form.roofing_membrane_needed} onChange={v => set("roofing_membrane_needed", v)} options={["Yes", "No"]} />
              {form.roofing_membrane_needed === "Yes" && (
                <div className="mt-2">
                  <Label className="text-xs">Rolls</Label>
                  <Input className="mt-1" type="number" value={form.roofing_membrane_rolls || ""} onChange={e => set("roofing_membrane_rolls", e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
            <div>
              <Label>Woven Fabric Including Pins Needed?</Label>
              <SelectButtons value={form.woven_fabric_needed} onChange={v => set("woven_fabric_needed", v)} options={["Yes", "No"]} />
              {form.woven_fabric_needed === "Yes" && (
                <div className="mt-2">
                  <Label className="text-xs">Square Feet</Label>
                  <Input className="mt-1" type="number" value={form.woven_fabric_sf || ""} onChange={e => set("woven_fabric_sf", e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
            <div>
              <Label>Place Stone &amp; Smooth — Labor (hrs)</Label>
              <Input className="mt-1" type="number" value={form.place_stone_hours || ""} onChange={e => set("place_stone_hours", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Drainage Rock / Wash Stone 1.5" Needed?</Label>
              <SelectButtons value={form.drainage_rock_needed} onChange={v => set("drainage_rock_needed", v)} options={["Yes", "No"]} />
              {form.drainage_rock_needed === "Yes" && (
                <div className="mt-2">
                  <Label className="text-xs">Tons</Label>
                  <Input className="mt-1" type="number" value={form.drainage_rock_tons || ""} onChange={e => set("drainage_rock_tons", e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
            <div>
              <Label>Edging Needed?</Label>
              <SelectButtons value={form.edging_needed} onChange={v => set("edging_needed", v)} options={["Yes", "No"]} />
              {form.edging_needed === "No" && (
                <p className="text-xs text-amber-600 mt-1">⚠️ Add edging operation if needed.</p>
              )}
            </div>
            <div>
              <Label>6-Mil Black Poly Plastic Needed?</Label>
              <SelectButtons value={form.poly_plastic_needed} onChange={v => set("poly_plastic_needed", v)} options={["Yes", "No"]} />
              {form.poly_plastic_needed === "Yes" && (
                <div className="mt-2">
                  <Label className="text-xs">Rolls</Label>
                  <Input className="mt-1" type="number" value={form.poly_plastic_rolls || ""} onChange={e => set("poly_plastic_rolls", e.target.value)} placeholder="0" />
                </div>
              )}
            </div>
          </>)}

          {/* ── ALL OTHER TYPES ── */}
          {!isMembrane && (<>
            <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
            </FlagField>

            <FlagField fieldKey="lf" label="Linear Feet (LF)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.lf || ""} onChange={e => set("lf", e.target.value)} placeholder="0" />
            </FlagField>

            {isStream && (<>
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
            </>)}

            {(isPipe || isFilter) && (
              <div>
                <Label>Pipe Size (in)</Label>
                <Input className="mt-1" type="number" value={form.pipe_size || ""} onChange={e => set("pipe_size", e.target.value)} placeholder="e.g. 4" />
              </div>
            )}

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

            {/* Shared excavation section for all non-membrane types */}
            <ExcavationSection form={form} set={set} excavCY={excavCY} drainType={drainType} />

            {/* ── BURIED DOWNSPOUT ── */}
            {drainType === "Buried Downspout" && (<>
              <PVCFittingsSection form={form} set={set} />
              <div>
                <Label>Downspout Connection Assembly Needed?</Label>
                <SelectButtons value={form.downspout_connection_needed} onChange={v => set("downspout_connection_needed", v)} options={["Yes", "No"]} />
                {form.downspout_connection_needed === "Yes" && (
                  <div className="mt-2 space-y-2">
                    <div>
                      <Label className="text-xs">Size</Label>
                      <SelectButtons value={form.downspout_connection_size} onChange={v => set("downspout_connection_size", v)} options={['3" × 4"', '2" × 3"']} />
                    </div>
                    <div>
                      <Label className="text-xs">Count</Label>
                      <Input className="mt-1" type="number" value={form.downspout_connection_count || ""} onChange={e => set("downspout_connection_count", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                )}
              </div>
              <CatchBasinSection form={form} set={set} />
              <MiterDrainSection form={form} set={set} />
              <LawnRepairNote form={form} set={set} />
            </>)}

            {/* ── BURIED DRAIN ── */}
            {drainType === "Buried Drain" && (<>
              <CatchBasinSection form={form} set={set} />
              <div>
                <Label>Atrium Drain Needed?</Label>
                <SelectButtons value={form.atrium_drain_needed} onChange={v => set("atrium_drain_needed", v)} options={["Yes", "No"]} />
                {form.atrium_drain_needed === "Yes" && (
                  <div className="mt-2">
                    <Label className="text-xs">Count</Label>
                    <Input className="mt-1" type="number" value={form.atrium_drain_count || ""} onChange={e => set("atrium_drain_count", e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
              <PVCFittingsSection form={form} set={set} />
              <MiterDrainSection form={form} set={set} />
              <LawnRepairNote form={form} set={set} />
            </>)}

            {/* ── BURIED SUMP LINE ── */}
            {drainType === "Buried Sump Line" && (<>
              <PVCFittingsSection form={form} set={set} />
              <div>
                <Label>Freezedrain Assembly Needed?</Label>
                <SelectButtons value={form.freezedrain_needed} onChange={v => set("freezedrain_needed", v)} options={["Yes", "No"]} />
                {form.freezedrain_needed === "Yes" && (
                  <div className="mt-2">
                    <Label className="text-xs">Count</Label>
                    <Input className="mt-1" type="number" value={form.freezedrain_count || ""} onChange={e => set("freezedrain_count", e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
              <MiterDrainSection form={form} set={set} />
              <div>
                <Label>Topsoil / Screened Soil for Finish Grading?</Label>
                <SelectButtons value={form.topsoil_needed} onChange={v => set("topsoil_needed", v)} options={["Yes", "No"]} />
                {form.topsoil_needed === "Yes" && (
                  <div className="mt-2 space-y-2">
                    {topsoilCYrecommend && (
                      <p className="text-xs text-muted-foreground">Recommended: ~{topsoilCYrecommend} CY based on trench dimensions</p>
                    )}
                    <div>
                      <Label className="text-xs">Cubic Yards</Label>
                      <Input className="mt-1" type="number" value={form.topsoil_cy || ""} onChange={e => set("topsoil_cy", e.target.value)} placeholder={topsoilCYrecommend || "0"} />
                    </div>
                  </div>
                )}
              </div>
              <LawnRepairNote form={form} set={set} />
            </>)}

            {/* ── CURTAIN DRAIN ── */}
            {drainType === "Curtain Drain" && (<>
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
            </>)}

            {/* ── FRENCH DRAIN ── */}
            {drainType === "French Drain" && (<>
              <div>
                <Label>Corrugated Drain Tile Needed?</Label>
                <SelectButtons value={form.corrugated_tile_needed} onChange={v => set("corrugated_tile_needed", v)} options={["Yes", "No"]} />
                {form.corrugated_tile_needed === "Yes" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Perforated in Sock (count)</Label>
                      <Input className="mt-1" type="number" value={form.tile_perforated_sock_count || ""} onChange={e => set("tile_perforated_sock_count", e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs">Solid (count)</Label>
                      <Input className="mt-1" type="number" value={form.tile_solid_count || ""} onChange={e => set("tile_solid_count", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>PVC Cleanout Assembly Needed?</Label>
                <SelectButtons value={form.pvc_cleanout_needed} onChange={v => set("pvc_cleanout_needed", v)} options={["Yes", "No"]} />
                {form.pvc_cleanout_needed === "Yes" && (
                  <div className="mt-2">
                    <Label className="text-xs">Count</Label>
                    <Input className="mt-1" type="number" value={form.pvc_cleanout_count || ""} onChange={e => set("pvc_cleanout_count", e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
              <div>
                <Label>Miscellaneous Drainage Material Needed?</Label>
                <SelectButtons value={form.misc_drainage_needed} onChange={v => set("misc_drainage_needed", v)} options={["Yes", "No"]} />
                {form.misc_drainage_needed === "Yes" && (
                  <Textarea className="mt-2" value={form.misc_drainage_notes || ""} onChange={e => set("misc_drainage_notes", e.target.value)} placeholder="Describe miscellaneous drainage materials..." rows={2} />
                )}
              </div>
              <div>
                <Label>Coarse / Washed Sand Needed?</Label>
                <SelectButtons value={form.coarse_sand_needed} onChange={v => set("coarse_sand_needed", v)} options={["Yes", "No"]} />
                {form.coarse_sand_needed === "Yes" && (
                  <div className="mt-2">
                    <Label className="text-xs">Tons</Label>
                    <Input className="mt-1" type="number" value={form.coarse_sand_tons || ""} onChange={e => set("coarse_sand_tons", e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
              <div>
                <Label>Drainage Rock / Wash Stone 1.5" Needed?</Label>
                <SelectButtons value={form.drainage_rock_needed} onChange={v => set("drainage_rock_needed", v)} options={["Yes", "No"]} />
                {form.drainage_rock_needed === "Yes" && (
                  <div className="mt-2">
                    <Label className="text-xs">Tons</Label>
                    <Input className="mt-1" type="number" value={form.drainage_rock_tons || ""} onChange={e => set("drainage_rock_tons", e.target.value)} placeholder="0" />
                  </div>
                )}
              </div>
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
            </>)}

            {/* ── DRY STREAM BED ── */}
            {isStream && (<>
              <div>
                <Label>Ball Cart Needed?</Label>
                <SelectButtons value={form.ball_cart_needed} onChange={v => set("ball_cart_needed", v)} options={["Yes", "No"]} />
              </div>
              <div>
                <Label>Boulders Needed?</Label>
                <SelectButtons value={form.boulders_needed} onChange={v => set("boulders_needed", v)} options={["Yes", "No"]} />
                {form.boulders_needed === "Yes" && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs">Fieldstone 10–18" Count</Label>
                      <Input className="mt-1" type="number" value={form.fieldstone_10_18 || ""} onChange={e => set("fieldstone_10_18", e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs">Fieldstone 18–24" Count</Label>
                      <Input className="mt-1" type="number" value={form.fieldstone_18_24 || ""} onChange={e => set("fieldstone_18_24", e.target.value)} placeholder="0" />
                    </div>
                    <div>
                      <Label className="text-xs">Fieldstone 24–30" Count</Label>
                      <Input className="mt-1" type="number" value={form.fieldstone_24_30 || ""} onChange={e => set("fieldstone_24_30", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>Drainage Rock / Wash Stone Needed?</Label>
                <SelectButtons value={form.drainage_rock_needed} onChange={v => set("drainage_rock_needed", v)} options={["Yes", "No"]} />
                {form.drainage_rock_needed === "Yes" && (
                  <div className="mt-2 space-y-2">
                    {streamStoneCY && <CalcBox label="Estimated Stone CY" value={streamStoneCY} unit="CY" />}
                    <div>
                      <Label className="text-xs">CY (confirm)</Label>
                      <Input className="mt-1" type="number" value={form.drainage_rock_cy || ""} onChange={e => set("drainage_rock_cy", e.target.value)} placeholder={streamStoneCY || "0"} />
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>Stone Type</Label>
                <Input className="mt-1" value={form.stone_type || ""} onChange={e => set("stone_type", e.target.value)} placeholder="e.g. River rock, Cobble" />
              </div>
              <div>
                <Label>Decorative vs Functional?</Label>
                <SelectButtons value={form.stream_purpose} onChange={v => set("stream_purpose", v)} options={["Decorative", "Functional"]} />
              </div>
            </>)}
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