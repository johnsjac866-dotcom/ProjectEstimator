import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { ArrowLeft, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="text-muted-foreground min-w-[200px]">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default function SteppingStoneSummary() {
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
      const ops = parseOps(a.stepping_stone_data);
      setEntry(opId ? ops.find(o => o.id === opId) : ops[0]);
      if (a.project_id) {
        const p = await OfflineProjects.get(a.project_id);
        setProject(p);
      }
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!entry) return <div className="text-center py-20 text-muted-foreground">No entry found</div>;

  const isSteps = entry.sub_type === "Hardscape - Steps";
  const stoneCountCalc = !isSteps && entry.lf ? Math.ceil(parseFloat(entry.lf) / 2) : null;
  const stepSF = isSteps ? ((parseFloat(entry.step_length) || 0) * (parseFloat(entry.step_width) || 0)) || null : null;
  const landingSF = isSteps && entry.landing_needed === "Yes"
    ? ((parseFloat(entry.landing_length) || 0) * (parseFloat(entry.landing_width) || 0)) || null
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <Button variant="outline" size="sm" onClick={() => navigate(`/stepping-stone-wizard/${areaId}?opId=${opId || entry.id}`)}>
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
        <h1 className="text-2xl font-bold">Pathway / Steps — {entry.sub_type || "Stepping Stones"}</h1>
        {project && <p className="text-sm text-muted-foreground mt-1">{project.name} — {area?.name}</p>}
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-3">

        {/* STEPPING STONES */}
        {!isSteps && (
          <>
            <h2 className="font-semibold text-base mb-3">Pathway Details</h2>
            <Row label="Linear Feet (LF)" value={entry.lf} />
            <div className="pt-2 border-t" />
            <h2 className="font-semibold text-base">Stone</h2>
            <Row label="Stone Count (calculated)" value={stoneCountCalc} />
            <Row label="Stone Count (override)" value={entry.stone_count} />
            <Row label="Stone Type" value={entry.stone_type} />
            <Row label="Stone Size" value={entry.stone_size} />
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
          </>
        )}

        {/* HARDSCAPE - STEPS */}
        {isSteps && (
          <>
            <h2 className="font-semibold text-base mb-3">Step Details</h2>
            <Row label="Count (# of steps)" value={entry.step_count} />
            <Row label="Material" value={entry.step_material} />
            <Row label="Length (ft)" value={entry.step_length} />
            <Row label="Width (ft)" value={entry.step_width} />
            {stepSF && <Row label="Steps SF (calculated)" value={`${stepSF.toFixed(1)} SF`} />}

            <div className="pt-2 border-t" />
            <h2 className="font-semibold text-base">Landing</h2>
            <Row label="Landing Needed" value={entry.landing_needed} />
            {entry.landing_needed === "Yes" && (
              <>
                <Row label="Landing Length (ft)" value={entry.landing_length} />
                <Row label="Landing Width (ft)" value={entry.landing_width} />
                {landingSF && <Row label="Landing SF (calculated)" value={`${landingSF.toFixed(1)} SF`} />}
              </>
            )}

            <div className="pt-2 border-t" />
            <h2 className="font-semibold text-base">Machine Access</h2>
            <Row label="Machine" value={entry.machine} />
          </>
        )}

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