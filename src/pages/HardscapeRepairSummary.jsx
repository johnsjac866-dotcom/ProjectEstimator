import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { ArrowLeft, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export default function HardscapeRepairSummary() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const opId = new URLSearchParams(window.location.search).get("opId");
  const from = new URLSearchParams(window.location.search).get("from");
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      setArea(a);
      const ops = parseOps(a.hardscape_repair_data);
      const found = opId ? ops.find(o => o.id === opId) : ops[0];
      setEntry(found || null);
      if (a.project_id) {
        const p = await OfflineProjects.get(a.project_id);
        setProject(p);
      }
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!entry) return <div className="text-center py-20 text-muted-foreground">No entry found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <Button variant="outline" size="sm" onClick={() => navigate(`/hardscape-repair-wizard/${areaId}?opId=${opId || entry.id}`)}>
          <Pencil className="h-4 w-4 mr-1" /> Edit
        </Button>
      </div>

      {(entry._flags || []).length > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-300 text-orange-800 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">{(entry._flags || []).length} item{(entry._flags || []).length !== 1 ? 's' : ''} flagged for review.</span>
          <span className="text-orange-600">Click Edit to go straight to the first flagged item.</span>
        </div>
      )}

      <div className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">Hardscape - Repair Existing</h1>
        {project && <p className="text-sm text-muted-foreground mt-1">{project.name} — {area?.name}</p>}
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-base mb-3">Repair Details</h2>
        <Row label="Repair Type" value={entry.repair_type} />
        <Row label="Length (ft)" value={entry.length} />
        <Row label="Width (ft)" value={entry.width} />
        <Row label="Square Footage (SF)" value={entry.sf} />
        <Row label="Surface Material Type" value={entry.material_type} />
        <Row label="Time Estimate (hrs)" value={entry.time_estimate} />
        <Row label="New Material Needed" value={entry.new_material_needed} />

        {entry.new_material_needed === "Yes" && (
          <>
            <div className="pt-2 border-t"><h3 className="text-sm font-semibold mb-2">New Material</h3></div>
            <Row label="Quantity" value={entry.new_material_qty ? `${entry.new_material_qty} ${entry.new_material_unit || "SF"}` : null} />
          </>
        )}

        {entry.new_base_needed === "Yes" && (
          <>
            <div className="pt-2 border-t"><h3 className="text-sm font-semibold mb-2">New Base</h3></div>
            <Row label="Base Type" value={entry.new_base_type} />
          </>
        )}

        {entry.new_leveling_needed === "Yes" && (
          <>
            <div className="pt-2 border-t"><h3 className="text-sm font-semibold mb-2">New Leveling Layer</h3></div>
            <Row label="Leveling Layer Type" value={entry.new_leveling_type} />
          </>
        )}

        {entry.new_edge_needed === "Yes" && (
          <>
            <div className="pt-2 border-t"><h3 className="text-sm font-semibold mb-2">New Edge</h3></div>
            <Row label="Edge Type" value={entry.new_edge_type} />
            <Row label="Edge LF" value={entry.new_edge_lf} />
          </>
        )}

        <div className="pt-2 border-t">
          <h3 className="text-sm font-semibold mb-2">Site Conditions</h3>
        </div>
        <Row label="Machine Access" value={entry.machine_access} />
        <Row label="Constraints / Hazards" value={entry.constraints} />
      </div>
    </div>
  );
}