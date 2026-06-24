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
  "Dry Stream Bed (NW) (NC)",
  "Impervious Membrane Below Drainage Rock",
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

function MultiSelect({ value = [], onChange, options }) {
  const arr = Array.isArray(value) ? value : [];
  const toggle = (opt) => arr.includes(opt) ? onChange(arr.filter(x => x !== opt)) : onChange([...arr, opt]);
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {options.map(opt => (
        <button key={opt} type="button" onClick={() => toggle(opt)}
          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${arr.includes(opt) ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
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

function SectionHeader({ children }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground pt-2">{children}</p>;
}

// Shared: Excavation block (Machine/Hand, machine type w/ check-access warning, trencher)
function ExcavationBlock({ form, set }) {
  return (
    <div className="space-y-3 border rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Excavation</p>
      <div>
        <Label>Machine or Hand?</Label>
        <SelectButtons value={form.excavation_mode} onChange={v => set("excavation_mode", v)} options={["Machine", "Hand"]} />
      </div>
      {form.excavation_mode === "Machine" && (<>
        <div>
          <Label>Machine Type <span className="text-xs text-amber-600 font-normal ml-1">(⚠️ check access)</span></Label>
          <SelectButtons value={form.machine_type} onChange={v => set("machine_type", v)} options={["Vermeer", "Dingo"]} />
        </div>
        <div>
          <Label>Trencher or excavator attachment needed?</Label>
          <SelectButtons value={form.trencher_needed} onChange={v => set("trencher_needed", v)} options={["Yes", "No"]} />
        </div>
      </>)}
    </div>
  );
}

// Shared: 7 PVC fitting counts
const PVC_FITTINGS = [
  { key: "fit_90_long", label: "90° Long Turn" },
  { key: "fit_90_tight", label: "Standard 90° Tight" },
  { key: "fit_22_5", label: "22.5° Elbow" },
  { key: "fit_hub_45", label: "Hub 45° Elbow" },
  { key: "fit_tee", label: "Tee" },
  { key: "fit_wye", label: "Wye" },
  { key: "fit_cleanout", label: "Cleanout Assembly" },
];
function PVCFittingsBlock({ form, set }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      {PVC_FITTINGS.map(f => (
        <div key={f.key}>
          <Label className="text-xs">{f.label}</Label>
          <Input className="mt-1" type="number" value={form[f.key] || ""} onChange={e => set(f.key, e.target.value)} placeholder="0" />
        </div>
      ))}
    </div>
  );
}

// Shared: Miter drain yes/no → type → count
function MiterDrainBlock({ form, set }) {
  return (
    <div className="space-y-2">
      <Label>Miter Drain Needed?</Label>
      <SelectButtons value={form.miter_drain} onChange={v => set("miter_drain", v)} options={["Yes", "No"]} />
      {form.miter_drain === "Yes" && (<>
        <div>
          <Label className="text-xs">Heavy Duty or Light Duty?</Label>
          <SelectButtons value={form.miter_drain_type} onChange={v => set("miter_drain_type", v)} options={["Heavy Duty", "Light Duty"]} />
        </div>
        <div>
          <Label className="text-xs">Count</Label>
          <Input type="number" value={form.miter_drain_count || ""} onChange={e => set("miter_drain_count", e.target.value)} placeholder="0" />
        </div>
      </>)}
    </div>
  );
}

// Shared: Catch basin yes/no → size → count
function CatchBasinBlock({ form, set }) {
  return (
    <div className="space-y-2">
      <Label>Catch Basin Needed?</Label>
      <SelectButtons value={form.catch_basin} onChange={v => set("catch_basin", v)} options={["Yes", "No"]} />
      {form.catch_basin === "Yes" && (<>
        <div>
          <Label className="text-xs">Size</Label>
          <SelectButtons value={form.catch_basin_size} onChange={v => set("catch_basin_size", v)} options={['9" × 9"', '12" × 12" with grate']} />
        </div>
        <div>
          <Label className="text-xs">Count</Label>
          <Input type="number" value={form.catch_basin_count || ""} onChange={e => set("catch_basin_count", e.target.value)} placeholder="0" />
        </div>
      </>)}
    </div>
  );
}

// Shared: Lawn repair with note
function LawnRepairBlock({ form, set }) {
  return (
    <div className="space-y-2">
      <Label>Lawn Repair Needed?</Label>
      <SelectButtons value={form.lawn_repair} onChange={v => set("lawn_repair", v)} options={["Yes", "No"]} />
      {form.lawn_repair === "Yes" && (
        <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
          ⚠️ Lawn repair is not included unless a work area is added.
        </div>
      )}
    </div>
  );
}

// Shared: Sod removal + optional disposal method
function SodRemovalBlock({ form, set, showDisposal = false }) {
  return (
    <div className="space-y-2">
      <Label>Sod Removal?</Label>
      <SelectButtons value={form.sod_removal} onChange={v => set("sod_removal", v)} options={["Yes", "No"]} />
      {form.sod_removal === "Yes" && showDisposal && (
        <div>
          <Label className="text-xs">Disposal Method</Label>
          <Input value={form.sod_disposal_method || ""} onChange={e => set("sod_disposal_method", e.target.value)} placeholder="e.g. Haul off, On site..." />
        </div>
      )}
    </div>
  );
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
      const flags = f._flags || []; const flagLabels = f._flag_labels || {};
      if (flags.includes(key)) { const u = { ...flagLabels }; delete u[key]; return { ...f, _flags: flags.filter(x => x !== key), _flag_labels: u }; }
      return { ...f, _flags: [...flags, key], _flag_labels: { ...flagLabels, [key]: label } };
    });
  }

  // Derived calcs
  const isStream = drainType === "Dry Stream Bed (NW) (NC)" || drainType === "Dry Stream Bed";
  const isMembrane = drainType === "Impervious Membrane Below Drainage Rock";
  const lf = parseFloat(form.lf) || 0;
  const streamWidth = parseFloat(form.width) || 0;
  const streamDepth = parseFloat(form.stream_depth) || 0;
  const sf = isStream && lf && streamWidth ? (lf * streamWidth).toFixed(1) : null;
  const streamStoneCY = sf && streamDepth ? ((parseFloat(sf) * (streamDepth / 12)) / 27).toFixed(2) : null;

  const membLength = parseFloat(form.rough_length) || 0;
  const membWidth = parseFloat(form.rough_width) || 0;
  const membDepthIn = parseFloat(form.rough_depth_in) || 0;
  const membCY = membLength && membWidth && membDepthIn ? ((membLength * membWidth * (membDepthIn / 12)) / 27).toFixed(2) : null;

  const topsoilSF = parseFloat(form.topsoil_sf) || 0;
  const suggestedTopsoilCY = topsoilSF ? ((topsoilSF * 2 / 12) / 27).toFixed(2) : null;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.drainage_data);
    const entry = { ...form, drain_type: drainType, sub_type: drainType, sf, streamStoneCY, membCY };
    const updated = opId ? ops.map(o => o.id === opId ? entry : o) : [...ops, { ...entry, id: generateId() }];
    await OfflineAreas.update(areaId, { drainage_data: JSON.stringify(updated) });
    setSaving(false);
    navigate(`/area/${areaId}`);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found.</p></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Drainage</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">{[1, 2].map(n => <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />)}</div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Drain Type</h2>
          <div className="grid grid-cols-1 gap-3">
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

          {/* Time estimate — all types */}
          <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
            <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
          </FlagField>

          {/* LF — all except Impervious Membrane */}
          {!isMembrane && (
            <FlagField fieldKey="lf" label="Linear Feet (LF)" flags={form._flags || []} onToggle={toggleFlag}>
              <Input type="number" value={form.lf || ""} onChange={e => set("lf", e.target.value)} placeholder="0" />
            </FlagField>
          )}

          {/* ───────────────────────────────────────── */}
          {/* BURIED DOWNSPOUT                         */}
          {/* ───────────────────────────────────────── */}
          {drainType === "Buried Downspout" && (<>
            <ExcavationBlock form={form} set={set} />
            <SodRemovalBlock form={form} set={set} />
            <div>
              <Label>Extra time for rocks/roots/obstructions (hrs)</Label>
              <Input className="mt-1" type="number" value={form.obstruction_hours || ""} onChange={e => set("obstruction_hours", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Zip Level Needed?</Label>
              <SelectButtons value={form.zip_level} onChange={v => set("zip_level", v)} options={["Yes", "No"]} />
            </div>
            <div>
              <Label>PVC Glue, Primer &amp; Supplies Needed? Count?</Label>
              <Input className="mt-1" type="number" value={form.pvc_glue_count || ""} onChange={e => set("pvc_glue_count", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>PVC Fittings Needed?</Label>
              <SelectButtons value={form.pvc_fittings} onChange={v => set("pvc_fittings", v)} options={["Yes", "No"]} />
              {form.pvc_fittings === "Yes" && <PVCFittingsBlock form={form} set={set} />}
            </div>
            <div className="space-y-2">
              <Label>Downspout Connection Assembly Needed?</Label>
              <SelectButtons value={form.ds_assembly} onChange={v => set("ds_assembly", v)} options={["Yes", "No"]} />
              {form.ds_assembly === "Yes" && (<>
                <div>
                  <Label className="text-xs">Size</Label>
                  <SelectButtons value={form.ds_assembly_size} onChange={v => set("ds_assembly_size", v)} options={['3" × 4"', '2" × 3"']} />
                </div>
                <div>
                  <Label className="text-xs">Count</Label>
                  <Input type="number" value={form.ds_assembly_count || ""} onChange={e => set("ds_assembly_count", e.target.value)} placeholder="0" />
                </div>
              </>)}
            </div>
            <CatchBasinBlock form={form} set={set} />
            <MiterDrainBlock form={form} set={set} />
            <LawnRepairBlock form={form} set={set} />
          </>)}

          {/* ───────────────────────────────────────── */}
          {/* BURIED DRAIN                             */}
          {/* ───────────────────────────────────────── */}
          {drainType === "Buried Drain" && (<>
            <ExcavationBlock form={form} set={set} />
            <SodRemovalBlock form={form} set={set} />
            <div>
              <Label>Extra time for rocks/roots/obstructions (hrs)</Label>
              <Input className="mt-1" type="number" value={form.obstruction_hours || ""} onChange={e => set("obstruction_hours", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Zip Level Needed?</Label>
              <SelectButtons value={form.zip_level} onChange={v => set("zip_level", v)} options={["Yes", "No"]} />
            </div>
            <CatchBasinBlock form={form} set={set} />
            <div>
              <Label>Atrium Drain Needed? Count?</Label>
              <Input className="mt-1" type="number" value={form.atrium_drain_count || ""} onChange={e => set("atrium_drain_count", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>PVC Fittings Needed?</Label>
              <SelectButtons value={form.pvc_fittings} onChange={v => set("pvc_fittings", v)} options={["Yes", "No"]} />
              {form.pvc_fittings === "Yes" && <PVCFittingsBlock form={form} set={set} />}
            </div>
            <div>
              <Label>PVC Glue, Primer &amp; Supplies Needed? Count?</Label>
              <Input className="mt-1" type="number" value={form.pvc_glue_count || ""} onChange={e => set("pvc_glue_count", e.target.value)} placeholder="0" />
            </div>
            <MiterDrainBlock form={form} set={set} />
            <LawnRepairBlock form={form} set={set} />
          </>)}

          {/* ───────────────────────────────────────── */}
          {/* BURIED SUMP LINE                         */}
          {/* ───────────────────────────────────────── */}
          {drainType === "Buried Sump Line" && (<>
            <ExcavationBlock form={form} set={set} />
            <SodRemovalBlock form={form} set={set} />
            <div>
              <Label>Extra time for rocks/roots/obstructions (hrs)</Label>
              <Input className="mt-1" type="number" value={form.obstruction_hours || ""} onChange={e => set("obstruction_hours", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Zip Level Needed?</Label>
              <SelectButtons value={form.zip_level} onChange={v => set("zip_level", v)} options={["Yes", "No"]} />
            </div>
            <div>
              <Label>PVC Glue, Primer &amp; Supplies Needed? Count?</Label>
              <Input className="mt-1" type="number" value={form.pvc_glue_count || ""} onChange={e => set("pvc_glue_count", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>PVC Fittings Needed?</Label>
              <SelectButtons value={form.pvc_fittings} onChange={v => set("pvc_fittings", v)} options={["Yes", "No"]} />
              {form.pvc_fittings === "Yes" && <PVCFittingsBlock form={form} set={set} />}
            </div>
            <div>
              <Label>Freezedrain Assembly Needed? Count?</Label>
              <Input className="mt-1" type="number" value={form.freezedrain_count || ""} onChange={e => set("freezedrain_count", e.target.value)} placeholder="0" />
            </div>
            <MiterDrainBlock form={form} set={set} />
            <div className="space-y-2">
              <Label>Topsoil / Screened Soil Needed for Finish Grading?</Label>
              <SelectButtons value={form.topsoil_needed} onChange={v => set("topsoil_needed", v)} options={["Yes", "No"]} />
              {form.topsoil_needed === "Yes" && (<>
                <div>
                  <Label className="text-xs">Area SF (for recommendation)</Label>
                  <Input type="number" value={form.topsoil_sf || ""} onChange={e => set("topsoil_sf", e.target.value)} placeholder="0" />
                </div>
                {suggestedTopsoilCY && <CalcBox label="Suggested CY (2 inch depth)" value={suggestedTopsoilCY} unit="CY" />}
                <div>
                  <Label className="text-xs">Cubic Yards</Label>
                  <Input type="number" value={form.topsoil_cy || ""} onChange={e => set("topsoil_cy", e.target.value)} placeholder={suggestedTopsoilCY || "0"} />
                </div>
              </>)}
            </div>
            <LawnRepairBlock form={form} set={set} />
          </>)}

          {/* ───────────────────────────────────────── */}
          {/* CURTAIN DRAIN                            */}
          {/* ───────────────────────────────────────── */}
          {drainType === "Curtain Drain" && (<>
            <ExcavationBlock form={form} set={set} />
            <SodRemovalBlock form={form} set={set} showDisposal={true} />
          </>)}

          {/* ───────────────────────────────────────── */}
          {/* DRY STREAM BED                           */}
          {/* ───────────────────────────────────────── */}
          {isStream && (<>
            <ExcavationBlock form={form} set={set} />
            <div>
              <Label>Ball Cart Needed?</Label>
              <SelectButtons value={form.ball_cart_needed} onChange={v => set("ball_cart_needed", v)} options={["Yes", "No"]} />
            </div>
            <div className="space-y-2">
              <Label>Boulders Needed?</Label>
              <SelectButtons value={form.boulders_needed} onChange={v => set("boulders_needed", v)} options={["Yes", "No"]} />
              {form.boulders_needed === "Yes" && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label className="text-xs">Fieldstone 10–18"</Label>
                    <Input className="mt-1" type="number" value={form.fieldstone_10_18 || ""} onChange={e => set("fieldstone_10_18", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Fieldstone 18–24"</Label>
                    <Input className="mt-1" type="number" value={form.fieldstone_18_24 || ""} onChange={e => set("fieldstone_18_24", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Fieldstone 24–30"</Label>
                    <Input className="mt-1" type="number" value={form.fieldstone_24_30 || ""} onChange={e => set("fieldstone_24_30", e.target.value)} placeholder="0" />
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Drainage Rock / Wash Stone Needed?</Label>
              <SelectButtons value={form.drainage_rock_needed} onChange={v => set("drainage_rock_needed", v)} options={["Yes", "No"]} />
              {form.drainage_rock_needed === "Yes" && (<>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <Label className="text-xs">Width (ft)</Label>
                    <Input className="mt-1" type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Depth (in)</Label>
                    <Input className="mt-1" type="number" value={form.stream_depth || ""} onChange={e => set("stream_depth", e.target.value)} placeholder="0" />
                  </div>
                </div>
                {sf && <CalcBox label="Square Footage" value={sf} unit="SF" />}
                {streamStoneCY && <CalcBox label="Drainage Rock" value={streamStoneCY} unit="CY" />}
              </>)}
            </div>
            <div className="space-y-1">
              <Label>Spoil Type (select all that apply)</Label>
              <MultiSelect value={form.spoil_types} onChange={v => set("spoil_types", v)} options={["Rubble", "Dirt", "Sod", "Stone"]} />
            </div>
          </>)}

          {/* ───────────────────────────────────────── */}
          {/* FRENCH DRAIN                             */}
          {/* ───────────────────────────────────────── */}
          {drainType === "French Drain" && (<>
            <ExcavationBlock form={form} set={set} />
            <div className="space-y-1">
              <Label>Spoil Type (select all that apply)</Label>
              <MultiSelect
                value={form.spoil_types}
                onChange={v => set("spoil_types", v)}
                options={["Rubble", "Dirt", "Sod", "Stone", "Ken Wagner w/ machine — remain on site", "Hauled off"]}
              />
            </div>
            <div className="space-y-2">
              <Label>Corrugated Drain Tile Needed?</Label>
              <SelectButtons value={form.corrugated_drain} onChange={v => set("corrugated_drain", v)} options={["Yes", "No"]} />
              {form.corrugated_drain === "Yes" && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <Label className="text-xs">Perforated in Sock — Count</Label>
                    <Input className="mt-1" type="number" value={form.corr_perf_count || ""} onChange={e => set("corr_perf_count", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Solid — Count</Label>
                    <Input className="mt-1" type="number" value={form.corr_solid_count || ""} onChange={e => set("corr_solid_count", e.target.value)} placeholder="0" />
                  </div>
                </div>
              )}
            </div>
            <div>
              <Label>PVC Cleanout Assembly Needed? Count?</Label>
              <Input className="mt-1" type="number" value={form.pvc_cleanout_count || ""} onChange={e => set("pvc_cleanout_count", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Miscellaneous Drainage Material Needed?</Label>
              <Textarea className="mt-1" value={form.misc_drainage_material || ""} onChange={e => set("misc_drainage_material", e.target.value)} placeholder="Describe any miscellaneous materials..." rows={2} />
            </div>
            <div>
              <Label>Coarse / Washed Sand Needed? (tons)</Label>
              <Input className="mt-1" type="number" value={form.coarse_sand_tons || ""} onChange={e => set("coarse_sand_tons", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Zip Level Needed?</Label>
              <SelectButtons value={form.zip_level} onChange={v => set("zip_level", v)} options={["Yes", "No"]} />
            </div>
            <div>
              <Label>Drainage Rock / Wash Stone 1.5" Needed? (tons)</Label>
              <Input className="mt-1" type="number" value={form.drainage_rock_tons || ""} onChange={e => set("drainage_rock_tons", e.target.value)} placeholder="0" />
            </div>
          </>)}

          {/* ───────────────────────────────────────── */}
          {/* IMPERVIOUS MEMBRANE BELOW DRAINAGE ROCK  */}
          {/* ───────────────────────────────────────── */}
          {isMembrane && (<>
            <div className="space-y-3">
              <Label>Rough Grading, Excavation &amp; Hauling Needed?</Label>
              <SelectButtons value={form.rough_grading} onChange={v => set("rough_grading", v)} options={["Yes", "No"]} />
              {form.rough_grading === "Yes" && (<>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Length (ft)</Label>
                    <Input className="mt-1" type="number" value={form.rough_length || ""} onChange={e => set("rough_length", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Width (ft)</Label>
                    <Input className="mt-1" type="number" value={form.rough_width || ""} onChange={e => set("rough_width", e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">Depth (in)</Label>
                    <Input className="mt-1" type="number" value={form.rough_depth_in || ""} onChange={e => set("rough_depth_in", e.target.value)} placeholder="0" />
                  </div>
                </div>
                {membCY && <CalcBox label="Excavation Volume" value={membCY} unit="CY" />}
                <ExcavationBlock form={form} set={set} />
                <div>
                  <Label>Detail Excavation for Pitches Labor (hrs)</Label>
                  <Input className="mt-1" type="number" value={form.detail_excavation_hrs || ""} onChange={e => set("detail_excavation_hrs", e.target.value)} placeholder="0" />
                </div>
              </>)}
            </div>
            <div>
              <Label>Place Membrane (sandwiched between woven fabric) — Labor (hrs)</Label>
              <Input className="mt-1" type="number" value={form.membrane_hrs || ""} onChange={e => set("membrane_hrs", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Rubber Roofing Membrane Needed? Rolls?</Label>
              <Input className="mt-1" type="number" value={form.rubber_membrane_rolls || ""} onChange={e => set("rubber_membrane_rolls", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Woven Fabric Including Pins Needed? (SF)</Label>
              <Input className="mt-1" type="number" value={form.woven_fabric_sf || ""} onChange={e => set("woven_fabric_sf", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Place Stone &amp; Smooth Labor (hrs)</Label>
              <Input className="mt-1" type="number" value={form.place_stone_hrs || ""} onChange={e => set("place_stone_hrs", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Drainage Rock / Wash Stone 1.5" Needed? (tons)</Label>
              <Input className="mt-1" type="number" value={form.drainage_rock_tons || ""} onChange={e => set("drainage_rock_tons", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Edging Needed?</Label>
              <SelectButtons value={form.edging_needed} onChange={v => set("edging_needed", v)} options={["Yes", "No"]} />
              {form.edging_needed === "No" && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  ⚠️ If edging is needed, add a Bed Edging operation.
                </div>
              )}
            </div>
            <div>
              <Label>6-Mil Black Poly Plastic Needed? Rolls?</Label>
              <Input className="mt-1" type="number" value={form.black_poly_rolls || ""} onChange={e => set("black_poly_rolls", e.target.value)} placeholder="0" />
            </div>
          </>)}

          {/* Notes — all types */}
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