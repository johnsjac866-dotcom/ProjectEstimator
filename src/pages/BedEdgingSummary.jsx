import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const OBSTRUCTION_NOTE = "Check for tree roots, pipes, or other obstructions within top three inches of soil";

const EDGE_TYPE_FIELDS = {
  "Brick": [
    { label: "Width", key: "brick_width" },
    { label: "Linear Feet — Straight", key: "brick_lf_straight" },
    { label: "Linear Feet — Curved", key: "brick_lf_curved" },
    { label: "Color", key: "brick_color" },
    { label: "Ends cut to reduce gaps?", key: "brick_ends_cut" },
  ],
  "Metal": [
    { label: "Metal Type", key: "metal_type" },
    { label: "Linear Feet", key: "metal_lf" },
    { label: "Corners", key: "metal_corners" },
    { label: "Splicers", key: "metal_splicers" },
  ],
  "Bullet": [
    { label: "Linear Feet", key: "bullet_lf" },
    { label: "Color", key: "bullet_color" },
  ],
  "Natural Edge": [
    { label: "Method", key: "natural_method" },
    { label: "Linear Feet", key: "natural_lf" },
  ],
  "Poly": [
    { label: "Linear Feet", key: "poly_lf" },
    { label: "Corners — 90°", key: "poly_corners_90" },
    { label: "Corners — 45°", key: "poly_corners_45" },
    { label: "Splicers", key: "poly_splicers" },
  ],
  "Snapped Limestone": [
    { label: "Linear Feet", key: "snapped_lf" },
    { label: "Ends cut to reduce gaps?", key: "snapped_ends_cut" },
    { label: "Corners", key: "snapped_corners" },
    { label: "Splicers", key: "snapped_splicers" },
  ],
};

const CATEGORY_MAP = {
  "Brick":             "Bed Edging - Brick",
  "Metal":             null, // resolved dynamically
  "Bullet":            "Bed Edging - Bullet",
  "Natural Edge":      "Bed Edging - Natural Edge",
  "Poly":              "Bed Edging - Poly",
  "Snapped Limestone": "Bed Edging - Snapped Limestone",
};

function getCategory(data) {
  if (data.edge_type === "Metal") return `Bed Edging - ${data.metal_type || "Metal"}`;
  return CATEGORY_MAP[data.edge_type] || null;
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
  const hasObstructionNote = ["Brick", "Metal", "Bullet", "Poly", "Snapped Limestone"].includes(data.edge_type);
  const hasRollingNote = data.edge_type === "Metal";

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

        {/* Edge Type label */}
        <div className="text-sm">
          <span className="text-muted-foreground">Edge Type:</span>{" "}
          <span className="font-medium text-primary">{data.edge_type}</span>
        </div>

        {/* Details */}
        {(fields.length > 0 || data.bed_edger_needed || data.time_estimate) && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
            <div className="space-y-2">
              {fields.map(field => {
                const val = data[field.key];
                if (!val && val !== 0) return null;
                return (
                  <div key={field.key} className="flex items-start gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                    <span className="text-muted-foreground">{field.label}:</span>
                    <span className="font-medium">{String(val)}</span>
                  </div>
                );
              })}
              {data.bed_edger_needed && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                  <span className="text-muted-foreground">Bed Edger Needed:</span>
                  <span className="font-medium">{data.bed_edger_needed}</span>
                </div>
              )}
              {data.time_estimate && (
                <div className="flex items-start gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
                  <span className="text-muted-foreground">Time Estimate:</span>
                  <span className="font-medium">{data.time_estimate} hrs</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
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