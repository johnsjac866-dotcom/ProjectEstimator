import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check, SkipForward } from "lucide-react";
import { HARDSCAPE_REPAIR_STAGES, getVisibleFields } from "@/lib/hardscapeRepairStages";
import { parseOps } from "@/lib/opsUtils";

export default function HardscapeRepairWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const opId = new URLSearchParams(window.location.search).get("opId");
  const [area, setArea] = useState(null);
  const [data, setData] = useState({});
  const [operations, setOperations] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      setArea(a);
      const ops = parseOps(a.hardscape_repair_data);
      setOperations(ops);
      if (opId) {
        const existing = ops.find(o => o.id === opId);
        if (existing) setData(existing);
      }
      setLoading(false);
    })();
  }, [areaId]);

  const stage = HARDSCAPE_REPAIR_STAGES[currentStep];
  const isLast = currentStep === HARDSCAPE_REPAIR_STAGES.length - 1;

  function handleChange(key, value) {
    let updated = { ...data, [key]: value };
    // Auto-calculate SF from length × width
    if (key === "length" || key === "width") {
      const l = parseFloat(key === "length" ? value : data.length) || 0;
      const w = parseFloat(key === "width" ? value : data.width) || 0;
      if (l && w) updated.sf = String((l * w).toFixed(1));
    }
    setData(updated);
  }

  async function handleSave() {
    setSaving(true);
    const entryId = opId || String(Date.now());
    const newEntry = { ...data, id: entryId, sub_type: data.repair_type || "Patio or Walkway" };
    const updatedOps = [...operations];
    const idx = updatedOps.findIndex(o => o.id === entryId);
    if (idx >= 0) updatedOps[idx] = newEntry; else updatedOps.push(newEntry);
    await OfflineAreas.update(areaId, { hardscape_repair_data: JSON.stringify(updatedOps) });
    setSaving(false);
    navigate(`/area/${areaId}`);
  }

  function handleNext() {
    if (isLast) handleSave();
    else setCurrentStep(s => Math.min(s + 1, HARDSCAPE_REPAIR_STAGES.length - 1));
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const visibleFields = getVisibleFields(stage, data);

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>
      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2">Step {currentStep + 1} of {HARDSCAPE_REPAIR_STAGES.length} — {area?.name}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / HARDSCAPE_REPAIR_STAGES.length) * 100}%` }} />
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-6">
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-bold">{stage.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{stage.description}</p>
          </div>
          <div className="space-y-4">
            {visibleFields.map(field => {
              if (field.type === "select") return (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  <Select value={data[field.key] || ""} onValueChange={v => handleChange(field.key, v)}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {field.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              );
              if (field.type === "number") return (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  {field.hint && <p className="text-xs text-muted-foreground">{field.hint}</p>}
                  <Input type="number" className="mt-1" value={data[field.key] || ""} onChange={e => handleChange(field.key, e.target.value)} />
                </div>
              );
              if (field.type === "textarea") return (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  <Textarea className="mt-1" rows={3} value={data[field.key] || ""} onChange={e => handleChange(field.key, e.target.value)} />
                </div>
              );
              return (
                <div key={field.key}>
                  <Label>{field.label}</Label>
                  <Input className="mt-1" value={data[field.key] || ""} onChange={e => handleChange(field.key, e.target.value)} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <div className="flex gap-2">
          {!isLast && <Button variant="ghost" onClick={handleNext}>Skip <SkipForward className="h-4 w-4 ml-1" /></Button>}
          <Button onClick={handleNext} disabled={saving}>
            {isLast ? <>{saving ? "Saving..." : "Save"} <Check className="h-4 w-4 ml-2" /></> : <>Next <ArrowRight className="h-4 w-4 ml-2" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}