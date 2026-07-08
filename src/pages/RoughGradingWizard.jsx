import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Leaf, Info } from "lucide-react";
import FlagField from "@/components/FlagField";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { RG_SUB_TYPES, RG_FIELDS, calcCY, calcCYFluff, calcEstimatedTons, SOIL_IMPORT_TYPES, DISPOSAL_MATERIAL_TYPES, DISPOSAL_FEE_OPTIONS } from "@/lib/roughGradingStages";
import { parseOps } from "@/lib/opsUtils";

const STEPS = ["Sub-Type", "Measurements", "Details & Constraints"];
const EXCAVATION_SUB_TYPES = ["excavation_hand", "excavation_machine"];

export default function RoughGradingWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const opId = new URLSearchParams(window.location.search).get('opId');
  const [area, setArea] = useState(null);
  const [data, setData] = useState({});
  const [operations, setOperations] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showBedPrepDialog, setShowBedPrepDialog] = useState(false);
  const [savedOpId, setSavedOpId] = useState(null);
  const [sodAdded, setSodAdded] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      if (!a) { setLoading(false); return; }
      setArea(a);
      const ops = parseOps(a.rough_grading_data);
      setOperations(ops);
      if (opId) {
        const existing = ops.find(o => o.id === opId);
        if (existing) setData(existing);
      }
      setLoading(false);
    })();
  }, [areaId, opId]);

  function set(key, value) { setData(d => ({ ...d, [key]: value })); }

  function toggleFlag(key, label) {
    setData(d => {
      const flags = d._flags || [];
      const flagLabels = d._flag_labels || {};
      if (flags.includes(key)) {
        const updated = { ...flagLabels }; delete updated[key];
        return { ...d, _flags: flags.filter(f => f !== key), _flag_labels: updated };
      }
      return { ...d, _flags: [...flags, key], _flag_labels: { ...flagLabels, [key]: label } };
    });
  }
  const flags = data._flags || [];

  function setDim(key, value) {
    setData(d => {
      const updated = { ...d, [key]: value };
      const l = key === "sf_length" ? value : d.sf_length || "";
      const w = key === "sf_width" ? value : d.sf_width || "";
      if (l && w && !isNaN(l) && !isNaN(w)) updated.sf = String(Math.round(parseFloat(l) * parseFloat(w)));
      return updated;
    });
  }

  const cy = calcCY(data.sf, data.depth_inches);
  const cyFluff = calcCYFluff(cy);
  const fields = RG_FIELDS[data.sub_type] || { step2: [], step3: [] };

  async function handleSave() {
    setSaving(true);
    const entryId = opId || String(Date.now());
    const saveData = { ...data, cy: cy != null ? String(cy) : "", cy_fluff: cyFluff != null ? String(cyFluff) : "", id: entryId };
    const updatedOps = [...operations];
    const idx = updatedOps.findIndex(o => o.id === entryId);
    if (idx >= 0) updatedOps[idx] = saveData; else updatedOps.push(saveData);
    await OfflineAreas.update(areaId, { rough_grading_data: JSON.stringify(updatedOps) });

    // Auto-add Strip Sod demolition entry to same area if excavation + sod/vegetation removed
    if (EXCAVATION_SUB_TYPES.includes(data.sub_type) && data.sod_vegetation_removed === "Yes") {
      // Use the area already in state to avoid a race with the background server fetch
      const demoOps = parseOps(area?.demolition_data);
      const stripSodEntry = { id: "strip_sod_auto", group: "vegetation", sub_type: "strip_sod", sf: saveData.sf || "", sf_auto_from_rg: true };
      const demoIdx = demoOps.findIndex(o => o.id === "strip_sod_auto");
      if (demoIdx >= 0) demoOps[demoIdx] = stripSodEntry; else demoOps.push(stripSodEntry);
      await OfflineAreas.update(areaId, { demolition_data: JSON.stringify(demoOps) });
      setSodAdded(true);
    }

    setSaving(false);
    setSavedOpId(entryId);
    setShowBedPrepDialog(true);
  }

  function renderField(field) {
    const show = !field.condition || data[field.condition.key] === field.condition.value;
    if (!show) return null;
    if (field.type === "radio") return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <RadioGroup value={data[field.key] || ""} onValueChange={v => set(field.key, v)}>
          <div className="flex flex-wrap gap-2">
            {field.options.map(o => (
              <label key={o} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${data[field.key] === o ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50"}`}>
                <RadioGroupItem value={o} />{o}
              </label>
            ))}
          </div>
        </RadioGroup>
      </FlagField>
    );
    if (field.type === "select") return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <Select value={data[field.key] || ""} onValueChange={v => set(field.key, v)}>
          <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
          <SelectContent>{field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      </FlagField>
    );
    if (field.type === "number") return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <Input type="number" value={data[field.key] || ""} onChange={e => set(field.key, e.target.value)} />
      </FlagField>
    );
    return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <Input value={data[field.key] || ""} onChange={e => set(field.key, e.target.value)} />
      </FlagField>
    );
  }

  // Multi-select soil types toggle
  function toggleSoilType(type) {
    const current = data.soil_types || [];
    const updated = current.includes(type) ? current.filter(t => t !== type) : [...current, type];
    set("soil_types", updated);
  }

  // Estimated tons for disposal
  const estTons = calcEstimatedTons(data.cy || cy, data.disposal_material_type, data.disposal_dry_wet);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  if (showBedPrepDialog) return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-green-600" /> Bed Preparation Required</DialogTitle>
          <DialogDescription>
            Rough Grading &amp; Hauling is complete.
            {sodAdded && <span className="block mt-2 text-green-700 font-medium">✓ Strip Sod Manually operation has been automatically added to this area.</span>}
            {" "}Bed Preparation is typically required after rough grading — would you like to configure it now?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => navigate(`/area/${areaId}`)}>Dismiss</Button>
          <Button onClick={() => navigate(`/bed-prep-wizard/${areaId}`)}><Leaf className="h-4 w-4 mr-2" /> Start Bed Prep</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2">Step {step + 1} of {STEPS.length} — {area?.name}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${(step + 1) / STEPS.length * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{STEPS[step]}</p>
      </div>
      <div className="bg-card border rounded-xl p-6 mb-6 space-y-5">
        {step === 0 && (
          <>
            <div><h2 className="text-lg font-bold">Select Sub-Type</h2><p className="text-sm text-muted-foreground mt-1">Choose the specific rough grading method.</p></div>
            <RadioGroup value={data.sub_type || ""} onValueChange={v => setData(d => ({ ...d, sub_type: v }))}>
              <div className="space-y-2">
                {RG_SUB_TYPES.map(t => (
                  <label key={t.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data.sub_type === t.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                    <RadioGroupItem value={t.value} /><span className="text-sm font-medium">{t.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-lg font-bold">Measurements</h2><p className="text-sm text-muted-foreground mt-1">Enter dimensions — SF and cubic yards are calculated automatically.</p></div>
            <div className="space-y-2">
              <Label>Square Footage</Label>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs text-muted-foreground">Length (ft)</Label><Input type="number" className="mt-1" placeholder="0" value={data.sf_length || ""} onChange={e => setDim("sf_length", e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Width (ft)</Label><Input type="number" className="mt-1" placeholder="0" value={data.sf_width || ""} onChange={e => setDim("sf_width", e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">SF (auto)</Label><Input type="number" className="mt-1 bg-muted/50" placeholder="0" value={data.sf || ""} onChange={e => set("sf", e.target.value)} /></div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Depth</Label>
              <div className="grid grid-cols-3 gap-2">
                <div><Label className="text-xs text-muted-foreground">Depth (inches)</Label><Input type="number" className="mt-1" placeholder="0" value={data.depth_inches || ""} onChange={e => set("depth_inches", e.target.value)} /></div>
                <div><Label className="text-xs text-muted-foreground">Cubic Yards</Label><Input className="mt-1 bg-muted/50" readOnly value={cy != null ? cy : ""} placeholder="—" /></div>
                <div><Label className="text-xs text-muted-foreground">CY + 25% Fluff</Label><Input className="mt-1 bg-orange-50 border-orange-200 font-semibold" readOnly value={cyFluff != null ? cyFluff : ""} placeholder="—" /></div>
              </div>
            </div>
            {fields.step2.map(renderField)}

            {/* Soil Type multi-select for importation sub-types */}
            {(data.sub_type === "importation_hand" || data.sub_type === "importation_machine") && (
              <FlagField fieldKey="soil_types" label="Soil Type (select all that apply)" flags={flags} onToggle={toggleFlag}>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SOIL_IMPORT_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleSoilType(t)}
                      className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${(data.soil_types || []).includes(t) ? "border-primary bg-primary/5 font-medium text-primary" : "border-border hover:bg-muted/50"}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </FlagField>
            )}
          </>
        )}
        {step === 2 && (
          <>
            <div><h2 className="text-lg font-bold">Details &amp; Constraints</h2></div>
            <div className="space-y-5">
              {fields.step3.map(f => {
                // Inject disposal material/fees section right after disposal_needed for excavation_machine
                if (f.key === "disposal_needed") {
                  return (
                    <div key="disposal_block" className="space-y-5">
                      {renderField(f)}
                      {data.sub_type === "excavation_machine" && data.disposal_needed === "Yes" && (
                        <div className="rounded-lg border border-orange-200 bg-orange-50/40 p-4 space-y-4">
                          <p className="text-sm font-semibold text-orange-800">Disposal Details</p>

                          <FlagField fieldKey="disposal_material_type" label="Material Type" flags={flags} onToggle={toggleFlag}>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {DISPOSAL_MATERIAL_TYPES.map(t => (
                                <button key={t} type="button"
                                  onClick={() => set("disposal_material_type", t)}
                                  className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${data.disposal_material_type === t ? "border-orange-500 bg-orange-100 font-medium" : "border-border hover:bg-muted/50"}`}>
                                  {t}
                                </button>
                              ))}
                            </div>
                          </FlagField>

                          <FlagField fieldKey="disposal_dry_wet" label="Dry or Wet" flags={flags} onToggle={toggleFlag}>
                            <div className="flex gap-2 mt-1">
                              {["Dry", "Wet"].map(v => (
                                <button key={v} type="button"
                                  onClick={() => set("disposal_dry_wet", v)}
                                  className={`px-4 py-1.5 rounded-lg border text-sm transition-colors ${data.disposal_dry_wet === v ? "border-orange-500 bg-orange-100 font-medium" : "border-border hover:bg-muted/50"}`}>
                                  {v}
                                </button>
                              ))}
                            </div>
                          </FlagField>

                          {estTons != null && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-white border border-orange-200 text-sm">
                              <Info className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              <span className="text-muted-foreground">Estimated weight:</span>
                              <span className="font-semibold text-orange-800">{estTons} tons</span>
                              {data.disposal_material_type && data.disposal_dry_wet && (
                                <span className="text-xs text-muted-foreground">({data.disposal_material_type}, {data.disposal_dry_wet})</span>
                              )}
                            </div>
                          )}

                          <FlagField fieldKey="disposal_fees" label="Disposal Fees (select all that apply)" flags={flags} onToggle={toggleFlag}>
                            <div className="flex flex-col gap-2 mt-1">
                              {DISPOSAL_FEE_OPTIONS.map(fee => {
                                const selected = (data.disposal_fees || []).includes(fee);
                                return (
                                  <button key={fee} type="button"
                                    onClick={() => {
                                      const curr = data.disposal_fees || [];
                                      set("disposal_fees", selected ? curr.filter(f => f !== fee) : [...curr, fee]);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors ${selected ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50"}`}>
                                    <span className={`h-4 w-4 rounded flex-shrink-0 border-2 flex items-center justify-center ${selected ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                                      {selected && <Check className="h-2.5 w-2.5 text-white" />}
                                    </span>
                                    {fee}
                                    {fee === "Dumpster – Up to 10 Yds" && <span className="ml-1 text-xs text-orange-600 font-normal">(Add St. Occ Permit)</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </FlagField>
                        </div>
                      )}
                    </div>
                  );
                }
                return renderField(f);
              })}

              {/* Distance warning for hand sub-types */}
              {(data.sub_type === "excavation_hand" || data.sub_type === "importation_hand") &&
                data.distance_to_parking && Number(data.distance_to_parking) > 50 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Additional time for long distance</span>
                </div>
              )}
              {(data.sub_type === "importation_hand" || data.sub_type === "importation_machine") &&
                data.carry_distance && Number(data.carry_distance) > 50 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span className="font-medium">Additional time for long distance</span>
                </div>
              )}
            </div>
            <FlagField fieldKey="notes" label="Additional Notes" flags={flags} onToggle={toggleFlag}>
              <Textarea rows={3} placeholder="Any other notes..." value={data.notes || ""} onChange={e => set("notes", e.target.value)} />
            </FlagField>
          </>
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <Button onClick={step === STEPS.length - 1 ? handleSave : () => setStep(s => s + 1)} disabled={saving || (step === 0 && !data.sub_type)}>
          {step === STEPS.length - 1 ? <>{saving ? "Saving..." : "Save"} <Check className="h-4 w-4 ml-2" /></> : <>Next <ArrowRight className="h-4 w-4 ml-2" /></>}
        </Button>
      </div>
    </div>
  );
}