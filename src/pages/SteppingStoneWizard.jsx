import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

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

function CalcBox({ label, value, unit, note }) {
  if (!value) return null;
  return (
    <div className="rounded-lg bg-muted/50 border px-3 py-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value} <span className="text-muted-foreground font-normal">{unit}</span></span>
      </div>
      {note && <p className="text-xs text-muted-foreground mt-1">{note}</p>}
    </div>
  );
}

export default function SteppingStoneWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);

  const opId = new URLSearchParams(window.location.search).get("opId");

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      if (opId) {
        const ops = parseOps(a.stepping_stone_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) setForm(existing);
      }
    })();
  }, [areaId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const lf = parseFloat(form.lf) || 0;
  const stoneCount = lf > 0 ? Math.ceil(lf / 2) : null;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.stepping_stone_data);
    const entry = { ...form, sub_type: "Pathway - Stepping Stone", stone_count_calc: stoneCount || form.stone_count_calc };
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? entry : o);
    } else {
      updated = [...ops, { ...entry, id: generateId() }];
    }
    await base44.entities.Area.update(areaId, { stepping_stone_data: JSON.stringify(updated) });
    navigate(`/area/${areaId}`);
  }

  if (!area) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Pathway - Stepping Stones</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
      </div>

      <div className="space-y-6">

        {/* Pathway Info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pathway Dimensions</p>

          <div>
            <Label>Patio or Walkway?</Label>
            <SelectButtons value={form.pathway_type} onChange={v => set("pathway_type", v)} options={["Patio", "Walkway"]} />
          </div>

          <div>
            <Label>Linear Feet (LF)</Label>
            <Input className="mt-1" type="number" value={form.lf || ""} onChange={e => set("lf", e.target.value)} placeholder="0" />
          </div>
        </div>

        {/* Stone */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Stone</p>
          <p className="text-xs text-muted-foreground -mt-2">Standard: 18" × 18" flagstone with 6" spacing — LF ÷ 2 = count</p>

          {stoneCount && (
            <CalcBox
              label="Calculated Stone Count"
              value={stoneCount}
              unit="stones"
              note={`Based on ${lf} LF ÷ 2`}
            />
          )}

          <div>
            <Label>Stone Count</Label>
            <p className="text-xs text-muted-foreground mb-1">Override if different from calculated</p>
            <Input className="mt-1" type="number" value={form.stone_count || ""} onChange={e => set("stone_count", e.target.value)} placeholder={stoneCount ? `${stoneCount} (calculated)` : "0"} />
          </div>

          <div>
            <Label>Stone Type</Label>
            <Input className="mt-1" value={form.stone_type || ""} onChange={e => set("stone_type", e.target.value)} placeholder="e.g. Flagstone, Bluestone, Limestone" />
          </div>
        </div>

        {/* Existing Stones */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Existing Stones</p>

          <div>
            <Label>Existing stones on site?</Label>
            <SelectButtons value={form.existing_stones} onChange={v => set("existing_stones", v)} options={["Yes", "No"]} />
          </div>

          {form.existing_stones === "Yes" && (
            <>
              <div>
                <Label>Releveling needed?</Label>
                <SelectButtons value={form.releveling} onChange={v => set("releveling", v)} options={["Yes", "No"]} />
              </div>
              <div>
                <Label>Additional stones needed?</Label>
                <Input className="mt-1" type="number" value={form.additional_stones || ""} onChange={e => set("additional_stones", e.target.value)} placeholder="0" />
              </div>
            </>
          )}
        </div>

        {/* Base & Machine */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Installation Details</p>

          <div>
            <Label>Existing base</Label>
            <Input className="mt-1" value={form.existing_base || ""} onChange={e => set("existing_base", e.target.value)} placeholder="e.g. Compacted soil, gravel, none" />
          </div>

          <div>
            <Label>Machine needed?</Label>
            <SelectButtons value={form.machine} onChange={v => set("machine", v)} options={["Vermeer", "Dingo", "By hand"]} />
          </div>
        </div>

        {/* Time */}
        <div>
          <Label>Time Estimate (hrs)</Label>
          <Input className="mt-1" type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
        </div>

        {/* Notes */}
        <div>
          <Label>Additional Notes</Label>
          <Textarea className="mt-1" value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes..." rows={3} />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}