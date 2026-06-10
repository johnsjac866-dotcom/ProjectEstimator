import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const CATEGORY_MAP = {
  "Sod Installation": "Lawn Repair & Install - Sod Installation",
  "Seed Install":     "Lawn Repair & Install - Seed",
  "Top Dress Lawn":   "Lawn Repair & Install - Top Dress Lawn",
};

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="h-2 w-2 rounded-full bg-lime-500 flex-shrink-0 mt-1.5" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  );
}

export default function LawnSummary() {
  const { areaId } = useParams();
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
      const ops = parseOps(a.lawn_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const category = CATEGORY_MAP[data.lawn_type];
  const isSod = data.lawn_type === "Sod Installation";
  const isSeed = data.lawn_type === "Seed Install";
  const isTopDress = data.lawn_type === "Top Dress Lawn";

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Lawn Repair & Install Summary</h1>
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
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-lime-50 border border-lime-200 text-lime-800">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
              {category}
            </div>
          </div>
        )}

        {/* Type */}
        <div className="text-sm">
          <span className="text-muted-foreground">Type:</span>{" "}
          <span className="font-medium text-primary">{data.lawn_type}</span>
        </div>

        {/* Measurements */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements</h3>
          <div className="space-y-2">
            <Row label="Length" value={data.length ? `${data.length} ft` : null} />
            <Row label="Width" value={data.width ? `${data.width} ft` : null} />
            <Row label="Square Footage" value={data.sf ? `${data.sf} SF` : null} />
            {isSod && <Row label="Rolls Needed" value={data.rolls ? `${data.rolls} rolls` : null} />}
            {isSod && <Row label="Pins Needed" value={data.pins ? `${data.pins} pins` : null} />}
            {isSod && data.sf_waste && <Row label="SF Extra for Waste" value={`${data.sf_waste} SF`} />}
          </div>
        </div>

        {/* Type-specific details */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
          <div className="space-y-2">
            {isSod && (
              <>
                <Row label="Fertilizer" value={data.fertilizer} />
                {data.fertilizer === "Yes" && <Row label="Fertilizer SF" value={data.fertilizer_sf_override ? `${data.fertilizer_sf_override} SF` : `${data.sf} SF`} />}
                <Row label="Distance to Truck" value={data.distance_to_truck ? `${data.distance_to_truck} ft` : null} />
                <Row label="Machine Access" value={data.machine_access} />
                <Row label="Sod Type" value={data.sod_type} />
                <Row label="Water Access" value={data.water_access} />
              </>
            )}
            {isSeed && (
              <>
                <Row label="Fertilizer" value={data.fertilizer} />
                {data.fertilizer === "Yes" && <Row label="Fertilizer SF" value={data.fertilizer_sf_override ? `${data.fertilizer_sf_override} SF` : `${data.sf} SF`} />}
                <Row label="Seed Type" value={data.seed_type} />
                <Row label="Cover Method" value={data.cover_method} />
                <Row label="Water Access" value={data.water_access} />
                <Row label="Bed Preparation Needed" value={data.bed_prep_needed} />
              </>
            )}
            {isTopDress && (
              <>
                <Row label="Top Dress Depth" value={data.top_dress_depth ? `${data.top_dress_depth} in` : null} />
                <Row label="Material" value={data.material} />
                <Row label="Overseed" value={data.overseed} />
                <Row label="Aerate" value={data.aerate} />
              </>
            )}
          </div>
        </div>

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