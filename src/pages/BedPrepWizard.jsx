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
      setArea(a);
      const ops = parseOps(a.bed_prep_data);
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
            {fields.measurements.length > 0 && <div className="space-y-3"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Measurements Needed</p>{fields.measurements.map(renderField)}</div>}
            {fields.decisions.length > 0 && <div className="space-y-3 mt-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">Decisions Needed</p>{fields.decisions.map(renderField)}</div>}
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