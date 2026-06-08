import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-1.5 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[60%]">{value}</span>
    </div>
  );
}

export default function BouldersSummary() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const opId = new URLSearchParams(window.location.search).get("opId");
  const from = new URLSearchParams(window.location.search).get("from");
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      const p = await base44.entities.Project.get(a.project_id);
      setProject(p);
      const ops = parseOps(a.boulders_data);
      const found = ops.find(o => o.id === opId);
      setEntry(found || ops[0] || null);
    })();
  }, [areaId, opId]);

  if (!entry) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const subType = entry.sub_type || "";

  return (
    <div className="max-w-lg">
      <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">Boulders/Accents & Structures</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{project?.name} — {area?.name}</p>
          <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">{subType}</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate(`/boulders-wizard/${areaId}?opId=${entry.id}`)}>
          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
        </Button>
      </div>

      <div className="rounded-xl border p-4 space-y-0.5">
        {subType === "Boulders / Accents" && (
          <>
            <Row label='Count 24" – 30"' value={entry.count_24_30} />
            <Row label='Count 18" – 24"' value={entry.count_18_24} />
            <Row label='Count 12" – 18"' value={entry.count_12_18} />
            <Row label="Color Preference" value={entry.color_preference} />
            <Row label="Machine Access" value={entry.machine_access} />
            <Row label="Constraints / Hazards" value={entry.constraints} />
          </>
        )}

        {subType === "Structures - Fence" && (
          <>
            <Row label="Linear Feet" value={entry.lf ? `${entry.lf} LF` : null} />
            <Row label="Height" value={entry.height ? `${entry.height} ft` : null} />
            <Row label="Gate Count" value={entry.gate_count} />
            <Row label="Gate Width" value={entry.gate_width ? `${entry.gate_width} ft` : null} />
            <Row label="Material" value={entry.material} />
            <Row label="Post Spacing" value={entry.post_spacing ? `${entry.post_spacing} ft` : null} />
            <Row label="Machine Access" value={entry.machine_access} />
          </>
        )}

        {subType === "Structures - Arbor" && (
          <>
            <Row label="Count" value={entry.count} />
            <Row label="Height" value={entry.height ? `${entry.height} ft` : null} />
            <Row label="Width" value={entry.width ? `${entry.width} ft` : null} />
            <Row label="Footing Size / Depth" value={entry.footing} />
            <Row label="Material" value={entry.material} />
            <Row label="Machine Access" value={entry.machine_access} />
          </>
        )}

        {subType === "Raised Garden Bed" && (
          <>
            <Row label="Material" value={entry.material} />
            <Row label="Quantity" value={entry.quantity} />
            <Row label="Length" value={entry.length ? `${entry.length} ft` : null} />
            <Row label="Width" value={entry.width ? `${entry.width} ft` : null} />
            <Row label="Total SF" value={entry.total_sf ? `${entry.total_sf} SF` : null} />
            <Row label="Soil Depth" value={entry.soil_depth ? `${entry.soil_depth} in` : null} />
            <Row label="Soil Volume" value={entry.total_cy ? `${entry.total_cy} CY` : null} />
            <Row label="Base Level?" value={entry.base_level} />
            <Row label="Machine Access" value={entry.machine_access} />
          </>
        )}

        {entry.notes && <Row label="Notes" value={entry.notes} />}
      </div>
    </div>
  );
}