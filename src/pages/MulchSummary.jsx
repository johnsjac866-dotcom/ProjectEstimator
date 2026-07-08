import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pencil, Flag, AlertTriangle } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value, unit, flagSet, flagKey }) {
  const hasVal = value != null && value !== '' && !(Array.isArray(value) && value.length === 0);
  const isFlagged = flagKey && flagSet.has(flagKey);
  return (
    <div className={`flex items-start gap-2 text-sm py-1.5 ${isFlagged ? 'bg-orange-50 rounded px-2 -mx-2' : ''}`}>
      {isFlagged ? (
        <Flag className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />
      )}
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium ${!hasVal && isFlagged ? 'text-orange-600 italic' : !hasVal ? 'text-muted-foreground/50 italic' : ''}`}>
        {hasVal ? (unit ? `${String(value)} ${unit}` : String(value)) : isFlagged ? 'Missing — needs review' : '— not set'}
      </span>
    </div>
  );
}

// All fields per mulch type, in the order they appear in the wizard
const COMMON_FIELDS = [
  { k: "time_estimate", l: "Time Estimate", unit: "hrs" },
  { k: "length", l: "Length", unit: "ft" },
  { k: "width", l: "Width", unit: "ft" },
  { k: "depth", l: "Depth", unit: "in" },
  { k: "bed_type", l: "Bed Type" },
];

const ORGANIC_FIELDS = [
  { k: "install_type", l: "Install Type" },
  { k: "organic_subtype", l: "Mulch Subtype" },
  { k: "distance_to_truck", l: "Distance to Truck", unit: "ft" },
];

const STONE_FIELDS = [
  { k: "fabric_needed", l: "Fabric Needed" },
  { k: "fabric_sf", l: "Fabric SF", show: d => d.fabric_needed === "Yes" },
];

const COMMON_TAIL_FIELDS = [
  { k: "machine_access", l: "Machine Access" },
  { k: "notes", l: "Notes" },
];

export default function MulchSummary() {
  const { areaId } = useParams();
  const navigate = useNavigate();
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
      const ops = parseOps(a.mulch_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const flagSet = new Set(data._flags || []);
  const category = data.mulch_type ? `Mulch - ${data.mulch_type}` : null;

  let typeFields = [...COMMON_FIELDS];
  if (data.mulch_type === "Organic") typeFields = [...typeFields, ...ORGANIC_FIELDS];
  if (data.mulch_type === "Stone") typeFields = [...typeFields, ...STONE_FIELDS];
  typeFields = [...typeFields, ...COMMON_TAIL_FIELDS];

  function handleEdit() {
    navigate(`/mulch-wizard/${areaId}?opId=${opId || data.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {flagSet.size > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-300 text-orange-800 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{flagSet.size} field{flagSet.size > 1 ? 's' : ''} need{flagSet.size === 1 ? 's' : ''} review.</span>
          <span className="text-orange-600">Click Edit to go straight to the first flagged item.</span>
        </div>
      )}

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Mulch Summary</h1>
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
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-500" />
              {category}
            </div>
          </div>
        )}

        {/* Mulch Type */}
        <Row flagKey="mulch_type" label="Mulch Type" value={data.mulch_type} flagSet={flagSet} />

        {/* All fields */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
          <div className="space-y-1">
            {typeFields.map(field => {
              const show = !field.show || field.show(data);
              if (!show) return null;
              return <Row key={field.k} flagKey={field.k} label={field.l} value={data[field.k]} unit={field.unit} flagSet={flagSet} />;
            })}
          </div>
        </div>

        {/* Calculated Results */}
        {(data.sf || data.cy || data.tons) && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Calculated Results</h3>
            <div className="grid grid-cols-3 gap-3">
              {data.sf && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground">Square Footage</p>
                  <p className="font-bold text-lg">{data.sf} SF</p>
                </div>
              )}
              {data.cy && (
                <div className="text-sm">
                  <p className="text-xs text-muted-foreground">Cubic Yards</p>
                  <p className="font-bold text-lg">{data.cy} CY</p>
                </div>
              )}
              {data.tons && (
                <div className="text-sm bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                  <p className="text-xs text-yellow-700 font-semibold">Estimated Weight</p>
                  <p className="font-bold text-lg text-yellow-800">{data.tons} tons</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}