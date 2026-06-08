import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { BED_FIELDS, getSubTypeLabel, getSubTypeCategory, BED_MAIN_TYPES } from "@/lib/bedPrepStages";

function parseOps(jsonStr) {
  try { const p = JSON.parse(jsonStr || '[]'); if (Array.isArray(p)) return p; if (p && typeof p === 'object' && Object.keys(p).length > 0) return [{ ...p, id: 'legacy' }]; } catch {} return [];
}

export default function BedPrepSummary() {
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
      const ops = parseOps(a.bed_prep_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const fields = BED_FIELDS[data.sub_type] || { measurements: [], decisions: [], constraints: [] };
  const mainTypeLabel = BED_MAIN_TYPES.find(t => t.value === data.main_type)?.label || data.main_type;
  const subTypeLabel = getSubTypeLabel(data.sub_type);
  const category = getSubTypeCategory(data.sub_type);

  function renderSectionRows(fieldList) {
    return fieldList.map(field => {
      const val = data[field.key];
      if (field.type === "checkbox") {
        if (!val) return null;
        return (
          <div key={field.key} className="flex items-center gap-2 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
            <span className="text-muted-foreground">{field.label}:</span>
            <span className="font-medium">Yes</span>
          </div>
        );
      }
      if (!val && val !== 0) return null;
      return (
        <div key={field.key} className="flex items-start gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
          <span className="text-muted-foreground">{field.label}:</span>
          <span className="font-medium">{String(val)}</span>
        </div>
      );
    });
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

      <div className="bg-card border rounded-xl p-8 print:border-0">
        <div className="mb-8 border-b pb-6">
          <h1 className="text-2xl font-bold">Bed Preparation Summary</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name}</span></div>
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{project?.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{project?.address || "—"}</span></div>
            <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{area?.name}</span></div>
          </div>
        </div>

        {category && (
          <div className="mb-6">
            <h2 className="text-base font-bold mb-2">Estimate Category</h2>
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {category}
            </div>
          </div>
        )}

        <div className="mb-4">
          <span className="text-xs font-semibold text-muted-foreground">Type:</span>{" "}
          <span className="text-sm font-medium">{mainTypeLabel}</span>
          {subTypeLabel && <> — <span className="text-sm font-medium text-primary">{subTypeLabel}</span></>}
        </div>

        <div className="space-y-4">
          {fields.measurements.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide text-xs">Measurements</h3>
              <div className="space-y-1.5">{renderSectionRows(fields.measurements)}</div>
            </div>
          )}
          {fields.decisions.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide text-xs">Decisions</h3>
              <div className="space-y-1.5">{renderSectionRows(fields.decisions)}</div>
            </div>
          )}
          {fields.constraints.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide text-xs">Constraints / Risk Factors</h3>
              <div className="space-y-1.5">{renderSectionRows(fields.constraints)}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}