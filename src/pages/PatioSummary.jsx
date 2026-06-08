import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, AlertTriangle } from "lucide-react";
import { PATIO_STAGES, getApplicableStages, getSelectedCategories, getVisibleFields } from "@/lib/patioStages";

function parseOps(jsonStr) {
  try { const p = JSON.parse(jsonStr || '[]'); if (Array.isArray(p)) return p; if (p && typeof p === 'object' && Object.keys(p).length > 0) return [{ ...p, id: 'legacy' }]; } catch {} return [];
}

export default function PatioSummary() {
  const { areaId } = useParams();
  const opId = new URLSearchParams(window.location.search).get('opId');
  const from = new URLSearchParams(window.location.search).get('from');
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
      const ops = parseOps(a.patio_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const stages = getApplicableStages(data);
  const categories = getSelectedCategories(data);

  // Find missing info
  const missingInfo = [];
  stages.forEach(stage => {
    if (stage.pickOne) {
      const selKey = stage.fields.find(f => f.type === "pick_one")?.key;
      if (!data[selKey]) missingInfo.push(`${stage.title} — no option selected`);
    }
  });

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

      <div className="bg-card border rounded-xl p-8 print:border-0 print:shadow-none">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold">Patio / Walkway Estimate Summary</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name}</span></div>
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{project?.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{project?.address || "—"}</span></div>
            <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{area?.name}</span></div>
          </div>
        </div>

        {/* Categories List */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Estimate Categories</h2>
          <div className="space-y-1">
            {categories.length > 0 ? categories.map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {c}
              </div>
            )) : (
              <p className="text-sm text-muted-foreground">No categories selected</p>
            )}
          </div>
        </div>

        {/* Stage Details */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold">Stage Details</h2>
          {stages.map(stage => {
            const visibleFields = getVisibleFields(stage, data);
            const hasValues = visibleFields.some(f => data[f.key]);
            if (!hasValues && !stage.pickOne) return null;

            let selectedOption = null;
            if (stage.pickOne) {
              const selKey = stage.fields.find(f => f.type === "pick_one")?.key;
              selectedOption = stage.options?.find(o => o.value === data[selKey]);
            }

            return (
              <div key={stage.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">{stage.title}</h3>
                {selectedOption && (
                  <div className="text-sm mb-2 text-amber-700 bg-amber-50 inline-block px-2 py-0.5 rounded">
                    Selected: {selectedOption.label}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {visibleFields.filter(f => f.type !== "pick_one" && data[f.key]).map(field => (
                    <div key={field.key} className="text-sm">
                      <span className="text-muted-foreground">{field.label}:</span>{" "}
                      <span className="font-medium">{data[field.key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calculated Values */}
        {data.base_sf && data.base_lf_not_abutting && (
          <div className="mt-6 border rounded-lg p-4 bg-blue-50/50">
            <h3 className="font-semibold text-sm mb-2">Calculated Values</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Base SF:</span> <span className="font-medium">{Number(data.base_sf) + Number(data.base_lf_not_abutting)}</span></div>
              <div><span className="text-muted-foreground">Geotextile SF:</span> <span className="font-medium">{Number(data.base_sf) + (2 * Number(data.base_lf_not_abutting))}</span></div>
            </div>
          </div>
        )}

        {/* Missing Info */}
        {missingInfo.length > 0 && (
          <div className="mt-6 border border-amber-300 rounded-lg p-4 bg-amber-50">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Missing Info
            </h3>
            <ul className="text-sm space-y-1 text-amber-700">
              {missingInfo.map((m, i) => <li key={i}>• {m}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}