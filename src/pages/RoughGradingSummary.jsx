import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react";
import { RG_FIELDS, getRGSubTypeLabel, getRGCategory } from "@/lib/roughGradingStages";

export default function RoughGradingSummary() {
  const { areaId } = useParams();
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      const p = await base44.entities.Project.get(a.project_id);
      setProject(p);
      if (a.rough_grading_data) {
        try { setData(JSON.parse(a.rough_grading_data)); } catch {}
      }
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const fields = RG_FIELDS[data.sub_type] || { step2: [], step3: [] };
  const category = getRGCategory(data.sub_type);
  const subLabel = getRGSubTypeLabel(data.sub_type);
  const allFields = [...fields.step2, ...fields.step3];
  const showSodNote = data.sod_vegetation_removed === "Yes";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Area
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Rough Grading &amp; Hauling Summary</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name}</span></div>
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{project?.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{project?.address || "—"}</span></div>
            <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{area?.name}</span></div>
          </div>
        </div>

        {/* Category */}
        {category && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Estimate Category</h2>
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-orange-50 border border-orange-200 text-orange-800">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              {category}
            </div>
            {showSodNote && (
              <div className="mt-2 flex gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Also add to estimate:</p>
                  <p>Demolition &amp; Removals - Vegetation &amp; Softscape Items - Strip Sod Manually (Update Disposal Fee)</p>
                  <p className="text-xs mt-1">SF = top 1" of {data.sf || "—"} SF being removed</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sub-type */}
        <div>
          <span className="text-xs font-semibold text-muted-foreground">Sub-type:</span>{" "}
          <span className="text-sm font-medium text-primary">{subLabel}</span>
        </div>

        {/* Calculations */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements &amp; Calculations</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.sf_length && data.sf_width && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Dimensions</p>
                <p className="font-medium">{data.sf_length} ft × {data.sf_width} ft</p>
              </div>
            )}
            {data.sf && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Square Footage</p>
                <p className="font-bold text-lg">{data.sf} SF</p>
              </div>
            )}
            {data.depth_inches && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Depth</p>
                <p className="font-medium">{data.depth_inches}"</p>
              </div>
            )}
            {data.cy && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Cubic Yards</p>
                <p className="font-medium">{data.cy} CY</p>
              </div>
            )}
            {data.cy_fluff && (
              <div className="text-sm bg-orange-50 border border-orange-200 rounded-lg p-2">
                <p className="text-xs text-orange-700 font-semibold">CY + 25% Fluff Factor</p>
                <p className="font-bold text-lg text-orange-800">{data.cy_fluff} CY</p>
              </div>
            )}
          </div>
        </div>

        {/* Other fields */}
        {allFields.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
            <div className="space-y-2">
              {allFields.map(field => {
                const show = !field.condition || data[field.condition.key] === field.condition.value;
                const val = data[field.key];
                if (!show || (!val && val !== 0)) return null;
                return (
                  <div key={field.key} className="flex items-start gap-2 text-sm">
                    <span className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                    <span className="text-muted-foreground">{field.label}:</span>
                    <span className="font-medium">{String(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.notes && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Notes</h3>
            <p className="text-sm">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}