import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pencil, Flag, AlertTriangle } from "lucide-react";
import { DEMO_FIELDS, getDemoCategory, getDemoSubTypeLabel, getDemoGroupLabel } from "@/lib/demolitionStages";

function parseOps(jsonStr) {
  try { const p = JSON.parse(jsonStr || '[]'); if (Array.isArray(p)) return p; if (p && typeof p === 'object' && Object.keys(p).length > 0) return [{ ...p, id: 'legacy' }]; } catch {} return [];
}

function SummaryRow({ label, value, isFlagged }) {
  const hasVal = value !== null && value !== undefined && value !== '';
  return (
    <div className={`flex items-start gap-2 text-sm py-1.5 ${isFlagged ? 'bg-orange-50 rounded px-2 -mx-2' : ''}`}>
      {isFlagged ? (
        <Flag className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-red-400 flex-shrink-0 mt-1.5" />
      )}
      <span className="text-muted-foreground min-w-0">{label}:</span>
      <span className={`font-medium ${!hasVal ? 'text-muted-foreground/50 italic' : ''}`}>
        {hasVal ? String(value) : '— not set'}
      </span>
    </div>
  );
}

export default function DemolitionSummary() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const opId = new URLSearchParams(window.location.search).get('opId');
  const from = new URLSearchParams(window.location.search).get('from');
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
      const ops = parseOps(a.demolition_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const cfg = DEMO_FIELDS[data.sub_type] || { hasSFCalc: false, hasCYCalc: false, measurements: [], details: [] };
  const category = getDemoCategory(data.group, data.sub_type);
  const flagSet = new Set(data._flags || []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/demolition-wizard/${areaId}?opId=${data.id}`)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Demolition &amp; Removals Summary</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name}</span></div>
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{project?.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{project?.address || "—"}</span></div>
            <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{area?.name}</span></div>
          </div>
        </div>

        {flagSet.size > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{flagSet.size} flagged item{flagSet.size !== 1 ? 's' : ''} need{flagSet.size === 1 ? 's' : ''} attention</span>
          </div>
        )}

        {category && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Estimate Category</h2>
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-red-50 border border-red-200 text-red-800">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {category}
            </div>
          </div>
        )}

        <div className="flex gap-4 text-sm">
          <div><span className="text-muted-foreground">Group:</span> <span className="font-medium">{getDemoGroupLabel(data.group)}</span></div>
          <div><span className="text-muted-foreground">Type:</span> <span className="font-medium text-primary">{getDemoSubTypeLabel(data.group, data.sub_type)}</span></div>
        </div>

        {(cfg.hasSFCalc || cfg.hasCYCalc || data.sf || data.cy) && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements &amp; Calculations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(data.sf_length || data.sf_width) && (
                <div className={`text-sm ${flagSet.has('sf') ? 'bg-orange-50 rounded p-2' : ''}`}>
                  <p className="text-xs text-muted-foreground">Dimensions</p>
                  <p className="font-medium">{data.sf_length || '?'} × {data.sf_width || '?'} ft</p>
                </div>
              )}
              <div className={`text-sm ${flagSet.has('sf') ? 'bg-orange-50 rounded p-2' : ''}`}>
                <p className="text-xs text-muted-foreground">Square Footage</p>
                <p className="font-bold text-lg">{data.sf || '— not set'}</p>
              </div>
              {cfg.hasCYCalc && (
                <div className={`text-sm ${flagSet.has('depth_inches') ? 'bg-orange-50 rounded p-2' : ''}`}>
                  <p className="text-xs text-muted-foreground">Depth</p>
                  <p className="font-medium">{data.depth_inches ? `${data.depth_inches}"` : '— not set'}</p>
                </div>
              )}
              {data.cy && (
                <div className="text-sm bg-red-50 border border-red-200 rounded-lg p-2">
                  <p className="text-xs text-red-700 font-semibold">Cubic Yards</p>
                  <p className="font-bold text-lg text-red-800">{data.cy} CY</p>
                </div>
              )}
            </div>
          </div>
        )}

        {cfg.measurements.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements</h3>
            <div className="space-y-1">
              {cfg.measurements.map(field => {
                const show = !field.condition || data[field.condition.key] === field.condition.value;
                if (!show) return null;
                return <SummaryRow key={field.key} label={field.label} value={data[field.key]} isFlagged={flagSet.has(field.key)} />;
              })}
            </div>
          </div>
        )}

        {cfg.details.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details &amp; Decisions</h3>
            <div className="space-y-1">
              {cfg.details.map(field => {
                const show = !field.condition || data[field.condition.key] === field.condition.value;
                if (!show) return null;
                return <SummaryRow key={field.key} label={field.label} value={data[field.key]} isFlagged={flagSet.has(field.key)} />;
              })}
            </div>
          </div>
        )}

        <div className="border rounded-lg p-4">
          <SummaryRow label="Notes" value={data.notes} isFlagged={flagSet.has('notes')} />
        </div>
      </div>
    </div>
  );
}