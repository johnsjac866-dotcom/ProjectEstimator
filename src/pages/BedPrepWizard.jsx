import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { BED_MAIN_TYPES, BED_FIELDS, getSubTypes } from "@/lib/bedPrepStages";
import { useRef } from "react";
import { parseOps } from "@/lib/opsUtils";
import FlagField from "@/components/FlagField";

const STEPS = ["Main Type", "Sub-Type", "Measurements & Decisions", "Constraints & Risk Factors"];

export default function BedPrepWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const opId = new URLSearchParams(window.location.search).get('opId');
  const [area, setArea] = useState(null);
  const [data, setData] = useState({});
  const [operations, setOperations] = useState([]);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      if (!a) { setLoading(false); return; }
      setArea(a);
      const ops = parseOps(a.bed_prep_data);
      setOperations(ops);
      if (opId) {
        const existing = ops.find(o => o.id === opId);
        if (existing) {
          setData(existing);
          // Jump to the step containing the first flagged field
          const flags = existing._flags || [];
          if (flags.length > 0) {
            const constraintKeys = (BED_FIELDS[existing.sub_type]?.constraints || []).map(f => f.key);
            if (flags.includes('main_type')) setStep(0);
            else if (flags.includes('sub_type')) setStep(1);
            else if (flags.some(f => constraintKeys.includes(f))) setStep(3);
            else setStep(2);
          } else {
            setStep(2);
          }
        }
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

  function setDimension(key, value) {
    setData(d => {
      const updated = { ...d, [key]: value };
      const l = key === "sf_length" ? value : (d.sf_length || "");
      const w = key === "sf_width" ? value : (d.sf_width || "");
      if (l && w && !isNaN(l) && !isNaN(w)) updated.sf = String(Math.round(parseFloat(l) * parseFloat(w)));
      return updated;
    });
  }

  const subTypes = getSubTypes(data.main_type);
  const fields = BED_FIELDS[data.sub_type] || { measurements: [], decisions: [], constraints: [] };

  async function handleSave() {
    setSaving(true);
    const entryId = opId || String(Date.now());
    const newEntry = { ...data, id: entryId };
    const updatedOps = [...operations];
    const idx = updatedOps.findIndex(o => o.id === entryId);
    if (idx >= 0) updatedOps[idx] = newEntry; else updatedOps.push(newEntry);
    await OfflineAreas.update(areaId, { bed_prep_data: JSON.stringify(updatedOps) });
    setSaving(false);
    navigate(`/area/${areaId}`);
  }

  const flags = data._flags || [];

  // Scroll to first flagged field whenever step changes
  useEffect(() => {
    if (flags.length === 0) return;
    const timer = setTimeout(() => {
      const firstFlagged = document.querySelector('[data-flagfield]');
      // Find the first one that is actually flagged
      const allFlagFields = document.querySelectorAll('[data-flagfield]');
      for (const el of allFlagFields) {
        if (flags.includes(el.getAttribute('data-flagfield'))) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  function renderField(field) {
    if (field.type === "checkbox") return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data[field.key] ? "border-amber-400 bg-amber-50/50" : "border-border hover:bg-muted/30"}`}>
          <Checkbox checked={!!data[field.key]} onCheckedChange={v => set(field.key, v)} />
          <span className="text-sm">{field.label}</span>
        </label>
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
    if (field.type === "textarea") return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <Textarea rows={3} value={data[field.key] || ""} onChange={e => set(field.key, e.target.value)} />
      </FlagField>
    );
    if (field.type === "number" && field.key === "sf") return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <div className="grid grid-cols-3 gap-2 items-end">
          <div><Label className="text-xs text-muted-foreground">Length (ft)</Label><Input type="number" className="mt-1" placeholder="0" value={data.sf_length || ""} onChange={e => setDimension("sf_length", e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">Width (ft)</Label><Input type="number" className="mt-1" placeholder="0" value={data.sf_width || ""} onChange={e => setDimension("sf_width", e.target.value)} /></div>
          <div><Label className="text-xs text-muted-foreground">SF (auto)</Label><Input type="number" className="mt-1 bg-muted/50" placeholder="0" value={data.sf || ""} onChange={e => set("sf", e.target.value)} /></div>
        </div>
      </FlagField>
    );
    if (field.type === "number") return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <Input type="number" value={data[field.key] || ""} onChange={e => set(field.key, e.target.value)} />
      </FlagField>
    );
    return (
      <FlagField key={field.key} fieldKey={field.key} label={field.label} flags={flags} onToggle={toggleFlag}>
        <Input value={data[field.key] || (field.defaultValue || "")} onChange={e => set(field.key, e.target.value)} />
      </FlagField>
    );
  }

  // ── helpers ──────────────────────────────────────────────────────────────
  function ToggleButtons({ options, value, onChange }) {
    return (
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map(o => (
          <button key={o} type="button"
            onClick={() => onChange(o)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${value === o ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>
            {o}
          </button>
        ))}
      </div>
    );
  }

  function calcCY(sfVal, depthInches) {
    const sf = parseFloat(sfVal) || 0;
    if (sf <= 0 || depthInches <= 0) return null;
    return (sf * (depthInches / 12) / 27).toFixed(2);
  }

  // Hand vs Machine block shared by till and reprofiling
  function HandMachineBlock({ prefix }) {
    const mode = data[`${prefix}_tilling_mode`];
    return (
      <div className="space-y-3">
        <div>
          <Label>Hand vs Machine</Label>
          <ToggleButtons options={["Hand", "Machine"]} value={mode}
            onChange={v => set(`${prefix}_tilling_mode`, v)} />
        </div>
        {mode === "Hand" && (
          <div>
            <Label>Hand tiller type</Label>
            <ToggleButtons
              options={["16\" Hand Tiller", "FG 110 Hand Tiller"]}
              value={data[`${prefix}_hand_tiller_type`]}
              onChange={v => set(`${prefix}_hand_tiller_type`, v)} />
            <FlagField fieldKey={`${prefix}_hand_tiller_hours`} label="Unit hours" flags={flags} onToggle={toggleFlag}>
              <Input type="number" className="mt-1" value={data[`${prefix}_hand_tiller_hours`] || ""} onChange={e => set(`${prefix}_hand_tiller_hours`, e.target.value)} placeholder="0" />
            </FlagField>
          </div>
        )}
        {mode === "Machine" && (
          <div className="space-y-3">
            <div>
              <Label>Machine type</Label>
              <ToggleButtons options={["Dingo", "Vermeer"]} value={data[`${prefix}_machine_type`]}
                onChange={v => set(`${prefix}_machine_type`, v)} />
            </div>
            <div>
              <Label>Hydraulic tiller attachment?</Label>
              <ToggleButtons options={["Yes", "No"]} value={data[`${prefix}_hydraulic_tiller`]}
                onChange={v => set(`${prefix}_hydraulic_tiller`, v)} />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Amendment (Topsoil or Compost) CY calc block
  function AmendmentBlock({ prefix, depthInches }) {
    const sf = parseFloat(data.sf) || 0;
    const amendType = data[`${prefix}_amendment_type`];
    const cy = depthInches ? calcCY(data.sf, depthInches) : calcCY(data.sf, parseFloat(data[`${prefix}_amendment_depth_in`]) || 0);
    return (
      <div className="space-y-3">
        <div>
          <Label>Amendment type</Label>
          <ToggleButtons options={["Topsoil", "Compost"]} value={amendType}
            onChange={v => set(`${prefix}_amendment_type`, v)} />
        </div>
        {!depthInches && (
          <FlagField fieldKey={`${prefix}_amendment_depth_in`} label="Amendment depth (inches)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data[`${prefix}_amendment_depth_in`] || ""} onChange={e => set(`${prefix}_amendment_depth_in`, e.target.value)} placeholder="e.g. 1 or 3" />
          </FlagField>
        )}
        {cy && sf > 0 && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            <span className="font-semibold">Cubic yards needed:</span> {cy} CY ({sf} SF × {depthInches || data[`${prefix}_amendment_depth_in`]}" ÷ 12 ÷ 27)
          </div>
        )}
      </div>
    );
  }

  function renderCustomDecisions() {
    const sub = data.sub_type;
    const sf = parseFloat(data.sf) || 0;

    // ── Till 1" and Till 3" ───────────────────────────────────────────────
    if (sub === "till_1in" || sub === "till_3in") {
      const depthIn = sub === "till_1in" ? 1 : 3;
      const chickLbs = sf > 0 ? Math.ceil(sf / 1000 * 25) : null;
      const cy = calcCY(data.sf, depthIn);
      return (
        <div className="space-y-4 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Decisions</p>
          <HandMachineBlock prefix="till" />
          <FlagField fieldKey="remove_rock_hours" label="Remove rock, debris, and roots? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.remove_rock_hours || ""} onChange={e => set("remove_rock_hours", e.target.value)} placeholder="0" />
          </FlagField>
          <FlagField fieldKey="fertilizer_hours" label="Fertilizer? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.fertilizer_hours || ""} onChange={e => set("fertilizer_hours", e.target.value)} placeholder="0" />
          </FlagField>
          <div>
            <Label>Chicken Crumbles?</Label>
            <ToggleButtons options={["Yes", "No"]} value={data.chicken_crumbles}
              onChange={v => set("chicken_crumbles", v)} />
            {data.chicken_crumbles === "Yes" && chickLbs && (
              <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                <span className="font-semibold">Lbs needed:</span> {chickLbs} lbs ({sf} SF ÷ 1000 × 25 lbs)
              </div>
            )}
          </div>
          <div>
            <Label>Amendments</Label>
            <AmendmentBlock prefix="amend" depthInches={depthIn} />
            {cy && sf > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">Amendment depth: {depthIn}"</div>
            )}
          </div>
          <FlagField fieldKey="finish_bed_hours" label="Finish bed by hand? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.finish_bed_hours || ""} onChange={e => set("finish_bed_hours", e.target.value)} placeholder="0" />
          </FlagField>
        </div>
      );
    }

    // ── Lawn - No Amendments ──────────────────────────────────────────────
    if (sub === "lawn_none") {
      return (
        <div className="space-y-4 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Decisions</p>
          <HandMachineBlock prefix="lawn" />
          <FlagField fieldKey="fertilizer_hours" label="Fertilizer? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.fertilizer_hours || ""} onChange={e => set("fertilizer_hours", e.target.value)} placeholder="0" />
          </FlagField>
          <FlagField fieldKey="finish_bed_hours" label="Finish bed by hand? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.finish_bed_hours || ""} onChange={e => set("finish_bed_hours", e.target.value)} placeholder="0" />
          </FlagField>
        </div>
      );
    }

    // ── Lawn - With Amendments ────────────────────────────────────────────
    if (sub === "lawn_1in") {
      return (
        <div className="space-y-4 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Decisions</p>
          <HandMachineBlock prefix="lawn" />
          <FlagField fieldKey="fertilizer_hours" label="Fertilizer? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.fertilizer_hours || ""} onChange={e => set("fertilizer_hours", e.target.value)} placeholder="0" />
          </FlagField>
          <FlagField fieldKey="finish_bed_hours" label="Finish bed by hand? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.finish_bed_hours || ""} onChange={e => set("finish_bed_hours", e.target.value)} placeholder="0" />
          </FlagField>
          <div>
            <Label>Amendments</Label>
            <AmendmentBlock prefix="amend" />
          </div>
        </div>
      );
    }

    // ── No Till - By Hand ─────────────────────────────────────────────────
    if (sub === "notill_hand") {
      const cy = calcCY(data.sf, 1);
      return (
        <div className="space-y-4 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Decisions</p>
          {cy && sf > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <span className="font-semibold">Compost needed:</span> {cy} CY ({sf} SF × 1" ÷ 12 ÷ 27)
            </div>
          )}
          <FlagField fieldKey="slope_distance_hours" label="Additional time for slopes, distance, challenges? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.slope_distance_hours || ""} onChange={e => set("slope_distance_hours", e.target.value)} placeholder="0" />
          </FlagField>
        </div>
      );
    }

    // ── No Till - By Machine ──────────────────────────────────────────────
    if (sub === "notill_machine") {
      const cy = calcCY(data.sf, 1);
      const loads = cy ? Math.ceil(parseFloat(cy) / 18) : null;
      return (
        <div className="space-y-4 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Decisions</p>
          {cy && sf > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <div><span className="font-semibold">Compost needed:</span> {cy} CY ({sf} SF × 1" ÷ 12 ÷ 27)</div>
              <div><span className="font-semibold">Loads:</span> {loads} load{loads !== 1 ? "s" : ""} ({cy} CY ÷ 18 CY/load)</div>
            </div>
          )}
          <div>
            <Label>Machine type</Label>
            <ToggleButtons options={["Vermeer", "Dingo"]} value={data.notill_machine_type}
              onChange={v => set("notill_machine_type", v)} />
          </div>
        </div>
      );
    }

    // ── Reprofiling types ─────────────────────────────────────────────────
    if (sub && sub.startsWith("repro_")) {
      const sf = parseFloat(data.sf) || 0;
      const chickLbs = sf > 0 && data.repro_amendments === "Yes" ? Math.ceil(sf / 1000 * 25) : null;
      return (
        <div className="space-y-4 mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Decisions</p>
          <div>
            <Label>Tilling needed?</Label>
            <ToggleButtons options={["Yes", "No"]} value={data.repro_tilling}
              onChange={v => set("repro_tilling", v)} />
          </div>
          {data.repro_tilling === "Yes" && <HandMachineBlock prefix="repro_till" />}
          <FlagField fieldKey="remove_rock_hours" label="Remove rock, debris, and roots? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.remove_rock_hours || ""} onChange={e => set("remove_rock_hours", e.target.value)} placeholder="0" />
          </FlagField>
          <div>
            <Label>Amendments needed?</Label>
            <ToggleButtons options={["Yes", "No"]} value={data.repro_amendments}
              onChange={v => set("repro_amendments", v)} />
          </div>
          {data.repro_amendments === "Yes" && (
            <div className="space-y-3 pl-3 border-l-2 border-primary/30">
              <AmendmentBlock prefix="repro_amend" />
              <div>
                <Label>Chicken Crumbles?</Label>
                <ToggleButtons options={["Yes", "No"]} value={data.repro_chicken_crumbles}
                  onChange={v => set("repro_chicken_crumbles", v)} />
                {data.repro_chicken_crumbles === "Yes" && chickLbs && (
                  <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                    <span className="font-semibold">Lbs needed:</span> {chickLbs} lbs ({sf} SF ÷ 1000 × 25 lbs)
                  </div>
                )}
              </div>
            </div>
          )}
          <FlagField fieldKey="fertilizer_hours" label="Fertilizer? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.fertilizer_hours || ""} onChange={e => set("fertilizer_hours", e.target.value)} placeholder="0" />
          </FlagField>
          <FlagField fieldKey="finish_bed_hours" label="Finish bed by hand? (hrs)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={data.finish_bed_hours || ""} onChange={e => set("finish_bed_hours", e.target.value)} placeholder="0" />
          </FlagField>
        </div>
      );
    }

    return null;
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2">Step {step + 1} of {STEPS.length} — {area?.name}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-green-600 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{STEPS[step]}</p>
      </div>
      <div className="bg-card border rounded-xl p-6 mb-6 space-y-5">
        {step === 0 && (
          <>
            <div><h2 className="text-lg font-bold">Select Bed Preparation Type</h2><p className="text-sm text-muted-foreground mt-1">Choose the main category for this bed preparation.</p></div>
            <RadioGroup value={data.main_type || ""} onValueChange={v => setData(d => ({ ...d, main_type: v, sub_type: undefined }))}>
              <div className="space-y-2">
                {BED_MAIN_TYPES.map(t => (
                  <label key={t.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data.main_type === t.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                    <RadioGroupItem value={t.value} /><span className="text-sm font-medium">{t.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </>
        )}
        {step === 1 && (
          <>
            <div><h2 className="text-lg font-bold">Select Sub-Type</h2><p className="text-sm text-muted-foreground mt-1">Choose the specific bed preparation method.</p></div>
            <RadioGroup value={data.sub_type || ""} onValueChange={v => set("sub_type", v)}>
              <div className="space-y-2">
                {subTypes.map(t => (
                  <label key={t.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data.sub_type === t.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                    <RadioGroupItem value={t.value} /><span className="text-sm font-medium">{t.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </>
        )}
        {step === 2 && (
          <>
            <div><h2 className="text-lg font-bold">Measurements &amp; Decisions</h2></div>
            {fields.measurements.length > 0 && <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Measurements</p>{fields.measurements.map(renderField)}</div>}
            {renderCustomDecisions()}
            {fields.decisions.length > 0 && <div className="space-y-3 mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Decisions</p>{fields.decisions.map(renderField)}</div>}
          </>
        )}
        {step === 3 && (
          <>
            <div><h2 className="text-lg font-bold">Constraints &amp; Risk Factors</h2></div>
            <div className="space-y-3">{fields.constraints.map(renderField)}</div>
          </>
        )}
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <Button onClick={step === STEPS.length - 1 ? handleSave : () => setStep(s => s + 1)} disabled={saving || (step === 0 && !data.main_type) || (step === 1 && !data.sub_type)}>
          {step === STEPS.length - 1 ? <>{saving ? "Saving..." : "Save"} <Check className="h-4 w-4 ml-2" /></> : <>Next <ArrowRight className="h-4 w-4 ml-2" /></>}
        </Button>
      </div>
    </div>
  );
}