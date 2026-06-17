import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Flag } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const OBSTRUCTION_NOTE = "Check for tree roots, pipes, or other obstructions within top three inches of soil";

// All fields per edge type
const EDGE_TYPE_FIELDS = {
  Brick: [
    { label: "Width", key: "brick_width" },
    { label: "Linear Feet — Straight", key: "brick_lf_straight" },
    { label: "Linear Feet — Curved", key: "brick_lf_curved" },
    { label: "Color", key: "brick_color" },
    { label: "Ends cut to reduce gaps?", key: "brick_ends_cut" },
    { label: "Prep area for brick? (hrs)", key: "brick_prep_hours" },
    { label: "Coarse / Washed Sand needed?", key: "brick_sand_needed" },
    { label: "Cut Off Saw needed?", key: "brick_cut_off_saw" },
    { label: "Disposal of debris or extra brick? (hrs)", key: "brick_disposal_hours" },
  ],
  Metal: [
    { label: "Metal Type", key: "metal_type" },
    { label: "Linear Feet", key: "metal_lf" },
    { label: "Corners", key: "metal_corners" },
    { label: "Splicers", key: "metal_splicers" },
    { label: "Cut Off Saw needed?", key: "metal_cut_off_saw" },
    { label: "Remove sod behind edge? (hrs)", key: "metal_remove_sod_hours" },
  ],
  Bullet: [
    { label: "Supplier", key: "bullet_supplier" },
    { label: "Linear Feet", key: "bullet_lf" },
    { label: "Color", key: "bullet_color" },
    { label: "Prep area for brick? (hrs)", key: "bullet_prep_hours" },
    { label: "Bulk Permeable Chips for leveling needed?", key: "bullet_permeable_chips" },
    { label: "Cut Off Saw needed?", key: "bullet_cut_off_saw" },
    { label: "Disposal of debris or extra brick? (hrs)", key: "bullet_disposal_hours" },
  ],
  "Natural Edge": [
    { label: "Method", key: "natural_method" },
    { label: "Linear Feet", key: "natural_lf" },
  ],
  Poly: [
    { label: "Linear Feet", key: "poly_lf" },
    { label: "Angular connectors needed?", key: "poly_angular_connectors" },
    { label: "Remove sod or soil behind edge? (hrs)", key: "poly_remove_sod_hours" },
  ],
  "Snapped Limestone": [
    { label: "Linear Feet", key: "snapped_lf" },
    { label: "Ends cut to reduce gaps?", key: "snapped_ends_cut" },
    { label: "Coarse / Washed Sand needed?", key: "snapped_sand_needed" },
    { label: "Prep area for stone? (hrs)", key: "snapped_prep_hours" },
    { label: "Cut Off Saw needed?", key: "snapped_cut_off_saw" },
  ],
};

function getCategory(data) {
  if (data.edge_type === "Metal") return `Bed Edging - ${data.metal_type || "Metal"}`;
  const map = {
    Brick: "Bed Edging - Brick",
    Bullet: "Bed Edging - Bullet",
    "Natural Edge": "Bed Edging - Natural Edge",
    Poly: "Bed Edging - Poly",
    "Snapped Limestone": "Bed Edging - Snapped Limestone",
  };
  return map[data.edge_type] || null;
}

function Row({ label, value, flagged }) {
  if (!value && value !== 0) return null;
  return (
    <div className={`flex items-start gap-2 text-sm ${flagged ? "text-orange-700" : ""}`}>
      <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${flagged ? "bg-orange-400" : "bg-purple-400"}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{String(value)}</span>
      {flagged && <Flag className="h-3 w-3 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" />}
    </div>
  );
}

function FlaggedRow({ label, fieldKey, flags, flagLabels }) {
  if (!flags.includes(fieldKey)) return null;
  return (
    <div className="flex items-start gap-2 text-sm text-orange-700">
      <span className="h-2 w-2 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
      <span className="text-muted-foreground">{flagLabels?.[fieldKey] || label}:</span>
      <span className="font-medium italic">Not provided</span>
      <Flag className="h-3 w-3 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" />
    </div>
  );
}

export default function BedEdgingSummary() {
  const { areaId } = useParams();
  const opId = new URLSearchParams(window.location.search).get("opId");
  const from = new URLSearchParams(window.location.search).get("from");
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      setArea(a);
      const p = await OfflineProjects.get(a.project_id);
      setProject(p);
      const ops = parseOps(a.bed_edging_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const fields = EDGE_TYPE_FIELDS[data.edge_type] || [];
  const category = getCategory(data);
  const flags = data._flags || [];
  const flagLabels = data._flag_labels || {};
  const hasObstructionNote = ["Brick", "Metal", "Bullet", "Poly", "Snapped Limestone"].includes(data.edge_type);
  const hasRollingNote = data.edge_type === "Metal";

  // Bricks/pieces calculations for display
  let calcNote = null;
  if (data.edge_type === "Brick") {
    const totalLf = (parseFloat(data.brick_lf_straight) || 0) + (parseFloat(data.brick_lf_curved) || 0);
    if (totalLf > 0) calcNote = `Bricks needed: ${Math.ceil((totalLf * 12) / 7.75)} bricks (${totalLf} LF ÷ 7.75" each)`;
  } else if (data.edge_type === "Bullet" && data.bullet_lf) {
    const lf = parseFloat(data.bullet_lf) || 0;
    const brickLen = data.bullet_supplier === "Rochester" ? 12.25 : 11.75;
    if (lf > 0) calcNote = `Bricks needed: ${Math.ceil((lf * 12) / brickLen)} bricks (${lf} LF ÷ ${brickLen}" each — ${data.bullet_supplier || "Menards"})`;
  } else if (data.edge_type === "Poly" && data.poly_lf) {
    const lf = parseFloat(data.poly_lf) || 0;
    if (lf > 0) {
      const pieces = Math.ceil(lf / 20);
      calcNote = `Pieces needed: ${pieces} (${lf} LF ÷ 20 ft) — Stakes needed: ${pieces * 7}`;
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Bed Edging Summary</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name}</span></div>
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{project?.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{project?.address || "—"}</span></div>
            <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{area?.name}</span></div>
          </div>
        </div>

        {/* Flags banner */}
        {flags.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
            <Flag className="h-4 w-4 flex-shrink-0" fill="currentColor" />
            <span className="font-medium">{flags.length} item{flags.length !== 1 ? "s" : ""} flagged for review</span>
          </div>
        )}

        {/* Estimate Category */}
        {category && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Estimate Category</h2>
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-purple-50 border border-purple-200 text-purple-800">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              {category}
            </div>
          </div>
        )}

        {/* Edge Type */}
        <div className="text-sm">
          <span className="text-muted-foreground">Edge Type:</span>{" "}
          <span className="font-semibold text-primary">{data.edge_type}</span>
        </div>

        {/* Details */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
          <div className="space-y-2">
            {data.time_estimate && (
              <Row label="Time Estimate" value={`${data.time_estimate} hrs`} flagged={flags.includes("time_estimate")} />
            )}
            {flags.includes("time_estimate") && !data.time_estimate && (
              <FlaggedRow label="Time Estimate" fieldKey="time_estimate" flags={flags} flagLabels={flagLabels} />
            )}

            {fields.map(field => {
              const val = data[field.key];
              const isFlagged = flags.includes(field.key);
              if (val || val === 0) return <Row key={field.key} label={field.label} value={val} flagged={isFlagged} />;
              if (isFlagged) return <FlaggedRow key={field.key} label={field.label} fieldKey={field.key} flags={flags} flagLabels={flagLabels} />;
              return null;
            })}

            {(data.bed_edger_needed || flags.includes("bed_edger_needed")) && (
              data.bed_edger_needed
                ? <Row label="Bed Edger Needed" value={data.bed_edger_needed} flagged={flags.includes("bed_edger_needed")} />
                : <FlaggedRow label="Bed Edger Needed" fieldKey="bed_edger_needed" flags={flags} flagLabels={flagLabels} />
            )}
          </div>
        </div>

        {/* Calculated quantities */}
        {calcNote && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            <span className="font-semibold">Calculated:</span> {calcNote}
          </div>
        )}

        {/* Notes & Warnings */}
        {(data.notes || hasObstructionNote || hasRollingNote) && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Notes</h3>
            <div className="space-y-2">
              {data.notes && <p className="text-sm">{data.notes}</p>}
              {hasObstructionNote && (
                <div className="flex items-start gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>{OBSTRUCTION_NOTE}</span>
                </div>
              )}
              {hasRollingNote && (
                <div className="flex items-start gap-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="flex-shrink-0">⚠️</span>
                  <span>Cannot do with rolling topography</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}