import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground min-w-[200px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function MaintenanceSummary() {
  const { areaId } = useParams();
  const opId = new URLSearchParams(window.location.search).get("opId");
  const from = new URLSearchParams(window.location.search).get("from");
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

  const type = entry.maintenance_type;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
      </Link>

      <div className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">Maintenance — {type}</h1>
        {project && <p className="text-sm text-muted-foreground mt-1">{project.name} — {area?.name}</p>}
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-base mb-3">Details</h2>
        <Row label="Type" value={type} />

        {type === "Weeding" && (
          <>
            <Row label="Length (ft)" value={entry.length} />
            <Row label="Width (ft)" value={entry.width} />
            <Row label="Square Footage (SF)" value={entry.sf} />
            <Row label="Time Estimate (hrs)" value={entry.time_estimate} />
            <Row label="Herbicide Treatment" value={entry.herbicide} />
            {entry.herbicide === "Yes" && <Row label="Herbicide SF" value={entry.herbicide_sf} />}
          </>
        )}

        {type === "Core Aeration / Overseed" && (
          <>
            <Row label="Length (ft)" value={entry.length} />
            <Row label="Width (ft)" value={entry.width} />
            <Row label="Square Footage (SF)" value={entry.sf} />
            <Row label="Estimated Hours" value={entry.estimated_hours} />
            <Row label="Overseed Needed" value={entry.overseed_needed} />
            {entry.overseed_needed === "Yes" && <Row label="Seed Type" value={entry.seed_type} />}
            <Row label="Machine Needed" value={entry.machine_needed} />
          </>
        )}

        {type === "Follow up Care - Planting Bed Maintenance" && (
          <>
            <Row label="Number of Visits" value={entry.visits} />
            <Row label="Hours per Visit" value={entry.hours_per_visit} />
            <Row label="Size of Beds" value={entry.bed_size} />
            <Row label="Travel Time" value={entry.travel_time} />
          </>
        )}

        {type === "Lawn" && (
          <>
            <Row label="Length (ft)" value={entry.length} />
            <Row label="Width (ft)" value={entry.width} />
            <Row label="Square Footage (SF)" value={entry.sf} />
            <Row label="Number of Visits" value={entry.visits} />
            <Row label="Hours per Visit" value={entry.hours_per_visit} />
            <Row label="Service Type" value={entry.service_type} />
            <Row label="Travel Time" value={entry.travel_time} />
          </>
        )}

        {type === "Seasonal Clean Up" && (
          <>
            <Row label="Length (ft)" value={entry.length} />
            <Row label="Width (ft)" value={entry.width} />
            <Row label="Square Footage (SF)" value={entry.sf} />
            <Row label="Zones" value={entry.zones} />
            <Row label="Estimated Hours" value={entry.estimated_hours} />
            <Row label="Season Scope" value={entry.season_scope} />
            <Row label="Disposal Needed" value={entry.disposal_needed} />
            {entry.disposal_needed === "Yes" && <Row label="Volume of Debris" value={entry.debris_volume} />}
          </>
        )}

        {type === "Trees & Shrubs" && (
          <>
            {entry.plants && entry.plants.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Plants:</p>
                <div className="space-y-1 ml-2">
                  {entry.plants.map((p, i) => (
                    <div key={i} className="text-sm">
                      <span className="font-medium">{p.name}</span>
                      {p.count && <span className="text-muted-foreground"> — {p.count}x</span>}
                      {p.size && <span className="text-muted-foreground"> ({p.size})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Row label="Estimated Hours" value={entry.estimated_hours} />
            <Row label="Service Type" value={entry.service_type} />
            <Row label="Disposal Needed" value={entry.disposal_needed} />
            {entry.disposal_needed === "Yes" && <Row label="Volume of Debris" value={entry.debris_volume} />}
          </>
        )}

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