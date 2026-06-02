import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground min-w-[180px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function MaintenanceSummary() {
  const { areaId } = useParams();
  const opId = new URLSearchParams(window.location.search).get("opId");
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      const ops = parseOps(a.maintenance_data);
      setEntry(opId ? ops.find(o => o.id === opId) : ops[0]);
      if (a.project_id) {
        const p = await base44.entities.Project.get(a.project_id);
        setProject(p);
      }
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!entry) return <div className="text-center py-20 text-muted-foreground">No entry found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>

      <div className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">Maintenance — {entry.maintenance_type}</h1>
        {project && <p className="text-sm text-muted-foreground mt-1">{project.name} — {area?.name}</p>}
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-base mb-3">Details</h2>
        <Row label="Type" value={entry.maintenance_type} />
        <Row label="Length (ft)" value={entry.length} />
        <Row label="Width (ft)" value={entry.width} />
        <Row label="Square Footage (SF)" value={entry.sf} />
        <Row label="Time Estimate (hrs)" value={entry.time_estimate} />
        <Row label="Herbicide Treatment" value={entry.herbicide} />
        {entry.herbicide === "Yes" && <Row label="Herbicide SF" value={entry.herbicide_sf} />}
        {entry.notes && (
          <>
            <div className="pt-2 border-t" />
            <Row label="Notes" value={entry.notes} />
          </>
        )}
      </div>
    </div>
  );
}