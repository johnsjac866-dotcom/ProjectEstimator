import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value, highlight }) {
  if (!value && value !== 0) return null;
  return (
    <div className={`flex items-start gap-2 text-sm ${highlight ? "font-semibold" : ""}`}>
      <span className="h-2 w-2 rounded-full bg-yellow-400 flex-shrink-0 mt-1.5" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  );
}

export default function MulchSummary() {
  const { areaId } = useParams();
  const opId = new URLSearchParams(window.location.search).get("opId");
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
      const ops = parseOps(a.mulch_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const category = data.mulch_type ? `Mulch - ${data.mulch_type}` : null;

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

        {/* Type */}
        <div className="text-sm">
          <span className="text-muted-foreground">Mulch Type:</span>{" "}
          <span className="font-medium text-primary">{data.mulch_type}</span>
        </div>

        {/* Measurements & Calculations */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements</h3>
          <div className="space-y-2">
            <Row label="Length" value={data.length ? `${data.length} ft` : null} />
            <Row label="Width" value={data.width ? `${data.width} ft` : null} />
            <Row label="Depth" value={data.depth ? `${data.depth} in` : null} />
          </div>
        </div>

        {/* Calculated Results */}
        {(data.sf || data.cy || data.tons) && (
          <div className="border rounded-lg p-4 bg-muted/20">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Calculated Results</h3>
            <div className="space-y-2">
              <Row label="Square Footage" value={data.sf ? `${data.sf} SF` : null} />
              <Row label="Cubic Yards" value={data.cy ? `${data.cy} CY` : null} />
              <Row label="Estimated Weight" value={data.tons ? `${data.tons} tons` : null} />
            </div>
          </div>
        )}

        {/* Details */}
        {(data.bed_type || data.install_type || data.machine_access) && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
            <div className="space-y-2">
              <Row label="Bed Type" value={data.bed_type} />
              {data.mulch_type === "Organic" && <Row label="Install Type" value={data.install_type} />}
              <Row label="Machine Access" value={data.machine_access} />
            </div>
          </div>
        )}

        {/* Notes */}
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