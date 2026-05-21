import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { SM_STAGES, getSMVisibleFields } from "@/lib/siteManagementStages";

function parseOps(jsonStr) {
  try { const p = JSON.parse(jsonStr || '[]'); if (Array.isArray(p)) return p; if (p && typeof p === 'object' && Object.keys(p).length > 0) return [{ ...p, id: 'legacy' }]; } catch {} return [];
}

export default function SiteManagementSummary() {
  const { areaId } = useParams();
  const opId = new URLSearchParams(window.location.search).get('opId');
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
      const ops = parseOps(a.site_mgmt_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={`/project-summary/${area?.project_id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Project Summary
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-8 print:border-0">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold">Site Management &amp; Daily Cleanup Summary</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name}</span></div>
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{project?.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{project?.address || "—"}</span></div>
            <div>
              <span className="text-muted-foreground">Tax Status:</span>
              <span className={`ml-1 font-semibold ${data.tax_status === "Taxable" ? "text-amber-700" : "text-emerald-700"}`}>
                {data.tax_status || "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {SM_STAGES.filter(s => s.id !== "tax_status").map(stage => {
            const visibleFields = getSMVisibleFields(stage, data);
            const hasContent = visibleFields.some(f => f.type === "checkbox" ? data[f.key] === true : !!data[f.key]);
            if (!hasContent) return null;

            return (
              <div key={stage.id} className="border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-3">{stage.title}</h3>
                <div className="space-y-1.5">
                  {visibleFields.map(field => {
                    const val = data[field.key];
                    if (field.type === "checkbox" && !val) return null;
                    if (field.type !== "checkbox" && !val && val !== 0) return null;

                    return (
                      <div key={field.key} className="flex items-center gap-2 text-sm">
                        <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-0.5 ${field.type === "checkbox" ? "bg-emerald-500" : "bg-blue-400"}`} />
                        <span className="text-muted-foreground">{field.label}:</span>
                        <span className="font-medium">{field.type === "checkbox" ? "Yes" : String(val)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}