import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseOps } from "@/lib/opsUtils";
import FlagField from "@/components/FlagField";

const MULCH_TYPES = ["Organic", "Stone"];
const TON_PER_CY = { Organic: 0.25, Stone: 1.3 };

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

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

function CalcDisplay({ label, value, unit }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 border px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value} <span className="text-muted-foreground font-normal">{unit}</span></span>
    </div>
  );
}

export default function MulchWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [mulchType, setMulchType] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const opId = urlParams.get("opId");

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      if (!a) { setArea(null); return; }
      setArea(a);
      const aiPrefill = urlParams.get("aiPrefill");
      if (aiPrefill) {
        const prefill = JSON.parse(sessionStorage.getItem('ai_prefill') || 'null');
        if (prefill) {
          sessionStorage.removeItem('ai_prefill');
          const type = prefill.mulch_type || prefill.sub_type || null;
          setMulchType(type);
          setForm(prefill);
          setStep(type ? 2 : 1);
          return;
        }
      }
      if (opId) {
        const ops = parseOps(a.mulch_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) {
          const type = existing.mulch_type || existing.sub_type || null;
          setMulchType(type);
          setForm(existing);
          setStep(type ? 2 : 1);
        }
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

  // Derived calculations
  const length = parseFloat(form.length) || 0;
  const width = parseFloat(form.width) || 0;
  const depth = parseFloat(form.depth) || 0;
  const sf = length > 0 && width > 0 ? (length * width).toFixed(1) : null;
  const cy = sf && depth > 0 ? ((length * width * (depth / 12)) / 27).toFixed(2) : null;
  const tons = cy && mulchType ? (parseFloat(cy) * TON_PER_CY[mulchType]).toFixed(2) : null;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.mulch_data);
    const entry = { ...form, mulch_type: mulchType, sub_type: mulchType, sf, cy, tons };
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? entry : o);
    } else {
      updated = [...ops, { ...entry, id: generateId() }];
    }
    await OfflineAreas.update(areaId, { mulch_data: JSON.stringify(updated) });
    navigate(`/area/${areaId}`);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found. Please go back and try again.</p></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Mulch</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Mulch Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {MULCH_TYPES.map(type => (
              <button key={type} type="button"
                onClick={() => { setMulchType(type); setForm({ mulch_type: type, sub_type: type }); setStep(2); }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all">
                <p className="font-medium text-sm">{type}</p>
                <p className="text-xs text-muted-foreground mt-1">{type === "Organic" ? "0.25 ton/CY" : "1.3 ton/CY"}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && mulchType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{mulchType} Mulch</span>
          </div>

          {/* Dimensions */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Dimensions</p>
            <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
              <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
            </FlagField>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Length (ft)</Label>
                <Input className="mt-1" type="number" value={form.length || ""} onChange={e => set("length", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Width (ft)</Label>
                <Input className="mt-1" type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" />
              </div>
              <div>
                <Label>Depth (in)</Label>
                <Input className="mt-1" type="number" value={form.depth || ""} onChange={e => set("depth", e.target.value)} placeholder="0" />
              </div>
            </div>

            {/* Auto-calculated results */}
            <div className="space-y-2">
              <CalcDisplay label="Square Footage" value={sf} unit="SF" />
              <CalcDisplay label="Cubic Yards" value={cy} unit="CY" />
              <CalcDisplay label="Estimated Weight" value={tons} unit="tons" />
            </div>
          </div>

          {/* Bed Type */}
          <div>
            <Label>Bed Type</Label>
            <Input className="mt-1" value={form.bed_type || ""} onChange={e => set("bed_type", e.target.value)} placeholder="e.g. Garden bed, Tree ring, Slope" />
          </div>

          {/* Organic only: Refresh vs Full Install */}
          {mulchType === "Organic" && (
            <div>
              <Label>Refresh vs Full Install</Label>
              <SelectButtons value={form.install_type} onChange={v => set("install_type", v)} options={["Refresh", "Full Install"]} />
            </div>
          )}

          {/* Machine Access */}
          <div>
            <Label>Machine Access</Label>
            <SelectButtons value={form.machine_access} onChange={v => set("machine_access", v)} options={["Vermeer", "Dingo", "None"]} />
          </div>

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