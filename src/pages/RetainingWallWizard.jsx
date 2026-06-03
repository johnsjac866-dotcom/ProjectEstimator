import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const WALL_TYPES = [
  { key: "Outcrop", label: "3a) Outcrop" },
  { key: "Snapped", label: "3b) Snapped" },
  { key: "Stone", label: "3c) Stone" },
  { key: "Timber", label: "3d) Timber" },
  { key: "Boulder", label: "3e) Boulder" },
  { key: "CMU", label: "3f) CMU" },
  { key: "Boulder Slope Retention", label: "Boulder Slope Retention" },
];

function SelectBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "bg-background border-input hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

function CalcBox({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

const defaultOp = () => ({
  id: crypto.randomUUID(),
  // Step 1 - Excavation
  exc_lf: "", exc_trench_depth: "", exc_trench_width: "", exc_wall_height: "",
  exc_disposal: false, exc_distance_to_truck: "", exc_spoil_type: "",
  exc_machine_access: "",
  // Step 2 - Base Install
  base_lf: "", base_width: "", base_depth: "", base_fabric_sf: "",
  base_distance_to_truck: "", base_road_gravel_type: "", base_compactor: "",
  // Step 3 - Wall Type
  wall_type: "",
  // Common wall fields
  wall_lf: "", wall_exposed_height: "", wall_corner_count: "",
  wall_fabric_sf: "", wall_distance_to_truck: "",
  wall_geogrid: false, wall_machine_access: "",
  // Boulder-specific
  boulder_type: "", boulder_size: "", boulder_count: "",
  notes: "",
});

export default function RetainingWallWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [op, setOp] = useState(defaultOp());
  const [area, setArea] = useState(null);
  const [saving, setSaving] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const opId = urlParams.get("opId");

  useEffect(() => {
    base44.entities.Area.get(areaId).then(a => {
      setArea(a);
      if (opId) {
        const existing = parseOps(a.retaining_wall_data).find(e => e.id === opId);
        if (existing) setOp(existing);
      }
    });
  }, [areaId]);

  function set(field, value) {
    setOp(prev => ({ ...prev, [field]: value }));
  }

  // Calculations
  const excCY = op.exc_lf && op.exc_trench_depth && op.exc_trench_width
    ? ((parseFloat(op.exc_lf) * parseFloat(op.exc_trench_depth) * parseFloat(op.exc_trench_width)) / 27).toFixed(2)
    : null;

  const baseSF = op.base_lf && op.base_width
    ? (parseFloat(op.base_lf) * parseFloat(op.base_width)).toFixed(1)
    : null;
  const baseCY = op.base_lf && op.base_width && op.base_depth
    ? ((parseFloat(op.base_lf) * parseFloat(op.base_width) * parseFloat(op.base_depth)) / 27).toFixed(2)
    : null;

  async function handleSave() {
    setSaving(true);
    const existing = parseOps(area.retaining_wall_data);
    const updated = opId
      ? existing.map(e => e.id === opId ? op : e)
      : [...existing, op];
    await base44.entities.Area.update(areaId, { retaining_wall_data: JSON.stringify(updated) });
    navigate(`/retaining-wall-summary/${areaId}?opId=${op.id}`);
  }

  const isBoulder = op.wall_type === "Boulder";

  return (
    <div className="max-w-lg mx-auto">
      <button onClick={() => navigate(`/area/${areaId}`)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </button>

      <h1 className="text-2xl font-bold mb-1">Retaining Wall</h1>
      <p className="text-muted-foreground text-sm mb-6">{opId ? "Edit entry" : "New entry"}</p>

      {/* Step indicators */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`flex-1 h-1.5 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* ---- STEP 1: Excavation ---- */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-base">1) Excavation — Digging Trench Only</h2>
          <p className="text-xs text-muted-foreground italic">NOT add'l grading to accommodate wall or backfill</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>LF</Label>
              <Input type="number" value={op.exc_lf} onChange={e => set("exc_lf", e.target.value)} placeholder="Linear feet" />
            </div>
            <div className="space-y-1">
              <Label>Wall Height (ft)</Label>
              <Input type="number" value={op.exc_wall_height} onChange={e => set("exc_wall_height", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Trench Depth (ft)</Label>
              <Input type="number" value={op.exc_trench_depth} onChange={e => set("exc_trench_depth", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Trench Width (ft)</Label>
              <Input type="number" value={op.exc_trench_width} onChange={e => set("exc_trench_width", e.target.value)} placeholder="0" />
            </div>
          </div>

          {excCY && <CalcBox label="Cubic Yards" value={`${excCY} CY`} />}

          <div className="space-y-2">
            <Label>Disposal Needed?</Label>
            <div className="flex gap-2">
              <SelectBtn active={op.exc_disposal === true} onClick={() => set("exc_disposal", true)}>Yes</SelectBtn>
              <SelectBtn active={op.exc_disposal === false} onClick={() => set("exc_disposal", false)}>No</SelectBtn>
            </div>
          </div>

          {op.exc_disposal && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Distance to Truck</Label>
                <Input value={op.exc_distance_to_truck} onChange={e => set("exc_distance_to_truck", e.target.value)} placeholder="e.g. 50 ft" />
              </div>
              <div className="space-y-1">
                <Label>Spoil Type</Label>
                <Input value={op.exc_spoil_type} onChange={e => set("exc_spoil_type", e.target.value)} placeholder="e.g. Clay, topsoil" />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Machine Access</Label>
            <div className="flex flex-wrap gap-2">
              {["Vermeer", "Dingo", "By Hand"].map(m => (
                <SelectBtn key={m} active={op.exc_machine_access === m} onClick={() => set("exc_machine_access", m)}>{m}</SelectBtn>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={() => setStep(2)}>
            Next: Base Install <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      {/* ---- STEP 2: Base Install ---- */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-base">2) Base Install — Road Gravel</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>LF</Label>
              <Input type="number" value={op.base_lf} onChange={e => {
                set("base_lf", e.target.value);
                // auto-populate fabric SF when base_lf and base_width are set
                const sf = e.target.value && op.base_width ? (parseFloat(e.target.value) * parseFloat(op.base_width)).toFixed(1) : op.base_fabric_sf;
                set("base_fabric_sf", sf);
              }} placeholder="Linear feet" />
            </div>
            <div className="space-y-1">
              <Label>Base Width (ft)</Label>
              <Input type="number" value={op.base_width} onChange={e => {
                set("base_width", e.target.value);
                const sf = op.base_lf && e.target.value ? (parseFloat(op.base_lf) * parseFloat(e.target.value)).toFixed(1) : op.base_fabric_sf;
                set("base_fabric_sf", sf);
              }} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Base Depth (ft)</Label>
              <Input type="number" value={op.base_depth} onChange={e => set("base_depth", e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-1">
              <Label>Fabric SF</Label>
              <Input type="number" value={op.base_fabric_sf} onChange={e => set("base_fabric_sf", e.target.value)} placeholder="Auto-calculated" />
            </div>
          </div>

          <div className="flex gap-3 flex-wrap">
            {baseSF && <CalcBox label="Base SF" value={`${baseSF} SF`} />}
            {baseCY && <CalcBox label="Base CY" value={`${baseCY} CY`} />}
          </div>

          <div className="space-y-1">
            <Label>Distance to Truck</Label>
            <Input value={op.base_distance_to_truck} onChange={e => set("base_distance_to_truck", e.target.value)} placeholder="e.g. 75 ft" />
          </div>

          <div className="space-y-1">
            <Label>Road Gravel Type</Label>
            <Input value={op.base_road_gravel_type} onChange={e => set("base_road_gravel_type", e.target.value)} placeholder="e.g. #21A, #57 stone" />
          </div>

          <div className="space-y-2">
            <Label>Compactor Type</Label>
            <div className="flex flex-wrap gap-2">
              {["Plate Compactor", "Weber Jumping Jack"].map(m => (
                <SelectBtn key={m} active={op.base_compactor === m} onClick={() => set("base_compactor", m)}>{m}</SelectBtn>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button className="flex-1" onClick={() => setStep(3)}>
              Next: Wall Type <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ---- STEP 3: Wall Type ---- */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-base">3) Select Wall Type</h2>

          <div className="flex flex-wrap gap-2">
            {WALL_TYPES.map(wt => (
              <SelectBtn key={wt.key} active={op.wall_type === wt.key} onClick={() => set("wall_type", wt.key)}>
                {wt.label}
              </SelectBtn>
            ))}
          </div>

          {op.wall_type && (
            <div className="space-y-4 pt-2 border-t">
              <h3 className="font-medium text-sm text-muted-foreground">Details — {op.wall_type}</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>LF</Label>
                  <Input type="number" value={op.wall_lf} onChange={e => set("wall_lf", e.target.value)} placeholder="Linear feet" />
                </div>
                <div className="space-y-1">
                  <Label>Exposed Height (ft)</Label>
                  <Input type="number" value={op.wall_exposed_height} onChange={e => set("wall_exposed_height", e.target.value)} placeholder="0" />
                </div>
                {!isBoulder && (
                  <div className="space-y-1">
                    <Label>Corner / Return Count</Label>
                    <Input type="number" value={op.wall_corner_count} onChange={e => set("wall_corner_count", e.target.value)} placeholder="0" />
                  </div>
                )}
                <div className="space-y-1">
                  <Label>SF of Fabric</Label>
                  <Input type="number" value={op.wall_fabric_sf} onChange={e => set("wall_fabric_sf", e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-1">
                  <Label>Distance to Truck</Label>
                  <Input value={op.wall_distance_to_truck} onChange={e => set("wall_distance_to_truck", e.target.value)} placeholder="e.g. 50 ft" />
                </div>
              </div>

              {isBoulder ? (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Boulder Details</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <Input value={op.boulder_type} onChange={e => set("boulder_type", e.target.value)} placeholder="e.g. Fieldstone" />
                    </div>
                    <div className="space-y-1">
                      <Label>Size</Label>
                      <Input value={op.boulder_size} onChange={e => set("boulder_size", e.target.value)} placeholder='e.g. 24"' />
                    </div>
                    <div className="space-y-1">
                      <Label>Count</Label>
                      <Input type="number" value={op.boulder_count} onChange={e => set("boulder_count", e.target.value)} placeholder="0" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Geogrid / Reinforcement Needed?</Label>
                  <div className="flex gap-2">
                    <SelectBtn active={op.wall_geogrid === true} onClick={() => set("wall_geogrid", true)}>Yes</SelectBtn>
                    <SelectBtn active={op.wall_geogrid === false} onClick={() => set("wall_geogrid", false)}>No</SelectBtn>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Machine Access</Label>
                <div className="flex flex-wrap gap-2">
                  {["Vermeer", "Dingo", "By Hand"].map(m => (
                    <SelectBtn key={m} active={op.wall_machine_access === m} onClick={() => set("wall_machine_access", m)}>{m}</SelectBtn>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Notes</Label>
                <Input value={op.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional notes..." />
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button className="flex-1" disabled={!op.wall_type || saving} onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}