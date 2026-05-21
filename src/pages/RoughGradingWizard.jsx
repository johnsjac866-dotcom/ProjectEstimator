import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Check, AlertTriangle } from "lucide-react";
import { RG_SUB_TYPES, RG_FIELDS, calcCY, calcCYFluff } from "@/lib/roughGradingStages";

const STEPS = ["Sub-Type", "Measurements", "Details & Constraints"];

export default function RoughGradingWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [area, setArea] = useState(null);
  const [data, setData] = useState({});
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      if (a.rough_grading_data) {
        try { setData(JSON.parse(a.rough_grading_data)); } catch {}
      }
      setLoading(false);
    })();
  }, [areaId]);

  function set(key, value) { setData(d => ({ ...d, [key]: value })); }

  function setDim(key, value) {
    setData(d => {
      const updated = { ...d, [key]: value };
      const l = key === "sf_length" ? value : (d.sf_length || "");
      const w = key === "sf_width" ? value : (d.sf_width || "");
      if (l && w && !isNaN(l) && !isNaN(w)) {
        updated.sf = String(Math.round(parseFloat(l) * parseFloat(w)));
      }
      return updated;
    });
  }

  const cy = calcCY(data.sf, data.depth_inches);
  const cyFluff = calcCYFluff(cy);
  const fields = RG_FIELDS[data.sub_type] || { step2: [], step3: [] };

  async function handleSave() {
    setSaving(true);
    const saveData = { ...data, cy: cy != null ? String(cy) : "", cy_fluff: cyFluff != null ? String(cyFluff) : "" };
    await base44.entities.Area.update(areaId, { rough_grading_data: JSON.stringify(saveData), status: "Complete" });
    setSaving(false);
    navigate(`/rough-grading-summary/${areaId}`);
  }

  function renderField(field) {
    const show = !field.condition || data[field.condition.key] === field.condition.value;
    if (!show) return null;

    if (field.type === "radio") {
      return (
        <div key={field.key} className="space-y-2">
          <Label>{field.label}</Label>
          {field.note && (
            <div className="flex gap-2 p-2 rounded bg-amber-50 border border-amber-200 text-xs text-amber-800">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />{field.note}
            </div>
          )}
          <RadioGroup value={data[field.key] || ""} onValueChange={v => set(field.key, v)}>
            <div className="flex flex-wrap gap-2">
              {field.options.map(o => (
                <label key={o} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-colors ${data[field.key] === o ? "border-primary bg-primary/5 font-medium" : "border-border hover:bg-muted/50"}`}>
                  <RadioGroupItem value={o} />
                  {o}
                </label>
              ))}
            </div>
          </RadioGroup>
        </div>
      );
    }
    if (field.type === "select") {
      return (
        <div key={field.key}>
          <Label>{field.label}</Label>
          <Select value={data[field.key] || ""} onValueChange={v => set(field.key, v)}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      );
    }
    if (field.type === "number") {
      return (
        <div key={field.key}>
          <Label>{field.label}</Label>
          <Input type="number" className="mt-1" value={data[field.key] || ""} onChange={e => set(field.key, e.target.value)} />
        </div>
      );
    }
    return (
      <div key={field.key}>
        <Label>{field.label}</Label>
        <Input className="mt-1" value={data[field.key] || ""} onChange={e => set(field.key, e.target.value)} />
      </div>
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
          <div className="h-full bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{STEPS[step]}</p>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-6 space-y-5">
        {step === 0 && (
          <>
            <div>
              <h2 className="text-lg font-bold">Select Sub-Type</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose the specific rough grading method.</p>
            </div>
            <RadioGroup value={data.sub_type || ""} onValueChange={v => setData(d => ({ ...d, sub_type: v }))}>
              <div className="space-y-2">
                {RG_SUB_TYPES.map(t => (
                  <label key={t.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${data.sub_type === t.value ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}>
                    <RadioGroupItem value={t.value} />
                    <span className="text-sm font-medium">{t.label}</span>
                  </label>
                ))}
              </div>
            </RadioGroup>
          </>
        )}

        {step === 1 && (
          <>
            <div>
              <h2 className="text-lg font-bold">Measurements</h2>
              <p className="text-sm text-muted-foreground mt-1">Enter dimensions — SF and cubic yards are calculated automatically.</p>
            </div>

            {/* SF from L × W */}
            <div className="space-y-2">
              <Label>Square Footage</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Length (ft)</Label>
                  <Input type="number" className="mt-1" placeholder="0" value={data.sf_length || ""} onChange={e => setDim("sf_length", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Width (ft)</Label>
                  <Input type="number" className="mt-1" placeholder="0" value={data.sf_width || ""} onChange={e => setDim("sf_width", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">SF (auto)</Label>
                  <Input type="number" className="mt-1 bg-muted/50" placeholder="0" value={data.sf || ""} onChange={e => set("sf", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Depth → CY auto-calc */}
            <div className="space-y-2">
              <Label>Depth</Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <Label className="text-xs text-muted-foreground">Depth (inches)</Label>
                  <Input type="number" className="mt-1" placeholder="0" value={data.depth_inches || ""} onChange={e => set("depth_inches", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Cubic Yards</Label>
                  <Input className="mt-1 bg-muted/50" readOnly value={cy != null ? cy : ""} placeholder="—" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">CY + 25% Fluff</Label>
                  <Input className="mt-1 bg-orange-50 border-orange-200 font-semibold" readOnly value={cyFluff != null ? cyFluff : ""} placeholder="—" />
                </div>
              </div>
              {cyFluff && (
                <p className="text-xs text-muted-foreground">
                  CY for hauling/excavation = <strong>{cyFluff} CY</strong> (includes 25% fluff factor)
                </p>
              )}
            </div>

            {/* Sub-type specific step2 fields */}
            {fields.step2.map(renderField)}
          </>
        )}

        {step === 2 && (
          <>
            <div>
              <h2 className="text-lg font-bold">Details &amp; Constraints</h2>
              <p className="text-sm text-muted-foreground mt-1">Answer all required questions for this operation.</p>
            </div>
            {fields.step3.length > 0 ? (
              <div className="space-y-5">{fields.step3.map(renderField)}</div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No additional details required for this sub-type.</p>
            )}
            <div>
              <Label>Additional Notes</Label>
              <Textarea className="mt-1" rows={3} placeholder="Any other notes..." value={data.notes || ""} onChange={e => set("notes", e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <Button
          onClick={step === STEPS.length - 1 ? handleSave : () => setStep(s => s + 1)}
          disabled={saving || (step === 0 && !data.sub_type)}
        >
          {step === STEPS.length - 1 ? <>{saving ? "Saving..." : "Complete & View Summary"} <Check className="h-4 w-4 ml-2" /></> : <>Next <ArrowRight className="h-4 w-4 ml-2" /></>}
        </Button>
      </div>
    </div>
  );
}