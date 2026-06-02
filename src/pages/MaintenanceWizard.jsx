import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const MAINTENANCE_TYPES = ["Weeding"];

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

export default function MaintenanceWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [maintenanceType, setMaintenanceType] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);

  const opId = new URLSearchParams(window.location.search).get("opId");

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      if (opId) {
        const ops = parseOps(a.maintenance_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) { setMaintenanceType(existing.maintenance_type); setForm(existing); setStep(2); }
      }
    })();
  }, [areaId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const length = parseFloat(form.length) || 0;
  const width = parseFloat(form.width) || 0;
  const sf = length > 0 && width > 0 ? (length * width).toFixed(1) : null;

  function handleDimChange(key, value) {
    setForm(f => {
      const updated = { ...f, [key]: value };
      const l = parseFloat(key === "length" ? value : f.length) || 0;
      const w = parseFloat(key === "width" ? value : f.width) || 0;
      const newSF = l > 0 && w > 0 ? (l * w).toFixed(1) : f.sf;
      // Auto-fill herbicide_sf if it hasn't been manually changed
      if (!f.herbicide_sf_overridden) {
        updated.herbicide_sf = newSF || "";
      }
      updated.sf = newSF || f.sf;
      return updated;
    });
  }

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.maintenance_data);
    const entry = { ...form, maintenance_type: maintenanceType, sub_type: maintenanceType, sf };
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? entry : o);
    } else {
      updated = [...ops, { ...entry, id: generateId() }];
    }
    await base44.entities.Area.update(areaId, { maintenance_data: JSON.stringify(updated) });
    navigate(`/area/${areaId}`);
  }

  if (!area) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-emerald-600" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Maintenance Type</h2>
          <div className="grid grid-cols-1 gap-3">
            {MAINTENANCE_TYPES.map(type => (
              <button key={type} type="button"
                onClick={() => { setMaintenanceType(type); setForm({ maintenance_type: type, sub_type: type }); setStep(2); }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all">
                <p className="font-medium text-sm">{type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && maintenanceType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{maintenanceType}</span>
          </div>

          {/* Dimensions */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dimensions</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Length (ft)</Label>
                <Input className="mt-1" type="number" value={form.length || ""} onChange={e => handleDimChange("length", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Width (ft)</Label>
                <Input className="mt-1" type="number" value={form.width || ""} onChange={e => handleDimChange("width", e.target.value)} placeholder="0" />
              </div>
            </div>
            {sf && <CalcBox label="Square Footage" value={sf} unit="SF" />}
          </div>

          {/* Time */}
          <div>
            <Label>Time (hrs)</Label>
            <Input className="mt-1" type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
          </div>

          {/* Herbicide */}
          <div>
            <Label>Herbicide Treatment?</Label>
            <SelectButtons value={form.herbicide} onChange={v => {
              setForm(f => ({
                ...f,
                herbicide: v,
                herbicide_sf: v === "Yes" ? (f.sf || sf || "") : "",
              }));
            }} options={["Yes", "No"]} />
          </div>

          {form.herbicide === "Yes" && (
            <div>
              <Label>Herbicide SF</Label>
              <p className="text-xs text-muted-foreground mb-1">Pre-filled from area SF — edit if different</p>
              <Input
                className="mt-1"
                type="number"
                value={form.herbicide_sf || ""}
                onChange={e => set("herbicide_sf", e.target.value)}
                placeholder="0"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Additional Notes</Label>
            <Textarea className="mt-1" value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes..." rows={3} />
          </div>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}