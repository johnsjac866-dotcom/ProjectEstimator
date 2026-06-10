import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { ArrowLeft } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{String(value)}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-card border rounded-xl p-4 space-y-1">
      <h3 className="font-semibold text-sm mb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function RetainingWallSummary() {
  const { areaId } = useParams();
  const [op, setOp] = useState(null);
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const opId = urlParams.get("opId");
  const from = urlParams.get("from");

  useEffect(() => {
    OfflineAreas.get(areaId).then(async a => {
      setArea(a);
      const entry = parseOps(a.retaining_wall_data).find(e => e.id === opId);
      setOp(entry || null);
      if (a.project_id) {
        const p = await OfflineProjects.get(a.project_id);
        setProject(p);
      }
    });
  }, [areaId, opId]);

  if (!op) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const excCY = op.exc_lf && op.exc_trench_depth && op.exc_trench_width
    ? ((parseFloat(op.exc_lf) * parseFloat(op.exc_trench_depth) * parseFloat(op.exc_trench_width)) / 27).toFixed(2)
    : null;

  const baseSF = op.base_lf && op.base_width
    ? (parseFloat(op.base_lf) * parseFloat(op.base_width)).toFixed(1)
    : null;
  const baseCY = op.base_lf && op.base_width && op.base_depth
    ? ((parseFloat(op.base_lf) * parseFloat(op.base_width) * parseFloat(op.base_depth)) / 27).toFixed(2)
    : null;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Retaining Wall</h1>
        {project && <p className="text-muted-foreground text-sm mt-1">{project.name} {area && `— ${area.name}`}</p>}
        {op.wall_type && <p className="text-sm font-medium text-primary mt-1">Type: {op.wall_type}</p>}
      </div>

      {/* Excavation */}
      <Section title="1) Excavation — Digging Trench Only">
        <Row label="LF" value={op.exc_lf} />
        <Row label="Wall Height" value={op.exc_wall_height && `${op.exc_wall_height} ft`} />
        <Row label="Trench Depth" value={op.exc_trench_depth && `${op.exc_trench_depth} ft`} />
        <Row label="Trench Width" value={op.exc_trench_width && `${op.exc_trench_width} ft`} />
        {excCY && <Row label="Cubic Yards (calc)" value={`${excCY} CY`} />}
        <Row label="Disposal Needed" value={op.exc_disposal ? "Yes" : "No"} />
        {op.exc_disposal && <Row label="Distance to Truck" value={op.exc_distance_to_truck} />}
        {op.exc_disposal && <Row label="Spoil Type" value={op.exc_spoil_type} />}
        <Row label="Machine Access" value={op.exc_machine_access} />
      </Section>

      {/* Base Install */}
      <Section title="2) Base Install — Road Gravel">
        <Row label="LF" value={op.base_lf} />
        <Row label="Base Width" value={op.base_width && `${op.base_width} ft`} />
        <Row label="Base Depth" value={op.base_depth && `${op.base_depth} ft`} />
        {baseSF && <Row label="Base SF (calc)" value={`${baseSF} SF`} />}
        {baseCY && <Row label="Base CY (calc)" value={`${baseCY} CY`} />}
        <Row label="Fabric SF" value={op.base_fabric_sf && `${op.base_fabric_sf} SF`} />
        <Row label="Distance to Truck" value={op.base_distance_to_truck} />
        <Row label="Road Gravel Type" value={op.base_road_gravel_type} />
        <Row label="Compactor" value={op.base_compactor} />
      </Section>

      {/* Wall Type */}
      {op.wall_type && (
        <Section title={`3) Wall — ${op.wall_type}`}>
          <Row label="LF" value={op.wall_lf} />
          <Row label="Exposed Height" value={op.wall_exposed_height && `${op.wall_exposed_height} ft`} />
          {op.wall_type !== "Boulder" && <Row label="Corner / Return Count" value={op.wall_corner_count} />}
          <Row label="SF of Fabric" value={op.wall_fabric_sf && `${op.wall_fabric_sf} SF`} />
          <Row label="Distance to Truck" value={op.wall_distance_to_truck} />
          {op.wall_type === "Boulder" ? (
            <>
              <Row label="Boulder Type" value={op.boulder_type} />
              <Row label="Boulder Size" value={op.boulder_size} />
              <Row label="Boulder Count" value={op.boulder_count} />
            </>
          ) : (
            <Row label="Geogrid / Reinforcement" value={op.wall_geogrid ? "Yes" : "No"} />
          )}
          <Row label="Machine Access" value={op.wall_machine_access} />
        </Section>
      )}

      {op.notes && (
        <Section title="Notes">
          <p className="text-sm">{op.notes}</p>
        </Section>
      )}
    </div>
  );
}