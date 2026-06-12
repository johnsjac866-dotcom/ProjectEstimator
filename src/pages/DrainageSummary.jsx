import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const CATEGORY_MAP = {
  "Buried Downspout": "Drainage - Buried Downspout",
  "Buried Drain":     "Drainage - Buried Drain with Miter Drain",
  "Buried Sump Line": "Drainage - Buried Sump Line with Miter Drain",
  "Curtain Drain":    "Drainage - Curtain Drain",
  "French Drain":     "Drainage - French Drain",
  "Dry Stream Bed":   "Drainage - Dry Stream Bed",
};

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  );
}

export default function DrainageSummary() {
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
      const ops = parseOps(a.drainage_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const category = CATEGORY_MAP[data.drain_type];
  const isPipe = ["Buried Downspout", "Buried Drain", "Buried Sump Line"].includes(data.drain_type);
  const isFilter = ["Curtain Drain", "French Drain"].includes(data.drain_type);
  const isStream = data.drain_type === "Dry Stream Bed";

  const totalBends = (parseFloat(data["bends_22.5°"]) || 0) + (parseFloat(data["bends_30°"]) || 0) + (parseFloat(data["bends_45°"]) || 0);

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
          <h1 className="text-2xl font-bold">Drainage Summary</h1>
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
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-blue-50 border border-blue-200 text-blue-800">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {category}
            </div>
          </div>
        )}

        {/* Type */}
        <div className="text-sm flex flex-wrap gap-4">
          <span><span className="text-muted-foreground">Drain Type:</span>{" "}<span className="font-medium text-primary">{data.drain_type}</span></span>
          {data.time_estimate && <span><span className="text-muted-foreground">Time Estimate:</span>{" "}<span className="font-medium">{data.time_estimate} hrs</span></span>}
        </div>

        {/* Measurements */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements</h3>
          <div className="space-y-2">
            <Row label="Linear Feet" value={data.lf ? `${data.lf} LF` : null} />
            {isStream && <Row label="Width" value={data.width ? `${data.width} ft` : null} />}
            {isStream && <Row label="Depth" value={data.stream_depth ? `${data.stream_depth} in` : null} />}
            {isStream && data.sf && <Row label="Square Footage" value={`${data.sf} SF`} />}
            {(isPipe || isFilter) && <Row label="Pipe Size" value={data.pipe_size ? `${data.pipe_size} in` : null} />}
          </div>
        </div>

        {/* Excavation */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Excavation</h3>
          <div className="space-y-2">
            <Row label="Excavation Depth" value={data.excavation_depth ? `${data.excavation_depth} in` : null} />
            <Row label="Spoil Type" value={data.spoil_type} />
            {data.spoil_type === "Hauled off" && <Row label="Disposal Site" value={data.disposal_site} />}
            {data.excavCY && <Row label="Excavation Volume" value={`${data.excavCY} CY`} />}
          </div>
        </div>

        {/* Existing + Bends + Specifics */}
        {(isPipe || isFilter || isStream) && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
            <div className="space-y-2">
              {isPipe && <Row label="Existing Downspout" value={data.existing_downspout} />}
              {isPipe && data.existing_downspout === "Yes" && <Row label="Existing LF" value={data.existing_lf ? `${data.existing_lf} LF` : null} />}
              {isFilter && <Row label="Existing Drain" value={data.existing_drain} />}
              {isFilter && data.existing_drain === "Yes" && <Row label="Existing LF" value={data.existing_lf ? `${data.existing_lf} LF` : null} />}
              {isStream && <Row label="Existing Downspout" value={data.existing_downspout} />}
              {isStream && data.existing_downspout === "Yes" && <Row label="Existing LF" value={data.existing_lf ? `${data.existing_lf} LF` : null} />}
              {data["bends_22.5°"] && <Row label="Bends 22.5°" value={data["bends_22.5°"]} />}
              {data["bends_30°"] && <Row label="Bends 30°" value={data["bends_30°"]} />}
              {data["bends_45°"] && <Row label="Bends 45°" value={data["bends_45°"]} />}
              {isPipe && <Row label="Miter Drain" value={data.miter_drain} />}
              {isPipe && data.miter_drain === "Yes" && <Row label="Miter Drain Count" value={data.miter_drain_count} />}
              {isFilter && <Row label="Stone Needed" value={data.stone_needed} />}
              {isFilter && data.stoneCY && <Row label="Stone Volume" value={`${data.stoneCY} CY`} />}
              {isFilter && <Row label="Fabric Needed" value={data.fabric_needed} />}
              {isFilter && data.fabric_needed === "Yes" && <Row label="Fabric Amount" value={data.fabric_sf ? `${data.fabric_sf} SF` : null} />}
              {isStream && <Row label="Stone Type" value={data.stone_type} />}
              {isStream && data.streamStoneCY && <Row label="Stone Volume" value={`${data.streamStoneCY} CY`} />}
              {isStream && <Row label="Purpose" value={data.stream_purpose} />}
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