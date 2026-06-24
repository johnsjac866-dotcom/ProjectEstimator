import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pencil, Flag, AlertTriangle } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const CATEGORY_MAP = {
  "Sod Installation": "Lawn Repair & Install - Sod Installation",
  "Seed Install":     "Lawn Repair & Install - Seed",
  "Top Dress Lawn":   "Lawn Repair & Install - Top Dress Lawn",
};

const SOD_FIELDS = [
  { k: "time_estimate", l: "Time Estimate", unit: "hrs" },
  { k: "length", l: "Length", unit: "ft" },
  { k: "width", l: "Width", unit: "ft" },
  { k: "on_slope", l: "On a Slope" },
  { k: "sf_waste", l: "SF Extra for Waste", unit: "SF" },
  { k: "diff_easy_hours", l: "Easy Difficulty", unit: "hrs" },
  { k: "diff_avg_hours", l: "Average Difficulty", unit: "hrs" },
  { k: "diff_hard_hours", l: "Hard Difficulty", unit: "hrs" },
  { k: "diff_very_hard_hours", l: "Very Hard / Patching", unit: "hrs" },
  { k: "sod_staples_needed", l: "Sod Staples Needed" },
  { k: "sod_staples_count", l: "Sod Staples Count", show: d => d.sod_staples_needed === "Yes" },
  { k: "pallets_needed", l: "Pallets Needed" },
  { k: "pallets_count", l: "Pallets Count", show: d => d.pallets_needed === "Yes" },
  { k: "watering_on_install", l: "Watering Upon Installation" },
  { k: "water_access", l: "Water Access", show: d => d.watering_on_install === "Yes" },
  { k: "watering_time_hours", l: "Watering Time", unit: "hrs", show: d => d.watering_on_install === "Yes" },
  { k: "fertilizer", l: "Fertilizer" },
  { k: "fertilizer_sf_override", l: "Fertilizer SF", unit: "SF", show: d => d.fertilizer === "Yes" },
  { k: "distance_to_truck", l: "Distance to Truck", unit: "ft" },
  { k: "machine_access", l: "Machine Access" },
  { k: "sod_type", l: "Sod Type" },
];

const SEED_FIELDS = [
  { k: "time_estimate", l: "Time Estimate", unit: "hrs" },
  { k: "length", l: "Length", unit: "ft" },
  { k: "width", l: "Width", unit: "ft" },
  { k: "sf_seed", l: "Area to Seed", unit: "SF" },
  { k: "seed_type", l: "Seed Type" },
  { k: "seed_lbs", l: "Seed Amount", unit: "lbs" },
  { k: "extra_seed", l: "Extra Seed to Match" },
  { k: "cover_method", l: "Cover Method" },
  { k: "mulch_bags", l: "Mulch Bags", show: d => d.cover_method === "Mulch Pellet" },
  { k: "mulch_buckets", l: "Mulch Buckets", show: d => d.cover_method === "Mulch Pellet" },
  { k: "straw_mat_type", l: "Straw Mat Type", show: d => d.cover_method === "Straw Netting" },
  { k: "straw_rolls", l: "Straw Rolls", show: d => d.cover_method === "Straw Netting" },
  { k: "straw_sod_staples", l: "Straw Sod Staples", show: d => d.cover_method === "Straw Netting" },
  { k: "temp_downspout_needed", l: "Temp Downspout Extensions" },
  { k: "temp_downspout_lf", l: "Downspout Extension LF", unit: "LF", show: d => d.temp_downspout_needed === "Yes" },
  { k: "water_access", l: "Water Access" },
  { k: "fertilizer", l: "Fertilizer" },
  { k: "bed_prep_needed", l: "Bed Preparation Needed" },
];

const TOP_DRESS_FIELDS = [
  { k: "time_estimate", l: "Time Estimate", unit: "hrs" },
  { k: "length", l: "Length", unit: "ft" },
  { k: "width", l: "Width", unit: "ft" },
  { k: "top_dress_depth", l: "Top Dress Depth", unit: "in" },
  { k: "material", l: "Material" },
  { k: "overseed", l: "Overseed" },
  { k: "aerate", l: "Aerate" },
];

const TYPE_FIELDS = {
  "Sod Installation": SOD_FIELDS,
  "Seed Install": SEED_FIELDS,
  "Top Dress Lawn": TOP_DRESS_FIELDS,
};

function SummaryRow({ field, data, flagSet }) {
  const show = !field.show || field.show(data);
  if (!show) return null;
  const value = data[field.k];
  const hasVal = value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
  const isFlagged = flagSet.has(field.k);
  return (
    <div className={`flex items-start gap-2 text-sm py-1.5 ${isFlagged ? 'bg-orange-50 rounded px-2 -mx-2' : ''}`}>
      {isFlagged ? (
        <Flag className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-lime-500 flex-shrink-0 mt-1.5" />
      )}
      <span className="text-muted-foreground min-w-0">{field.l}:</span>
      <span className={`font-medium ${!hasVal ? 'text-muted-foreground/50 italic' : ''}`}>
        {hasVal ? (field.unit ? `${String(value)} ${field.unit}` : String(value)) : '— not set'}
      </span>
    </div>
  );
}

export default function LawnSummary() {
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
      const ops = parseOps(a.lawn_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const category = CATEGORY_MAP[data.lawn_type];
  const fields = TYPE_FIELDS[data.lawn_type] || [];
  const flagSet = new Set(data._flags || []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/lawn-wizard/${areaId}?opId=${data.id}`)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Lawn Repair &amp; Install Summary</h1>
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
            <span className="font-medium">{flagSet.size} flagged item{flagSet.size !== 1 ? 's' : ''} need{flagSet.size === 1 ? 's' : ''} attention</span>
          </div>
        )}

        {category && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Estimate Category</h2>
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-lime-50 border border-lime-200 text-lime-800">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-500" />
              {category}
            </div>
          </div>
        )}

        <div className="text-sm">
          <span className="text-muted-foreground">Type:</span>{" "}
          <span className="font-medium text-primary">{data.lawn_type}</span>
        </div>

        {/* Calculations */}
        {data.sf && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Calculations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.sf && <div className="text-sm"><p className="text-xs text-muted-foreground">Square Footage</p><p className="font-bold text-lg">{data.sf} SF</p></div>}
              {data.rolls && <div className="text-sm bg-lime-50 border border-lime-200 rounded-lg p-2"><p className="text-xs text-lime-700 font-semibold">Rolls</p><p className="font-bold text-lg text-lime-800">{data.rolls}</p></div>}
              {data.pins && <div className="text-sm bg-lime-50 border border-lime-200 rounded-lg p-2"><p className="text-xs text-lime-700 font-semibold">Pins</p><p className="font-bold text-lg text-lime-800">{data.pins}</p></div>}
            </div>
          </div>
        )}

        {/* All fields */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">All Fields</h3>
          <div className="space-y-1">
            {fields.map(field => <SummaryRow key={field.k} field={field} data={data} flagSet={flagSet} />)}
          </div>
        </div>

        {/* Notes */}
        <div className="border rounded-lg p-4">
          <SummaryRow field={{ k: "notes", l: "Notes" }} data={data} flagSet={flagSet} />
        </div>
      </div>
    </div>
  );
}