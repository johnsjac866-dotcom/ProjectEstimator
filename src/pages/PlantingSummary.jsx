import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function getCategory(data) {
  if (data.planting_type === "Trees & Shrubs") return "Planting - Trees & Shrubs";
  if (data.planting_type === "Annuals") return "Planting - Annuals";
  if (data.planting_type === "Bulbs") return "Planting - Bulbs";
  if (data.planting_type === "Perennials") {
    const hasLarge = (data.large_plants || []).some(p => p.count && Number(p.count) > 0);
    const hasSmall = (data.small_plants || []).some(p => p.count && Number(p.count) > 0);
    // legacy support
    const hasLargeLegacy = data.large_count && Number(data.large_count) > 0;
    const hasSmallLegacy = data.small_count && Number(data.small_count) > 0;
    if ((hasLarge || hasLargeLegacy) && (hasSmall || hasSmallLegacy)) return "Planting - Large Perennials / Planting - Small Perennials";
    if (hasLarge || hasLargeLegacy) return "Planting - Large Perennials";
    if (hasSmall || hasSmallLegacy) return "Planting - Small Perennials";
    return "Planting - Perennials";
  }
  return null;
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="h-2 w-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  );
}

export default function PlantingSummary() {
  const { areaId } = useParams();
  const opId = new URLSearchParams(window.location.search).get("opId");
  const from = new URLSearchParams(window.location.search).get("from");
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
      const ops = parseOps(a.planting_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const category = getCategory(data);

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
          <h1 className="text-2xl font-bold">Planting Summary</h1>
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
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-teal-50 border border-teal-200 text-teal-800">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
              {category}
            </div>
          </div>
        )}

        {/* Planting Type */}
        <div className="text-sm">
          <span className="text-muted-foreground">Planting Type:</span>{" "}
          <span className="font-medium text-primary">{data.planting_type}</span>
        </div>

        {/* Trees & Shrubs — plant list */}
        {data.planting_type === "Trees & Shrubs" && (data.plants || []).length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Plants</h3>
            <div className="space-y-2">
              {data.plants.map((plant, idx) => (
                <div key={plant.id || idx} className="flex items-start gap-2 text-sm">
                  <span className="h-2 w-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
                  <span className="font-medium">{plant.type || "Plant"}</span>
                  {plant.count && <span className="text-muted-foreground">× {plant.count}</span>}
                  {plant.size && <span className="text-muted-foreground">— {plant.size}</span>}
                </div>
              ))}
            </div>
            {data.hand_vs_machine && (
              <div className="mt-3 pt-3 border-t">
                <Row label="Hand vs Machine" value={data.hand_vs_machine} />
              </div>
            )}
          </div>
        )}

        {/* Perennials */}
        {data.planting_type === "Perennials" && (
          <div className="border rounded-lg p-4 space-y-4">
            {/* Large */}
            {(data.large_plants || []).length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Large Perennials</h3>
                <div className="space-y-1">
                  {data.large_plants.map((plant, idx) => (
                    <div key={plant.id || idx} className="flex items-start gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
                      <span className="font-medium">{plant.name || "Plant"}</span>
                      {plant.count && <span className="text-muted-foreground">× {plant.count}</span>}
                    </div>
                  ))}
                </div>
                {data.large_spacing && <p className="text-sm text-muted-foreground mt-2">Spacing: {data.large_spacing}</p>}
              </div>
            )}
            {/* Legacy support */}
            {!data.large_plants && data.large_count && <Row label="Large Perennials — Count" value={data.large_count} />}
            {/* Small */}
            {(data.small_plants || []).length > 0 && (
              <div className={(data.large_plants || []).length > 0 ? "pt-3 border-t" : ""}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Small Perennials</h3>
                <div className="space-y-1">
                  {data.small_plants.map((plant, idx) => (
                    <div key={plant.id || idx} className="flex items-start gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
                      <span className="font-medium">{plant.name || "Plant"}</span>
                      {plant.count && <span className="text-muted-foreground">× {plant.count}</span>}
                    </div>
                  ))}
                </div>
                {data.small_spacing && <p className="text-sm text-muted-foreground mt-2">Spacing: {data.small_spacing}</p>}
              </div>
            )}
            {/* Legacy support */}
            {!data.small_plants && data.small_count && <Row label="Small Perennials — Count" value={data.small_count} />}
            {data.bed_condition && <div className="pt-3 border-t"><Row label="Bed Condition" value={data.bed_condition} /></div>}
          </div>
        )}

        {/* Bulbs / Annuals */}
        {(data.planting_type === "Bulbs" || data.planting_type === "Annuals") && data.count && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
            <div className="space-y-2">
              <Row label="Count" value={data.count} />
            </div>
          </div>
        )}

        {/* Shared details */}
        {(data.additional_time_rocky || data.additional_time_roots || data.delivery_method || data.water_access) && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Logistics</h3>
            <div className="space-y-2">
              {data.additional_time_rocky === "Yes" && <Row label="Additional Time — Rocky Soil" value="Yes" />}
              {data.additional_time_roots === "Yes" && <Row label="Additional Time — Roots" value="Yes" />}
              <Row label="Delivery Method" value={data.delivery_method} />
              <Row label="Water Access" value={data.water_access} />
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