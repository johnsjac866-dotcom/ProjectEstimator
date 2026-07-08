import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pencil, Flag, AlertTriangle } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

function getCategory(data) {
  if (data.planting_type === "Trees & Shrubs") return "Planting - Trees & Shrubs";
  if (data.planting_type === "Annuals") return "Planting - Annuals";
  if (data.planting_type === "Bulbs") return "Planting - Bulbs";
  if (data.planting_type === "Perennials") {
    const hasLarge = (data.large_plants || []).some(p => p.count && Number(p.count) > 0);
    const hasSmall = (data.small_plants || []).some(p => p.count && Number(p.count) > 0);
    if (hasLarge && hasSmall) return "Planting - Large Perennials / Planting - Small Perennials";
    if (hasLarge) return "Planting - Large Perennials";
    if (hasSmall) return "Planting - Small Perennials";
    return "Planting - Perennials";
  }
  return null;
}

function SummaryRow({ label, value, unit, flagSet, flagKey }) {
  const hasVal = value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
  const isFlagged = flagKey && flagSet.has(flagKey);
  return (
    <div className={`flex items-start gap-2 text-sm py-1.5 ${isFlagged ? 'bg-orange-50 rounded px-2 -mx-2' : ''}`}>
      {isFlagged ? (
        <Flag className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
      )}
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium ${!hasVal && isFlagged ? 'text-orange-600 italic' : !hasVal ? 'text-muted-foreground/50 italic' : ''}`}>
        {hasVal ? (unit ? `${String(value)} ${unit}` : String(value)) : isFlagged ? 'Missing — needs review' : '— not set'}
      </span>
    </div>
  );
}

function PlantListSection({ title, plants, flagSet, flagKey }) {
  const hasPlants = plants && plants.length > 0;
  const isFlagged = flagSet.has(flagKey);
  if (!hasPlants && !isFlagged) return null;
  return (
    <div className={`rounded-lg p-3 ${isFlagged ? 'bg-orange-50 border border-orange-200' : 'border'}`}>
      <div className="flex items-center gap-2 mb-2">
        {isFlagged && <Flag className="h-3.5 w-3.5 text-orange-500" fill="currentColor" />}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      {hasPlants ? (
        <div className="space-y-1">
          {plants.map((plant, idx) => (
            <div key={plant.id || idx} className="flex items-start gap-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
              <span className="font-medium">{plant.name || plant.type || "Plant"}</span>
              {plant.count && <span className="text-muted-foreground">× {plant.count}</span>}
              {plant.size && <span className="text-muted-foreground">— {plant.size}</span>}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm font-medium text-orange-600 italic">Missing — needs review</p>
      )}
    </div>
  );
}

const TREE_SHRUB_FIELDS = [
  { k: "mycorrhizae_tablets", l: "Mycorrhizae Tablets", unit: "count" },
  { k: "hand_vs_machine", l: "Excavation: Hand or Machine" },
  { k: "machine_type", l: "Machine Type", show: d => d.hand_vs_machine === "Machine" },
  { k: "ball_cart", l: "Ball Cart" },
  { k: "tree_sling", l: "Tree Sling" },
  { k: "tree_boom", l: "Tree Boom" },
  { k: "ramps", l: "Ramps", unit: "count" },
  { k: "stake_kit", l: "Stake Kit" },
  { k: "cage", l: "Cage" },
  { k: "mulch_ring", l: "Mulch Ring" },
  { k: "haul_off_debris", l: "Haul Off Debris" },
  { k: "watering_hours", l: "Watering Hours", unit: "hrs" },
  { k: "watering_days", l: "Watering Days", unit: "days" },
  { k: "water_access", l: "Water Access" },
  { k: "delivery_by", l: "Delivery By" },
  { k: "box_truck", l: "Box Truck" },
  { k: "flatbed", l: "Flatbed" },
  { k: "forklift", l: "Forklift" },
];

const PERENNIAL_FIELDS = [
  { k: "large_spacing", l: "Large Perennial Spacing", show: d => (d.large_plants || []).length > 0 },
  { k: "small_spacing", l: "Small Perennial Spacing", show: d => (d.small_plants || []).length > 0 },
  { k: "bed_condition", l: "Bed Condition" },
  { k: "mycorrhizae_tablets", l: "Mycorrhizae Tablets", unit: "count" },
  { k: "watering_hours", l: "Time for Watering", unit: "hrs" },
  { k: "water_access", l: "Water Access" },
];

const BULB_FIELDS = [
  { k: "mulched_soil", l: "Mulched Soil" },
  { k: "bulb_fertilizer", l: "Bulb Fertilizer" },
  { k: "milwaukee_drill", l: "Milwaukee Drill" },
  { k: "drill_auger", l: "Drill Auger" },
  { k: "bulb_plugger", l: "Bulb Plugger" },
  { k: "cut_weed_barrier", l: "Cut Weed Barrier" },
  { k: "watering_hours", l: "Time for Watering", unit: "hrs" },
  { k: "water_access", l: "Water Access" },
];

const ANNUAL_FIELDS = [
  { k: "watering_hours", l: "Time for Watering", unit: "hrs" },
  { k: "water_access", l: "Water Access" },
];

export default function PlantingSummary() {
  const { areaId } = useParams();
  const navigate = useNavigate();
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
      const ops = parseOps(a.planting_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const category = getCategory(data);
  const flagSet = new Set(data._flags || []);

  let typeFields = [];
  if (data.planting_type === "Trees & Shrubs") typeFields = TREE_SHRUB_FIELDS;
  else if (data.planting_type === "Perennials") typeFields = PERENNIAL_FIELDS;
  else if (data.planting_type === "Bulbs") typeFields = BULB_FIELDS;
  else if (data.planting_type === "Annuals") typeFields = ANNUAL_FIELDS;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/planting-wizard/${areaId}?opId=${opId || data.id}`)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
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

        {flagSet.size > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-200 text-orange-800 text-sm">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{flagSet.size} flagged item{flagSet.size !== 1 ? 's' : ''} need{flagSet.size === 1 ? 's' : ''} attention.</span>
            <span className="text-orange-600">Click Edit to go straight to the first flagged item.</span>
          </div>
        )}

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

        {/* Planting Type + Time */}
        <div className="text-sm flex flex-wrap gap-4">
          <span><span className="text-muted-foreground">Planting Type:</span>{" "}<span className="font-medium text-primary">{data.planting_type}</span></span>
          <span><span className="text-muted-foreground">Time Estimate:</span>{" "}<span className="font-medium">{data.time_estimate ? `${data.time_estimate} hrs` : '— not set'}</span></span>
        </div>

        {/* Plant Lists */}
        {data.planting_type === "Trees & Shrubs" && (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Plant Lists</h3>
            <PlantListSection title="Trees" plants={data.trees} flagSet={flagSet} flagKey="trees" />
            <PlantListSection title="Shrubs" plants={data.shrubs} flagSet={flagSet} flagKey="shrubs" />
          </div>
        )}
        {data.planting_type === "Perennials" && (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Plant Lists</h3>
            <PlantListSection title="Large Perennials" plants={data.large_plants} flagSet={flagSet} flagKey="large_plants" />
            <PlantListSection title="Small Perennials" plants={data.small_plants} flagSet={flagSet} flagKey="small_plants" />
          </div>
        )}
        {data.planting_type === "Bulbs" && (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Plant List</h3>
            <PlantListSection title="Bulbs" plants={data.bulbs} flagSet={flagSet} flagKey="bulbs" />
          </div>
        )}
        {data.planting_type === "Annuals" && (
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Plant List</h3>
            <PlantListSection title="Annuals" plants={data.annuals} flagSet={flagSet} flagKey="annuals" />
          </div>
        )}

        {/* All Type-Specific Fields */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details</h3>
          <div className="space-y-1">
            {typeFields.map(field => {
              const show = !field.show || field.show(data);
              if (!show) return null;
              return <SummaryRow key={field.k} flagKey={field.k} label={field.l} value={data[field.k]} unit={field.unit} flagSet={flagSet} />;
            })}
          </div>
        </div>

        {/* Additional Time Factors */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Additional Time Factors</h3>
          <div className="space-y-1">
            <SummaryRow flagKey="additional_time_rocky" label="Rocky Soil" value={data.additional_time_rocky} flagSet={flagSet} />
            <SummaryRow flagKey="additional_time_roots" label="Roots" value={data.additional_time_roots} flagSet={flagSet} />
          </div>
        </div>

        {/* Notes */}
        <div className="border rounded-lg p-4">
          <SummaryRow flagKey="notes" label="Notes" value={data.notes} flagSet={flagSet} />
        </div>
      </div>
    </div>
  );
}