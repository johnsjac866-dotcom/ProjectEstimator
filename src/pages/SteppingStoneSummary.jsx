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

export default function SteppingStoneSummary() {
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
      const ops = parseOps(a.stepping_stone_data);
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

  const stoneCountCalc = entry.lf ? Math.ceil(parseFloat(entry.lf) / 2) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>

      <div className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold">Pathway — Stepping Stones</h1>
        {project && <p className="text-sm text-muted-foreground mt-1">{project.name} — {area?.name}</p>}
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-3">
        <h2 className="font-semibold text-base mb-3">Pathway Details</h2>
        <Row label="Type" value={entry.pathway_type} />
        <Row label="Linear Feet (LF)" value={entry.lf} />

        <div className="pt-2 border-t" />
        <h2 className="font-semibold text-base">Stone</h2>
        <Row label="Stone Count (calculated)" value={stoneCountCalc} />
        <Row label="Stone Count (override)" value={entry.stone_count} />
        <Row label="Stone Type" value={entry.stone_type} />

        <div className="pt-2 border-t" />
        <h2 className="font-semibold text-base">Existing Stones</h2>
        <Row label="Existing stones on site" value={entry.existing_stones} />
        {entry.existing_stones === "Yes" && (
          <>
            <Row label="Releveling needed" value={entry.releveling} />
            <Row label="Additional stones needed" value={entry.additional_stones} />
          </>
        )}

        <div className="pt-2 border-t" />
        <h2 className="font-semibold text-base">Installation</h2>
        <Row label="Existing base" value={entry.existing_base} />
        <Row label="Machine needed" value={entry.machine} />
        <Row label="Time Estimate (hrs)" value={entry.time_estimate} />

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