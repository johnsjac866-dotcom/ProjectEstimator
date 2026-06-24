import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pencil, Flag, AlertTriangle } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const CATEGORY_MAP = {
  "Buried Downspout": "Drainage - Buried Downspout",
  "Buried Drain": "Drainage - Buried Drain with Miter Drain",
  "Buried Sump Line": "Drainage - Buried Sump Line with Miter Drain",
  "Curtain Drain": "Drainage - Curtain Drain",
  "French Drain": "Drainage - French Drain",
  "Dry Stream Bed": "Drainage - Dry Stream Bed",
  "Impervious Membrane": "Drainage - Impervious Membrane Below Drainage Rock",
};

const EXCAVATION_FIELDS = [
  { k: "excavation_mode", l: "Excavation Method" },
  { k: "excavation_machine_type", l: "Machine Type", show: d => d.excavation_mode === "Machine" },
  { k: "trencher_attachment", l: "Trencher/Excavator Attachment" },
  { k: "excavation_depth", l: "Excavation Depth", unit: "in" },
  { k: "soil_composition", l: "Soil Type", fmt: v => Array.isArray(v) ? v.join(", ") : (v || "") },
  { k: "spoil_type", l: "Spoil Disposal" },
  { k: "disposal_site", l: "Disposal Site", show: d => d.spoil_type === "Hauled off" },
  { k: "sod_removal", l: "Sod Removal" },
  { k: "sod_disposal_method", l: "Sod Disposal Method", show: d => d.sod_removal === "Yes" && d.drain_type === "Curtain Drain" },
  { k: "obstruction_hours", l: "Obstruction Time", unit: "hrs" },
  { k: "zip_level", l: "Zip Level Needed" },
];

const PVC_FITTING_FIELDS = [
  { k: "pvc_supplies_needed", l: "PVC Glue/Primer/Supplies" },
  { k: "pvc_supplies_count", l: "PVC Supplies Count", show: d => d.pvc_supplies_needed === "Yes" },
  { k: "pvc_fittings_needed", l: "PVC Fittings Needed" },
  { k: "fit_90_long_turn", l: "90° Long Turn", show: d => d.pvc_fittings_needed === "Yes" },
  { k: "fit_90_tight", l: "Std 90° Tight", show: d => d.pvc_fittings_needed === "Yes" },
  { k: "fit_22_5_elbow", l: "22.5° Elbow", show: d => d.pvc_fittings_needed === "Yes" },
  { k: "fit_hub_45_elbow", l: "Hub 45° Elbow", show: d => d.pvc_fittings_needed === "Yes" },
  { k: "fit_tee", l: "Tee", show: d => d.pvc_fittings_needed === "Yes" },
  { k: "fit_wye", l: "Wye", show: d => d.pvc_fittings_needed === "Yes" },
  { k: "fit_cleanout", l: "Cleanout Assembly", show: d => d.pvc_fittings_needed === "Yes" },
];

const TYPE_FIELDS = {
  "Buried Downspout": [
    { k: "pipe_size", l: "Pipe Size", unit: "in" },
    { k: "existing_downspout", l: "Existing Downspout" },
    { k: "existing_lf", l: "Existing LF", unit: "LF", show: d => d.existing_downspout === "Yes" },
    ...EXCAVATION_FIELDS,
    ...PVC_FITTING_FIELDS,
    { k: "downspout_connection_needed", l: "Downspout Connection Assembly" },
    { k: "downspout_connection_size", l: "Connection Size", show: d => d.downspout_connection_needed === "Yes" },
    { k: "downspout_connection_count", l: "Connection Count", show: d => d.downspout_connection_needed === "Yes" },
    { k: "catch_basin_needed", l: "Catch Basin Needed" },
    { k: "catch_basin_size", l: "Catch Basin Size", show: d => d.catch_basin_needed === "Yes" },
    { k: "catch_basin_count", l: "Catch Basin Count", show: d => d.catch_basin_needed === "Yes" },
    { k: "miter_drain", l: "Miter Drain Needed" },
    { k: "miter_drain_type", l: "Miter Drain Type", show: d => d.miter_drain === "Yes" },
    { k: "miter_drain_count", l: "Miter Drain Count", show: d => d.miter_drain === "Yes" },
    { k: "lawn_repair", l: "Lawn Repair Needed" },
  ],
  "Buried Drain": [
    { k: "pipe_size", l: "Pipe Size", unit: "in" },
    { k: "existing_drain", l: "Existing Drain" },
    { k: "existing_lf", l: "Existing LF", unit: "LF", show: d => d.existing_drain === "Yes" },
    ...EXCAVATION_FIELDS,
    { k: "catch_basin_needed", l: "Catch Basin Needed" },
    { k: "catch_basin_size", l: "Catch Basin Size", show: d => d.catch_basin_needed === "Yes" },
    { k: "catch_basin_count", l: "Catch Basin Count", show: d => d.catch_basin_needed === "Yes" },
    { k: "atrium_drain_needed", l: "Atrium Drain Needed" },
    { k: "atrium_drain_count", l: "Atrium Drain Count", show: d => d.atrium_drain_needed === "Yes" },
    ...PVC_FITTING_FIELDS,
    { k: "miter_drain", l: "Miter Drain Needed" },
    { k: "miter_drain_type", l: "Miter Drain Type", show: d => d.miter_drain === "Yes" },
    { k: "miter_drain_count", l: "Miter Drain Count", show: d => d.miter_drain === "Yes" },
    { k: "lawn_repair", l: "Lawn Repair Needed" },
  ],
  "Buried Sump Line": [
    { k: "pipe_size", l: "Pipe Size", unit: "in" },
    { k: "existing_downspout", l: "Existing Downspout" },
    { k: "existing_lf", l: "Existing LF", unit: "LF", show: d => d.existing_downspout === "Yes" },
    ...EXCAVATION_FIELDS,
    ...PVC_FITTING_FIELDS,
    { k: "freezedrain_needed", l: "Freezedrain Assembly" },
    { k: "freezedrain_count", l: "Freezedrain Count", show: d => d.freezedrain_needed === "Yes" },
    { k: "miter_drain", l: "Miter Drain Needed" },
    { k: "miter_drain_type", l: "Miter Drain Type", show: d => d.miter_drain === "Yes" },
    { k: "miter_drain_count", l: "Miter Drain Count", show: d => d.miter_drain === "Yes" },
    { k: "topsoil_needed", l: "Topsoil/Screened Soil" },
    { k: "topsoil_cy", l: "Topsoil CY", unit: "CY", show: d => d.topsoil_needed === "Yes" },
    { k: "lawn_repair", l: "Lawn Repair Needed" },
  ],
  "Curtain Drain": [
    { k: "pipe_size", l: "Pipe Size", unit: "in" },
    { k: "existing_drain", l: "Existing Drain" },
    { k: "existing_lf", l: "Existing LF", unit: "LF", show: d => d.existing_drain === "Yes" },
    ...EXCAVATION_FIELDS,
    { k: "stone_needed", l: "Stone Needed" },
    { k: "fabric_needed", l: "Fabric Needed" },
    { k: "fabric_sf", l: "Fabric Amount", unit: "SF", show: d => d.fabric_needed === "Yes" },
  ],
  "French Drain": [
    { k: "pipe_size", l: "Pipe Size", unit: "in" },
    { k: "existing_drain", l: "Existing Drain" },
    { k: "existing_lf", l: "Existing LF", unit: "LF", show: d => d.existing_drain === "Yes" },
    ...EXCAVATION_FIELDS,
    { k: "corrugated_tile_needed", l: "Corrugated Drain Tile" },
    { k: "tile_perforated_sock_count", l: "Perforated in Sock", show: d => d.corrugated_tile_needed === "Yes" },
    { k: "tile_solid_count", l: "Solid Tile", show: d => d.corrugated_tile_needed === "Yes" },
    { k: "pvc_cleanout_needed", l: "PVC Cleanout Assembly" },
    { k: "pvc_cleanout_count", l: "Cleanout Count", show: d => d.pvc_cleanout_needed === "Yes" },
    { k: "misc_drainage_needed", l: "Misc Drainage Material" },
    { k: "misc_drainage_notes", l: "Misc Drainage Description", show: d => d.misc_drainage_needed === "Yes" },
    { k: "coarse_sand_needed", l: "Coarse/Washed Sand" },
    { k: "coarse_sand_tons", l: "Sand Tons", unit: "tons", show: d => d.coarse_sand_needed === "Yes" },
    { k: "drainage_rock_needed", l: 'Drainage Rock 1.5"' },
    { k: "drainage_rock_tons", l: "Drainage Rock Tons", unit: "tons", show: d => d.drainage_rock_needed === "Yes" },
    { k: "stone_needed", l: "Stone Needed" },
    { k: "fabric_needed", l: "Fabric Needed" },
    { k: "fabric_sf", l: "Fabric Amount", unit: "SF", show: d => d.fabric_needed === "Yes" },
  ],
  "Dry Stream Bed": [
    { k: "lf", l: "Linear Feet", unit: "LF" },
    { k: "width", l: "Width", unit: "ft" },
    { k: "stream_depth", l: "Depth", unit: "in" },
    { k: "existing_downspout", l: "Existing Downspout" },
    { k: "existing_lf", l: "Existing LF", unit: "LF", show: d => d.existing_downspout === "Yes" },
    ...EXCAVATION_FIELDS,
    { k: "ball_cart_needed", l: "Ball Cart Needed" },
    { k: "boulders_needed", l: "Boulders Needed" },
    { k: "fieldstone_10_18", l: 'Fieldstone 10–18"', show: d => d.boulders_needed === "Yes" },
    { k: "fieldstone_18_24", l: 'Fieldstone 18–24"', show: d => d.boulders_needed === "Yes" },
    { k: "fieldstone_24_30", l: 'Fieldstone 24–30"', show: d => d.boulders_needed === "Yes" },
    { k: "drainage_rock_needed", l: "Drainage Rock/Wash Stone" },
    { k: "drainage_rock_cy", l: "Drainage Rock CY", unit: "CY", show: d => d.drainage_rock_needed === "Yes" },
    { k: "stone_type", l: "Stone Type" },
    { k: "stream_purpose", l: "Decorative vs Functional" },
  ],
  "Impervious Membrane": [
    { k: "rough_grading_needed", l: "Rough Grading/Excavation" },
    { k: "mem_length", l: "Length", unit: "ft", show: d => d.rough_grading_needed === "Yes" },
    { k: "mem_width", l: "Width", unit: "ft", show: d => d.rough_grading_needed === "Yes" },
    { k: "mem_depth", l: "Depth", unit: "in", show: d => d.rough_grading_needed === "Yes" },
    { k: "excavation_mode", l: "Excavation Method", show: d => d.rough_grading_needed === "Yes" },
    { k: "excavation_machine_type", l: "Machine Type", show: d => d.rough_grading_needed === "Yes" && d.excavation_mode === "Machine" },
    { k: "detail_excavation_hours", l: "Detail Excavation (hrs)", unit: "hrs" },
    { k: "place_membrane_hours", l: "Place Membrane (hrs)", unit: "hrs" },
    { k: "roofing_membrane_needed", l: "Rubber Roofing Membrane" },
    { k: "roofing_membrane_rolls", l: "Membrane Rolls", show: d => d.roofing_membrane_needed === "Yes" },
    { k: "woven_fabric_needed", l: "Woven Fabric w/ Pins" },
    { k: "woven_fabric_sf", l: "Fabric SF", unit: "SF", show: d => d.woven_fabric_needed === "Yes" },
    { k: "place_stone_hours", l: "Place Stone (hrs)", unit: "hrs" },
    { k: "drainage_rock_needed", l: 'Drainage Rock 1.5"' },
    { k: "drainage_rock_tons", l: "Drainage Rock Tons", unit: "tons", show: d => d.drainage_rock_needed === "Yes" },
    { k: "edging_needed", l: "Edging Needed" },
    { k: "poly_plastic_needed", l: "6-Mil Poly Plastic" },
    { k: "poly_plastic_rolls", l: "Poly Plastic Rolls", show: d => d.poly_plastic_needed === "Yes" },
  ],
};

function SummaryRow({ field, data, flagSet }) {
  const show = !field.show || field.show(data);
  if (!show) return null;
  const raw = data[field.k];
  const value = field.fmt ? field.fmt(raw) : raw;
  const hasVal = value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
  const isFlagged = flagSet.has(field.k);
  return (
    <div className={`flex items-start gap-2 text-sm py-1.5 ${isFlagged ? 'bg-orange-50 rounded px-2 -mx-2' : ''}`}>
      {isFlagged ? (
        <Flag className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
      ) : (
        <span className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
      )}
      <span className="text-muted-foreground min-w-0">{field.l}:</span>
      <span className={`font-medium ${!hasVal ? 'text-muted-foreground/50 italic' : ''}`}>
        {hasVal ? (field.unit ? `${String(value)} ${field.unit}` : String(value)) : '— not set'}
      </span>
    </div>
  );
}

export default function DrainageSummary() {
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
      const ops = parseOps(a.drainage_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const category = CATEGORY_MAP[data.drain_type];
  const fields = TYPE_FIELDS[data.drain_type] || [];
  const flagSet = new Set(data._flags || []);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/drainage-wizard/${areaId}?opId=${data.id}`)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Drainage Summary</h1>
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
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-blue-50 border border-blue-200 text-blue-800">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              {category}
            </div>
          </div>
        )}

        <div className="text-sm flex flex-wrap gap-4">
          <span><span className="text-muted-foreground">Drain Type:</span>{" "}<span className="font-medium text-primary">{data.drain_type}</span></span>
          <span><span className="text-muted-foreground">Time Estimate:</span>{" "}<span className="font-medium">{data.time_estimate ? `${data.time_estimate} hrs` : '— not set'}</span></span>
        </div>

        {/* Calculations */}
        {(data.excavCY || data.stoneCY || data.streamStoneCY || data.membraneCY || data.sf) && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Calculations</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.sf && <div className="text-sm"><p className="text-xs text-muted-foreground">Square Footage</p><p className="font-bold text-lg">{data.sf} SF</p></div>}
              {data.excavCY && <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-2"><p className="text-xs text-blue-700 font-semibold">Excavation CY</p><p className="font-bold text-lg text-blue-800">{data.excavCY} CY</p></div>}
              {data.stoneCY && <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-2"><p className="text-xs text-blue-700 font-semibold">Stone CY</p><p className="font-bold text-lg text-blue-800">{data.stoneCY} CY</p></div>}
              {data.streamStoneCY && <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-2"><p className="text-xs text-blue-700 font-semibold">Stream Stone CY</p><p className="font-bold text-lg text-blue-800">{data.streamStoneCY} CY</p></div>}
              {data.membraneCY && <div className="text-sm bg-blue-50 border border-blue-200 rounded-lg p-2"><p className="text-xs text-blue-700 font-semibold">Membrane Excavation CY</p><p className="font-bold text-lg text-blue-800">{data.membraneCY} CY</p></div>}
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