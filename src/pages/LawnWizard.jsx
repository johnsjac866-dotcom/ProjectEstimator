import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseOps } from "@/lib/opsUtils";
import FlagField from "@/components/FlagField";

const LAWN_TYPES = ["Sod Installation", "Seed Install", "Top Dress Lawn"];

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

export default function LawnWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [lawnType, setLawnType] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);
  const [showBedPrepPrompt, setShowBedPrepPrompt] = useState(false);
  const [savedOpId, setSavedOpId] = useState(null);

  const opId = new URLSearchParams(window.location.search).get("opId");

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      if (!a) { setArea(null); return; }
      setArea(a);
      if (opId) {
        const ops = parseOps(a.lawn_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) { setLawnType(existing.lawn_type); setForm(existing); setStep(2); }
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

  // Derived calcs
  const length = parseFloat(form.length) || 0;
  const width = parseFloat(form.width) || 0;
  const sf = length > 0 && width > 0 ? (length * width) : null;
  const sfDisplay = sf ? sf.toFixed(1) : null;

  // Sod: rolls = sf / 10, pins = rolls * 3 (only on slope), pallets = 1 per 15 rolls if >= 15
  const rolls = sf ? Math.ceil(sf / 10) : null;
  const pins = (rolls && form.on_slope === "Yes") ? rolls * 3 : null;
  const pallets = (rolls && rolls >= 15) ? Math.ceil(rolls / 15) : null;

  // Fertilizer SF defaults to same SF
  const fertSF = form.fertilizer_sf_override || sfDisplay;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.lawn_data);
    const newOpId = generateId();
    const entry = { ...form, lawn_type: lawnType, sub_type: lawnType, sf: sfDisplay, rolls, pins, pallets };
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? entry : o);
    } else {
      updated = [...ops, { ...entry, id: newOpId }];
    }
    await OfflineAreas.update(areaId, { lawn_data: JSON.stringify(updated) });
    const finalOpId = opId || newOpId;
    setSavedOpId(finalOpId);
    setShowBedPrepPrompt(true);
    setSaving(false);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found. Please go back and try again.</p></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Lawn Repair & Install</h1>
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
            {LAWN_TYPES.map(type => (
              <button key={type} type="button"
                onClick={() => { setLawnType(type); setForm({ lawn_type: type, sub_type: type }); setStep(2); }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all">
                <p className="font-medium text-sm">{type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && lawnType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{lawnType}</span>
          </div>

          {/* Dimensions — all types */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dimensions</p>
            <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
              <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
            </FlagField>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Length (ft)</Label><Input className="mt-1" type="number" value={form.length || ""} onChange={e => set("length", e.target.value)} placeholder="0" /></div>
              <div><Label>Width (ft)</Label><Input className="mt-1" type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" /></div>
            </div>
            {sfDisplay && <CalcBox label="Square Footage" value={sfDisplay} unit="SF" />}
          </div>

          {/* SOD INSTALLATION */}
          {lawnType === "Sod Installation" && (
            <>
              {rolls && <CalcBox label="Rolls Needed (10 SF/roll)" value={rolls} unit="rolls" />}

              <FlagField fieldKey="on_slope" label="On a Slope?" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.on_slope} onChange={v => set("on_slope", v)} options={["Yes", "No"]} />
              </FlagField>

              {pins && <CalcBox label="Pins Needed (3/roll)" value={pins} unit="pins" />}

              <div>
                <Label>SF Extra for Waste</Label>
                <Input className="mt-1" type="number" value={form.sf_waste || ""} onChange={e => set("sf_waste", e.target.value)} placeholder="0" />
              </div>

              {/* Sod Installation Difficulty */}
              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Installation Difficulty (hrs per difficulty)</p>
                <FlagField fieldKey="diff_easy_hours" label="Easy — large area over 1000 SF with easy cuts (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.diff_easy_hours || ""} onChange={e => set("diff_easy_hours", e.target.value)} placeholder="0" />
                </FlagField>
                <FlagField fieldKey="diff_avg_hours" label="Average (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.diff_avg_hours || ""} onChange={e => set("diff_avg_hours", e.target.value)} placeholder="0" />
                </FlagField>
                <FlagField fieldKey="diff_hard_hours" label="Hard — less than 100 SF (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.diff_hard_hours || ""} onChange={e => set("diff_hard_hours", e.target.value)} placeholder="0" />
                </FlagField>
                <FlagField fieldKey="diff_very_hard_hours" label="Very Hard / Patching In (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.diff_very_hard_hours || ""} onChange={e => set("diff_very_hard_hours", e.target.value)} placeholder="0" />
                </FlagField>
              </div>

              {/* Sod Staples */}
              <FlagField fieldKey="sod_staples_needed" label="Sod Staples Needed?" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.sod_staples_needed} onChange={v => set("sod_staples_needed", v)} options={["Yes", "No"]} />
              </FlagField>
              {form.sod_staples_needed === "Yes" && (
                <FlagField fieldKey="sod_staples_count" label="Sod Staples Count" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.sod_staples_count || ""} onChange={e => set("sod_staples_count", e.target.value)} placeholder="0" />
                </FlagField>
              )}

              {/* Pallets */}
              <FlagField fieldKey="pallets_needed" label="Pallets Needed?" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.pallets_needed} onChange={v => set("pallets_needed", v)} options={["Yes", "No"]} />
              </FlagField>
              {form.pallets_needed === "Yes" && (
                <FlagField fieldKey="pallets_count" label="Pallets Count" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.pallets_count || ""} onChange={e => set("pallets_count", e.target.value)} placeholder="0" />
                </FlagField>
              )}

              {/* Watering */}
              <FlagField fieldKey="watering_on_install" label="Watering Upon Installation?" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.watering_on_install} onChange={v => set("watering_on_install", v)} options={["Yes", "No"]} />
              </FlagField>
              {form.watering_on_install === "Yes" && (
                <>
                  <FlagField fieldKey="water_access" label="Water Access?" flags={form._flags || []} onToggle={toggleFlag}>
                    <SelectButtons value={form.water_access} onChange={v => set("water_access", v)} options={["Yes", "No"]} />
                  </FlagField>
                  <FlagField fieldKey="watering_time_hours" label="Watering Time (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                    <Input type="number" value={form.watering_time_hours || ""} onChange={e => set("watering_time_hours", e.target.value)} placeholder="0" />
                  </FlagField>
                </>
              )}

              <FlagField fieldKey="fertilizer" label="Fertilizer?" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.fertilizer} onChange={v => set("fertilizer", v)} options={["Yes", "No"]} />
                {form.fertilizer === "Yes" && (
                  <div className="mt-2">
                    <Label className="text-xs">Fertilizer SF (default: same as area SF)</Label>
                    <Input className="mt-1" type="number" value={form.fertilizer_sf_override || sfDisplay || ""} onChange={e => set("fertilizer_sf_override", e.target.value)} placeholder={sfDisplay || "0"} />
                  </div>
                )}
              </FlagField>

              <FlagField fieldKey="distance_to_truck" label="Distance to Truck (ft)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.distance_to_truck || ""} onChange={e => set("distance_to_truck", e.target.value)} placeholder="0" />
              </FlagField>

              <FlagField fieldKey="machine_access" label="Machine Access" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.machine_access} onChange={v => set("machine_access", v)} options={["Dingo", "Vermeer", "None"]} />
              </FlagField>

              <FlagField fieldKey="sod_type" label="Sod Type" flags={form._flags || []} onToggle={toggleFlag}>
                <SelectButtons value={form.sod_type} onChange={v => set("sod_type", v)} options={["Bluegrass", "Tall Fescue Blend"]} />
              </FlagField>
            </>
          )}

          {/* SEED INSTALL */}
          {lawnType === "Seed Install" && (() => {
            const seedSF = parseFloat(form.sf_seed) || sf || 0;
            const baseSeedLbs = seedSF ? (seedSF / 1000) * 10 : 0;
            const extraSeedLbs = form.extra_seed === "Yes" && baseSeedLbs ? (baseSeedLbs * 0.25).toFixed(1) : null;
            const coverSF = parseFloat(form.sf_seed) || sf || 0;
            const mulchBags = form.cover_method === "Mulch Pellet" && coverSF ? Math.ceil(coverSF / 200) : null; // 50lb bag covers ~200SF
            const mulchBuckets = mulchBags ? Math.ceil(mulchBags * 0.25) : null;
            const strawRolls = form.cover_method === "Straw Netting" && coverSF ? Math.ceil(coverSF / 800) : null;
            return (
              <>
                {/* Area */}
                <FlagField fieldKey="sf_seed" label="Area to Seed (SF)" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.sf_seed || ""} onChange={e => set("sf_seed", e.target.value)} placeholder={sfDisplay || "0"} />
                </FlagField>

                {/* Seed Type */}
                <FlagField fieldKey="seed_type" label="Seed Type" flags={form._flags || []} onToggle={toggleFlag}>
                  <SelectButtons value={form.seed_type} onChange={v => set("seed_type", v)} options={["Madison Parks", "Shady Place", "Survivor"]} />
                </FlagField>

                {/* Seed Amount */}
                {baseSeedLbs > 0 && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 border px-3 py-2 text-sm">
                    <span className="text-muted-foreground">Estimated Seed (10 lb/1000 SF)</span>
                    <span className="font-semibold">{baseSeedLbs.toFixed(1)} <span className="text-muted-foreground font-normal">lbs</span></span>
                  </div>
                )}
                <FlagField fieldKey="seed_lbs" label="Seed Amount (lbs) — edit if needed" flags={form._flags || []} onToggle={toggleFlag}>
                  <Input type="number" value={form.seed_lbs || (baseSeedLbs > 0 ? baseSeedLbs.toFixed(1) : "")} onChange={e => set("seed_lbs", e.target.value)} placeholder={baseSeedLbs > 0 ? baseSeedLbs.toFixed(1) : "0"} />
                </FlagField>

                {/* Extra seed to match installed */}
                <FlagField fieldKey="extra_seed" label="Extra Seed to Match Installed?" flags={form._flags || []} onToggle={toggleFlag}>
                  <SelectButtons value={form.extra_seed} onChange={v => set("extra_seed", v)} options={["Yes", "No"]} />
                </FlagField>
                {form.extra_seed === "Yes" && extraSeedLbs && (
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm">
                    <span className="text-blue-700">Extra Seed (25% of above)</span>
                    <span className="font-semibold text-blue-800">{extraSeedLbs} <span className="font-normal">lbs</span></span>
                  </div>
                )}

                {/* Cover Method */}
                <FlagField fieldKey="cover_method" label="Cover Method" flags={form._flags || []} onToggle={toggleFlag}>
                  <SelectButtons value={form.cover_method} onChange={v => set("cover_method", v)} options={["Mulch Pellet", "Straw Netting"]} />
                </FlagField>

                {form.cover_method === "Mulch Pellet" && (
                  <div className="border rounded-lg p-3 space-y-2">
                    {mulchBags && <CalcBox label="Bags Needed (50 lb each)" value={mulchBags} unit="bags" />}
                    <FlagField fieldKey="mulch_bags" label="Bags (confirm/edit)" flags={form._flags || []} onToggle={toggleFlag}>
                      <Input type="number" value={form.mulch_bags || mulchBags || ""} onChange={e => set("mulch_bags", e.target.value)} placeholder={mulchBags || "0"} />
                    </FlagField>
                    {mulchBuckets && <CalcBox label="Bucket Needed (25% of bags)" value={mulchBuckets} unit="buckets" />}
                    <FlagField fieldKey="mulch_buckets" label="Buckets (confirm/edit)" flags={form._flags || []} onToggle={toggleFlag}>
                      <Input type="number" value={form.mulch_buckets || mulchBuckets || ""} onChange={e => set("mulch_buckets", e.target.value)} placeholder={mulchBuckets || "0"} />
                    </FlagField>
                  </div>
                )}

                {form.cover_method === "Straw Netting" && (
                  <div className="border rounded-lg p-3 space-y-2">
                    <FlagField fieldKey="straw_mat_type" label="Straw Mat Type" flags={form._flags || []} onToggle={toggleFlag}>
                      <SelectButtons value={form.straw_mat_type} onChange={v => set("straw_mat_type", v)} options={["Single Net 60", "Curlex Doublenet"]} />
                    </FlagField>
                    {strawRolls && <CalcBox label="Rolls Needed (1 roll = 800 SF)" value={strawRolls} unit="rolls" />}
                    <FlagField fieldKey="straw_rolls" label="Rolls (confirm/edit)" flags={form._flags || []} onToggle={toggleFlag}>
                      <Input type="number" value={form.straw_rolls || strawRolls || ""} onChange={e => set("straw_rolls", e.target.value)} placeholder={strawRolls || "0"} />
                    </FlagField>
                    <FlagField fieldKey="straw_sod_staples" label="Sod Staples (count)" flags={form._flags || []} onToggle={toggleFlag}>
                      <Input type="number" value={form.straw_sod_staples || ""} onChange={e => set("straw_sod_staples", e.target.value)} placeholder="0" />
                    </FlagField>
                  </div>
                )}

                {/* Temporary downspout extensions */}
                <FlagField fieldKey="temp_downspout_needed" label="Temporary Downspout Extensions Needed?" flags={form._flags || []} onToggle={toggleFlag}>
                  <SelectButtons value={form.temp_downspout_needed} onChange={v => set("temp_downspout_needed", v)} options={["Yes", "No"]} />
                </FlagField>
                {form.temp_downspout_needed === "Yes" && (
                  <FlagField fieldKey="temp_downspout_lf" label="Downspout Extension Length (LF)" flags={form._flags || []} onToggle={toggleFlag}>
                    <Input type="number" value={form.temp_downspout_lf || ""} onChange={e => set("temp_downspout_lf", e.target.value)} placeholder="0" />
                  </FlagField>
                )}

                <div>
                  <Label>Water Access?</Label>
                  <SelectButtons value={form.water_access} onChange={v => set("water_access", v)} options={["Yes", "No"]} />
                </div>

                <div>
                  <Label>Fertilizer?</Label>
                  <SelectButtons value={form.fertilizer} onChange={v => set("fertilizer", v)} options={["Yes", "No"]} />
                  {form.fertilizer === "Yes" && (
                    <div className="mt-2">
                      <Label className="text-xs">Fertilizer SF</Label>
                      <Input className="mt-1" type="number" value={form.fertilizer_sf_override || sfDisplay || ""} onChange={e => set("fertilizer_sf_override", e.target.value)} placeholder={sfDisplay || "0"} />
                    </div>
                  )}
                </div>

                <div>
                  <Label>Bed Preparation Needed?</Label>
                  <SelectButtons value={form.bed_prep_needed} onChange={v => set("bed_prep_needed", v)} options={["Yes", "No"]} />
                </div>
              </>
            );
          })()}

          {/* TOP DRESS LAWN */}
          {lawnType === "Top Dress Lawn" && (
            <>
              <div>
                <Label>Top Dress Depth (in)</Label>
                <Input className="mt-1" type="number" value={form.top_dress_depth || ""} onChange={e => set("top_dress_depth", e.target.value)} placeholder="0" />
              </div>

              <div>
                <Label>Material</Label>
                <SelectButtons value={form.material} onChange={v => set("material", v)} options={["Compost", "Soil Blend"]} />
              </div>

              <div>
                <Label>Overseed?</Label>
                <SelectButtons value={form.overseed} onChange={v => set("overseed", v)} options={["Yes", "No"]} />
              </div>

              <div>
                <Label>Aerate?</Label>
                <SelectButtons value={form.aerate} onChange={v => set("aerate", v)} options={["Yes", "No"]} />
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

      {/* Bed Prep Prompt Dialog */}
      <Dialog open={showBedPrepPrompt} onOpenChange={() => navigate(`/area/${areaId}`)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Bed Preparation Required?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Is bed preparation required for this area? You can start a Bed Prep form now or dismiss to continue.</p>
          <div className="flex gap-3 mt-2">
            <Button className="flex-1" onClick={() => navigate(`/bed-prep-wizard/${areaId}`)}>
              Start Bed Prep Form
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/area/${areaId}`)}>
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}