import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseOps } from "@/lib/opsUtils";
import FlagField from "@/components/FlagField";

const EDGE_TYPES = ["Brick", "Metal", "Bullet", "Natural Edge", "Poly", "Snapped Limestone"];

const OBSTRUCTION_NOTE = "Check for tree roots, pipes, or other obstructions within top three inches of soil";

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function getDefaultData(edgeType) {
  switch (edgeType) {
    case "Brick":     return { edge_type: "Brick",     sub_type: "Brick",     brick_width: "4 inch", brick_lf_straight: "", brick_lf_curved: "", brick_color: "", brick_ends_cut: "", brick_prep_hours: "", brick_sand_needed: "", brick_cut_off_saw: "", brick_disposal_hours: "", bed_edger_needed: "" };
    case "Metal":     return { edge_type: "Metal",     sub_type: "Metal",     metal_type: "Aluminum", metal_lf: "", metal_corners: "", metal_splicers: "", metal_cut_off_saw: "", metal_remove_sod_hours: "", bed_edger_needed: "" };
    case "Bullet":    return { edge_type: "Bullet",    sub_type: "Bullet",    bullet_supplier: "Menards", bullet_lf: "", bullet_color: "", bullet_prep_hours: "", bullet_permeable_chips: "", bullet_cut_off_saw: "", bullet_disposal_hours: "", bed_edger_needed: "" };
    case "Natural Edge": return { edge_type: "Natural Edge", sub_type: "Natural Edge", natural_method: "Hand cut", natural_lf: "", bed_edger_needed: "" };
    case "Poly":      return { edge_type: "Poly",      sub_type: "Poly",      poly_lf: "", poly_angular_connectors: "", poly_remove_sod_hours: "", bed_edger_needed: "" };
    case "Snapped Limestone": return { edge_type: "Snapped Limestone", sub_type: "Snapped Limestone", snapped_lf: "", snapped_ends_cut: "", snapped_sand_needed: "", snapped_prep_hours: "", snapped_cut_off_saw: "", bed_edger_needed: "" };
    default: return {};
  }
}

export default function BedEdgingWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [edgeType, setEdgeType] = useState(null);
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
      if (opId) {
        const ops = parseOps(a.bed_edging_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) {
          setEdgeType(existing.edge_type);
          setForm(existing);
          setStep(2);
        }
      }
    })();
  }, [areaId]);

  // Scroll to first flagged field when opening step 2 with flags
  useEffect(() => {
    if (step !== 2 || !(form._flags?.length > 0)) return;
    const timer = setTimeout(() => {
      const allFlagFields = document.querySelectorAll('[data-flagfield]');
      for (const el of allFlagFields) {
        if ((form._flags || []).includes(el.getAttribute('data-flagfield'))) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

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

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.bed_edging_data);
    let updated;
    if (opId) {
      updated = ops.map(o => o.id === opId ? { ...form } : o);
    } else {
      updated = [...ops, { ...form, id: generateId() }];
    }
    await OfflineAreas.update(areaId, { bed_edging_data: JSON.stringify(updated) });
    navigate(`/area/${areaId}`);
  }

  function handleSelectType(type) {
    setEdgeType(type);
    setForm(getDefaultData(type));
    setStep(2);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found. Please go back and try again.</p></div>;

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Bed Edging</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Edge Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {EDGE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => handleSelectType(type)}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all"
              >
                <p className="font-medium text-sm">{type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && edgeType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{edgeType}</span>
          </div>

          <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
            <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
          </FlagField>

          {edgeType === "Brick" && (
            <>
              <div>
                <Label>Width</Label>
                <div className="flex gap-3 mt-1">
                  {["4 inch", "8 inch"].map(w => (
                    <button key={w} onClick={() => set("brick_width", w)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.brick_width === w ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{w} wide</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Linear Feet — Straight</Label><Input type="number" className="mt-1" value={form.brick_lf_straight} onChange={e => set("brick_lf_straight", e.target.value)} placeholder="0" /></div>
                <div><Label>Linear Feet — Curved</Label><Input type="number" className="mt-1" value={form.brick_lf_curved} onChange={e => set("brick_lf_curved", e.target.value)} placeholder="0" /></div>
              </div>
              {(() => {
                const totalLf = (parseFloat(form.brick_lf_straight) || 0) + (parseFloat(form.brick_lf_curved) || 0);
                const bricksNeeded = totalLf > 0 ? Math.ceil((totalLf * 12) / 7.75) : null;
                return bricksNeeded !== null ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                    <span className="font-semibold">Bricks needed:</span> {bricksNeeded} bricks ({totalLf} LF ÷ 7.75" each)
                  </div>
                ) : null;
              })()}
              <div><Label>Color</Label><Input className="mt-1" value={form.brick_color} onChange={e => set("brick_color", e.target.value)} placeholder="e.g. Natural, Red, Charcoal" /></div>
              <div>
                <Label>Ends cut to reduce gaps?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("brick_ends_cut", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.brick_ends_cut === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <FlagField fieldKey="brick_prep_hours" label="Prep area for brick? (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.brick_prep_hours || ""} onChange={e => set("brick_prep_hours", e.target.value)} placeholder="0" />
              </FlagField>
              <div>
                <Label>Coarse / Washed Sand needed?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("brick_sand_needed", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.brick_sand_needed === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Cut Off Saw needed?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("brick_cut_off_saw", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.brick_cut_off_saw === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <FlagField fieldKey="brick_disposal_hours" label="Disposal of debris or extra brick? (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.brick_disposal_hours || ""} onChange={e => set("brick_disposal_hours", e.target.value)} placeholder="0" />
              </FlagField>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">⚠️ {OBSTRUCTION_NOTE}</div>
            </>
          )}

          {edgeType === "Metal" && (
            <>
              <div>
                <Label>Metal Type</Label>
                <div className="flex gap-3 mt-1">
                  {["Aluminum", "Steel"].map(t => (
                    <button key={t} onClick={() => set("metal_type", t)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.metal_type === t ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div><Label>Linear Feet</Label><Input type="number" className="mt-1" value={form.metal_lf} onChange={e => set("metal_lf", e.target.value)} placeholder="0" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Corners</Label><Input type="number" className="mt-1" value={form.metal_corners} onChange={e => set("metal_corners", e.target.value)} placeholder="0" /></div>
                <div><Label>Splicers</Label><Input type="number" className="mt-1" value={form.metal_splicers} onChange={e => set("metal_splicers", e.target.value)} placeholder="0" /></div>
              </div>
              <div>
                <Label>Cut Off Saw needed?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("metal_cut_off_saw", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.metal_cut_off_saw === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <FlagField fieldKey="metal_remove_sod_hours" label="Remove sod behind edge? (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.metal_remove_sod_hours || ""} onChange={e => set("metal_remove_sod_hours", e.target.value)} placeholder="0" />
              </FlagField>
              <div className="space-y-2">
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">⚠️ {OBSTRUCTION_NOTE}</div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-800">⚠️ Cannot do with rolling topography</div>
              </div>
            </>
          )}

          {edgeType === "Bullet" && (
            <>
              <div>
                <Label>Supplier</Label>
                <div className="flex gap-3 mt-1">
                  {["Menards", "Rochester"].map(s => (
                    <button key={s} onClick={() => set("bullet_supplier", s)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.bullet_supplier === s ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div><Label>Linear Feet</Label><Input type="number" className="mt-1" value={form.bullet_lf} onChange={e => set("bullet_lf", e.target.value)} placeholder="0" /></div>
              {(() => {
                const lf = parseFloat(form.bullet_lf) || 0;
                const brickLen = form.bullet_supplier === "Rochester" ? 12.25 : 11.75;
                const bricksNeeded = lf > 0 ? Math.ceil((lf * 12) / brickLen) : null;
                return bricksNeeded !== null ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                    <span className="font-semibold">Bricks needed:</span> {bricksNeeded} bricks ({lf} LF ÷ {brickLen}" each — {form.bullet_supplier || "Menards"})
                  </div>
                ) : null;
              })()}
              <div><Label>Color</Label><Input className="mt-1" value={form.bullet_color} onChange={e => set("bullet_color", e.target.value)} placeholder="e.g. Gray, Tan, Red" /></div>
              <FlagField fieldKey="bullet_prep_hours" label="Prep area for brick? (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.bullet_prep_hours || ""} onChange={e => set("bullet_prep_hours", e.target.value)} placeholder="0" />
              </FlagField>
              <div>
                <Label>Bulk Permeable Chips for leveling needed?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("bullet_permeable_chips", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.bullet_permeable_chips === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Cut Off Saw needed?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("bullet_cut_off_saw", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.bullet_cut_off_saw === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <FlagField fieldKey="bullet_disposal_hours" label="Disposal of debris or extra brick? (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.bullet_disposal_hours || ""} onChange={e => set("bullet_disposal_hours", e.target.value)} placeholder="0" />
              </FlagField>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">⚠️ {OBSTRUCTION_NOTE}</div>
            </>
          )}

          {edgeType === "Natural Edge" && (
            <>
              <div>
                <Label>Method</Label>
                <div className="flex gap-3 mt-1">
                  {["Hand cut", "Bed Edger"].map(m => (
                    <button key={m} onClick={() => set("natural_method", m)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.natural_method === m ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div><Label>Linear Feet</Label><Input type="number" className="mt-1" value={form.natural_lf} onChange={e => set("natural_lf", e.target.value)} placeholder="0" /></div>
            </>
          )}

          {edgeType === "Poly" && (
            <>
              <div><Label>Linear Feet</Label><Input type="number" className="mt-1" value={form.poly_lf} onChange={e => set("poly_lf", e.target.value)} placeholder="0" /></div>
              {(() => {
                const lf = parseFloat(form.poly_lf) || 0;
                const pieces = lf > 0 ? Math.ceil(lf / 20) : null;
                const stakes = pieces !== null ? pieces * 7 : null;
                return pieces !== null ? (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 space-y-1">
                    <div><span className="font-semibold">Pieces needed:</span> {pieces} pieces ({lf} LF ÷ 20 ft each)</div>
                    <div><span className="font-semibold">Stakes needed:</span> {stakes} stakes (7 per piece)</div>
                  </div>
                ) : null;
              })()}
              <div>
                <Label>Angular connectors needed?</Label>
                <Input type="number" className="mt-1" value={form.poly_angular_connectors || ""} onChange={e => set("poly_angular_connectors", e.target.value)} placeholder="0" />
              </div>
              <FlagField fieldKey="poly_remove_sod_hours" label="Remove sod or soil behind edge? (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.poly_remove_sod_hours || ""} onChange={e => set("poly_remove_sod_hours", e.target.value)} placeholder="0" />
              </FlagField>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">⚠️ {OBSTRUCTION_NOTE}</div>
            </>
          )}

          {edgeType === "Snapped Limestone" && (
            <>
              <div><Label>Linear Feet</Label><Input type="number" className="mt-1" value={form.snapped_lf} onChange={e => set("snapped_lf", e.target.value)} placeholder="0" /></div>
              <div>
                <Label>Ends cut to reduce gaps?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("snapped_ends_cut", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.snapped_ends_cut === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Coarse / Washed Sand needed?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("snapped_sand_needed", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.snapped_sand_needed === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <FlagField fieldKey="snapped_prep_hours" label="Prep area for stone? (hrs)" flags={form._flags || []} onToggle={toggleFlag}>
                <Input type="number" value={form.snapped_prep_hours || ""} onChange={e => set("snapped_prep_hours", e.target.value)} placeholder="0" />
              </FlagField>
              <div>
                <Label>Cut Off Saw needed?</Label>
                <div className="flex gap-3 mt-1">
                  {["Yes", "No"].map(v => (
                    <button key={v} onClick={() => set("snapped_cut_off_saw", v)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.snapped_cut_off_saw === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">⚠️ {OBSTRUCTION_NOTE}</div>
            </>
          )}

          <div>
            <Label>Bed Edger needed?</Label>
            <div className="flex gap-3 mt-1">
              {["Yes", "No"].map(v => (
                <button key={v} type="button" onClick={() => set("bed_edger_needed", v)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.bed_edger_needed === v ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"}`}>{v}</button>
              ))}
            </div>
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