import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ClipboardList, FileText, Settings, Leaf, Plus, Shovel, Hammer, Pencil, ChevronDown, ChevronRight, Search, Layers, Scissors, Sprout, Wind, Droplets, CheckCircle2, Mountain, Trash2, Wrench, Flag, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseOps } from "@/lib/opsUtils";
import VoiceNotes from "@/components/VoiceNotes";
import { mapDemolitionEntry, mapBouldersEntry, mapDrainageEntry } from "@/lib/voiceNoteMapper";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import PullToRefreshIndicator from "@/components/PullToRefreshIndicator";

const ALL_OPERATIONS = [
  { type: "Site Management & Daily Cleanup", dataKey: "site_mgmt_data", wizardPath: (id) => `/site-management-wizard/${id}`, summaryPath: (id, opId) => `/site-management-summary/${id}?opId=${opId}`, icon: Settings, color: "blue", description: "Parking, access, stormwater, moving items & removal" },
  { type: "Walkway/Patio", dataKey: "patio_data", wizardPath: (id) => `/patio-wizard/${id}`, summaryPath: (id, opId) => `/patio-summary/${id}?opId=${opId}`, icon: ClipboardList, color: "amber", description: "Patio & walkway stages, materials and measurements" },
  { type: "Bed Preparation", dataKey: "bed_prep_data", wizardPath: (id) => `/bed-prep-wizard/${id}`, summaryPath: (id, opId) => `/bed-prep-summary/${id}?opId=${opId}`, icon: Leaf, color: "green", description: "Till, no-till, lawn or reprofiling configuration" },
  { type: "Rough Grading & Hauling", dataKey: "rough_grading_data", wizardPath: (id) => `/rough-grading-wizard/${id}`, summaryPath: (id, opId) => `/rough-grading-summary/${id}?opId=${opId}`, icon: Shovel, color: "orange", description: "Excavation, exportation, soil importation & spreading" },
  { type: "Demolition & Removals", dataKey: "demolition_data", wizardPath: (id) => `/demolition-wizard/${id}`, summaryPath: (id, opId) => `/demolition-summary/${id}?opId=${opId}`, icon: Hammer, color: "red", description: "Hardscape and vegetation/softscape demolition & removals" },
  { type: "Bed Edging", dataKey: "bed_edging_data", wizardPath: (id) => `/bed-edging-wizard/${id}`, summaryPath: (id, opId) => `/bed-edging-summary/${id}?opId=${opId}`, icon: Scissors, color: "purple", description: "Brick, metal, bullet, natural edge, poly or limestone edging" },
  { type: "Planting", dataKey: "planting_data", wizardPath: (id) => `/planting-wizard/${id}`, summaryPath: (id, opId) => `/planting-summary/${id}?opId=${opId}`, icon: Sprout, color: "teal", description: "Trees & shrubs, perennials, bulbs or annuals planting" },
  { type: "Mulch", dataKey: "mulch_data", wizardPath: (id) => `/mulch-wizard/${id}`, summaryPath: (id, opId) => `/mulch-summary/${id}?opId=${opId}`, icon: Wind, color: "yellow", description: "Organic or stone mulch with SF/CY/weight calculations" },
  { type: "Drainage", dataKey: "drainage_data", wizardPath: (id) => `/drainage-wizard/${id}`, summaryPath: (id, opId) => `/drainage-summary/${id}?opId=${opId}`, icon: Droplets, color: "sky", description: "Buried downspout, curtain drain, french drain, dry stream bed" },
  { type: "Lawn Repair & Install", dataKey: "lawn_data", wizardPath: (id) => `/lawn-wizard/${id}`, summaryPath: (id, opId) => `/lawn-summary/${id}?opId=${opId}`, icon: Leaf, color: "lime", description: "Sod installation, seed install, or top dress lawn" },
  { type: "Boulders/Accents & Structures", dataKey: "boulders_data", wizardPath: (id) => `/boulders-wizard/${id}`, summaryPath: (id, opId) => `/boulders-summary/${id}?opId=${opId}`, icon: Mountain, color: "stone", description: "Boulders, accents, fence, arbor, or raised garden beds" },
  { type: "Hardscape - Repair Existing", dataKey: "hardscape_repair_data", wizardPath: (id) => `/hardscape-repair-wizard/${id}`, summaryPath: (id, opId) => `/hardscape-repair-summary/${id}?opId=${opId}`, icon: Hammer, color: "cyan", description: "Repair existing patio or walkway — surface, base, leveling & edge" },
  { type: "Maintenance", dataKey: "maintenance_data", wizardPath: (id) => `/maintenance-wizard/${id}`, summaryPath: (id, opId) => `/maintenance-summary/${id}?opId=${opId}`, icon: Wrench, color: "rose", description: "Weeding and general maintenance tasks" },
  { type: "Retaining Wall", dataKey: "retaining_wall_data", wizardPath: (id) => `/retaining-wall-wizard/${id}`, summaryPath: (id, opId) => `/retaining-wall-summary/${id}?opId=${opId}`, icon: Layers, color: "zinc", description: "Excavation, base install, and wall type (outcrop, boulder, CMU, etc.)" },
  { type: "Pathway / Steps", dataKey: "stepping_stone_data", wizardPath: (id) => `/stepping-stone-wizard/${id}`, summaryPath: (id, opId) => `/stepping-stone-summary/${id}?opId=${opId}`, icon: Layers, color: "indigo", description: "Stepping stone pathway or hardscape steps with landing" },
];

function getAvailableOps(area) {
  if (area.operation_type === "Site Management & Daily Cleanup") return ALL_OPERATIONS.filter(op => op.type === "Site Management & Daily Cleanup");
  return ALL_OPERATIONS.filter(op => op.type !== "Site Management & Daily Cleanup");
}

const colorMap = {
  blue:   { bg: "bg-blue-50/50",   border: "border-blue-200",   icon: "text-blue-700",   iconBg: "bg-blue-100" },
  amber:  { bg: "bg-amber-50/50",  border: "border-amber-200",  icon: "text-amber-700",  iconBg: "bg-amber-100" },
  green:  { bg: "bg-green-50/50",  border: "border-green-200",  icon: "text-green-700",  iconBg: "bg-green-100" },
  orange: { bg: "bg-orange-50/50", border: "border-orange-200", icon: "text-orange-700", iconBg: "bg-orange-100" },
  red:    { bg: "bg-red-50/50",    border: "border-red-200",    icon: "text-red-700",    iconBg: "bg-red-100" },
  purple: { bg: "bg-purple-50/50", border: "border-purple-200", icon: "text-purple-700", iconBg: "bg-purple-100" },
  teal:   { bg: "bg-teal-50/50",   border: "border-teal-200",   icon: "text-teal-700",   iconBg: "bg-teal-100" },
  yellow: { bg: "bg-yellow-50/50", border: "border-yellow-200", icon: "text-yellow-700", iconBg: "bg-yellow-100" },
  sky:    { bg: "bg-sky-50/50",    border: "border-sky-200",    icon: "text-sky-700",    iconBg: "bg-sky-100" },
  lime:   { bg: "bg-lime-50/50",   border: "border-lime-200",   icon: "text-lime-700",   iconBg: "bg-lime-100" },
  stone:  { bg: "bg-stone-50/50", border: "border-stone-200", icon: "text-stone-700", iconBg: "bg-stone-100" },
  cyan:   { bg: "bg-cyan-50/50",  border: "border-cyan-200",  icon: "text-cyan-700",  iconBg: "bg-cyan-100" },
  rose:   { bg: "bg-rose-50/50",  border: "border-rose-200",  icon: "text-rose-700",  iconBg: "bg-rose-100" },
  indigo: { bg: "bg-indigo-50/50", border: "border-indigo-200", icon: "text-indigo-700", iconBg: "bg-indigo-100" },
  zinc:   { bg: "bg-zinc-50/50",  border: "border-zinc-200",  icon: "text-zinc-700",  iconBg: "bg-zinc-100" },
};

function getEntryLabel(entry, idx) {
  return entry.sub_type ? entry.sub_type.replace(/_/g, ' ') : `Entry #${idx + 1}`;
}

export default function AreaDetail() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [showOpPicker, setShowOpPicker] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => { loadArea(); }, [areaId]);

  const { pulling, refreshing } = usePullToRefresh(loadArea);

  async function loadArea() {
    const a = await OfflineAreas.get(areaId);
    setArea(a);
    setLoading(false);
    // Auto-set In Progress if operations exist but status is Not Started
    const ops = ALL_OPERATIONS.filter(op => op.type !== "Site Management & Daily Cleanup");
    const allOps = [...ops, ALL_OPERATIONS.find(o => o.type === "Site Management & Daily Cleanup")].filter(Boolean);
    const hasOps = allOps.some(op => parseOps(a[op.dataKey]).length > 0);
    if (hasOps && (!a.status || a.status === "Not Started")) {
      await OfflineAreas.update(areaId, { status: "In Progress" });
      setArea({ ...a, status: "In Progress" });
    }
  }

  async function markComplete() {
    await OfflineAreas.update(areaId, { status: "Complete" });
    setArea(a => ({ ...a, status: "Complete" }));
  }

  async function markInProgress() {
    await OfflineAreas.update(areaId, { status: "In Progress" });
    setArea(a => ({ ...a, status: "In Progress" }));
  }

  async function handleDeleteEntry(op, entryId) {
    const entries = parseOps(area[op.dataKey]);
    const updated = entries.filter(e => e.id !== entryId);
    await OfflineAreas.update(areaId, { [op.dataKey]: JSON.stringify(updated) });
    setArea(a => ({ ...a, [op.dataKey]: JSON.stringify(updated) }));
  }



  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!area) return <div className="text-center py-20 text-muted-foreground">Area not found</div>;

  const availableOps = getAvailableOps(area);
  const configuredOps = availableOps.filter(op => parseOps(area[op.dataKey]).length > 0);
  const totalEntries = configuredOps.reduce((sum, op) => sum + parseOps(area[op.dataKey]).length, 0);

  const filteredPickerOps = availableOps.filter(op =>
    op.type.toLowerCase().includes(search.toLowerCase()) ||
    op.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="overscroll-none">
      <PullToRefreshIndicator pulling={pulling} refreshing={refreshing} />
      <Link to={`/project/${area.project_id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 py-2 pr-2">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{area.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${area.status === "Complete" ? "bg-emerald-100 text-emerald-700" : area.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
              {area.status || "Not Started"}
            </span>
            <span className="text-muted-foreground text-sm">
              {totalEntries === 0 ? "No operations configured yet" : `${totalEntries} operation${totalEntries !== 1 ? "s" : ""} configured`}
            </span>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {area.status !== "Complete" ? (
            <Button variant="outline" size="sm" onClick={markComplete}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Complete
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={markInProgress}>
              Reopen
            </Button>
          )}
          <Button size="sm" onClick={() => { setSearch(""); setShowOpPicker(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Operation
          </Button>
        </div>
      </div>

      {configuredOps.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl">
          <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No operations yet</p>
          <p className="text-sm mt-1">Click "Add Operation" to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {configuredOps.map((op) => {
            const entries = parseOps(area[op.dataKey]);
            const Icon = op.icon;
            const c = colorMap[op.color];
            const isOpen = expanded[op.type];

            return (
              <div key={op.type} className={`rounded-xl border ${c.bg} ${c.border}`}>
                <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(e => ({ ...e, [op.type]: !e[op.type] }))}>
                 <div className={`h-9 w-9 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                   <Icon className={`h-4 w-4 ${c.icon}`} />
                 </div>
                 <div className="flex-1 min-w-0">
                   <p className="font-semibold text-sm">{op.type}</p>
                   <p className="text-sm text-muted-foreground">{entries.length} entr{entries.length !== 1 ? "ies" : "y"}</p>
                 </div>
                 {entries.some(e => e._flags && e._flags.length > 0) && (
                   <span className="flex items-center gap-1 text-sm font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                     <Flag className="h-3 w-3" fill="currentColor" /> Flagged
                   </span>
                 )}
                 {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-inherit pt-3 space-y-2">
                    {entries.map((entry, idx) => (
                      <div key={entry.id} className={`bg-background/70 rounded-lg px-3 py-2 border transition-colors ${entry._flags?.length > 0 ? "border-orange-300 bg-orange-50/30" : "border-inherit"}`}>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-sm font-medium capitalize flex-1 min-w-0 truncate">{getEntryLabel(entry, idx)}</span>
                          <Button size="sm" variant="ghost" className="h-9 px-3" onClick={() => navigate(`${op.wizardPath(areaId)}?opId=${entry.id}`)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="h-9 px-3" onClick={() => navigate(op.summaryPath(areaId, entry.id))}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          <button className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleDeleteEntry(op, entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {entry._flags?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {entry._flags.map(fk => (
                              <span key={fk} className="inline-flex items-center gap-1 text-sm text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                                <Flag className="h-2.5 w-2.5" fill="currentColor" />
                                {(entry._flag_labels && entry._flag_labels[fk]) || fk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    <Button variant="outline" className="w-full mt-1" onClick={() => navigate(op.wizardPath(areaId))}>
                      <Plus className="h-4 w-4 mr-2" /> Add Another {op.type}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Voice Notes */}
      <div className="mt-6">
        <VoiceNotes 
          areaId={areaId}
          initialAnalysis={area?.voice_notes_analysis}
          onCreateOperation={async (operation) => {
            // Find the matching operation definition
            const opDef = ALL_OPERATIONS.find(op => op.type === operation.operation_type);
            if (!opDef) return;

            // Create operation entry with AI-suggested data
            const entries = parseOps(area[opDef.dataKey]);
            const sfLength = operation.sf_length != null ? String(operation.sf_length) : '';
            const sfWidth = operation.sf_width != null ? String(operation.sf_width) : '';
            const sf = sfLength && sfWidth ? String(Math.round(parseFloat(sfLength) * parseFloat(sfWidth))) : '';

            const newEntry = {
              id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              description: operation.description,
              estimated_quantity: operation.estimated_quantity,
              materials: operation.materials?.join(', ') || '',
              notes: operation.notes || '',
              priority: operation.priority || 'medium',
              ...(operation.time_estimate != null && { time_estimate: String(operation.time_estimate) }),
              // For Rough Grading: include structured form fields
              ...(operation.operation_type === 'Rough Grading & Hauling' && {
                sub_type: operation.sub_type || '',
                sf_length: sfLength,
                sf_width: sfWidth,
                sf,
                depth_inches: operation.depth_inches != null ? String(operation.depth_inches) : '',
                machine_type: operation.machine_type || '',
                sod_vegetation_removed: operation.sod_vegetation_removed || '',
                disposal_needed: operation.disposal_needed || '',
              }),

              // For Mulch: include mulch_type and dimensions
              ...(operation.operation_type === 'Mulch' && operation.mulch_type && {
                mulch_type: operation.mulch_type,
                sub_type: operation.mulch_type,
                length: sfLength,
                width: sfWidth,
                depth: operation.mulch_depth != null ? String(operation.mulch_depth) : '',
              }),
              // For Lawn Repair & Install: include lawn_type, dimensions, and seed_type
              ...(operation.operation_type === 'Lawn Repair & Install' && {
                lawn_type: operation.lawn_type || '',
                sub_type: operation.lawn_type || '',
                length: sfLength,
                width: sfWidth,
                sf: sf || '',
                seed_type: operation.seed_type || '',
              }),
              // For Bed Edging: map all type-specific fields and auto-flag missing ones
              ...(operation.operation_type === 'Bed Edging' && (() => {
                const et = operation.edge_type || '';
                const flags = [];
                const flagLabels = {};
                const addFlag = (key, label) => { flags.push(key); flagLabels[key] = label; };
                const s = (v) => (v != null && v !== '') ? String(v) : '';

                const entry = { edge_type: et, sub_type: et, bed_edger_needed: s(operation.bed_edger_needed) };
                if (!operation.bed_edger_needed) addFlag('bed_edger_needed', 'Bed Edger needed?');

                if (et === 'Brick') {
                  entry.brick_width = s(operation.brick_width);
                  entry.brick_lf_straight = s(operation.lf_straight ?? operation.lf);
                  entry.brick_lf_curved = s(operation.lf_curved);
                  entry.brick_color = s(operation.brick_color);
                  entry.brick_ends_cut = s(operation.brick_ends_cut);
                  entry.brick_prep_hours = s(operation.brick_prep_hours);
                  entry.brick_sand_needed = s(operation.brick_sand_needed);
                  entry.brick_cut_off_saw = s(operation.brick_cut_off_saw);
                  entry.brick_disposal_hours = s(operation.brick_disposal_hours);
                  if (!entry.brick_width) addFlag('brick_width', 'Width (4 or 8 inch)');
                  if (!entry.brick_lf_straight && !entry.brick_lf_curved) addFlag('brick_lf_straight', 'Linear Feet');
                  if (!entry.brick_color) addFlag('brick_color', 'Color');
                  if (!entry.brick_ends_cut) addFlag('brick_ends_cut', 'Ends cut to reduce gaps?');
                  if (!entry.brick_prep_hours) addFlag('brick_prep_hours', 'Prep area for brick? (hrs)');
                  if (!entry.brick_sand_needed) addFlag('brick_sand_needed', 'Coarse / Washed Sand needed?');
                  if (!entry.brick_cut_off_saw) addFlag('brick_cut_off_saw', 'Cut Off Saw needed?');
                  if (!entry.brick_disposal_hours) addFlag('brick_disposal_hours', 'Disposal of debris or extra brick? (hrs)');
                } else if (et === 'Metal') {
                  entry.metal_type = s(operation.metal_type);
                  entry.metal_lf = s(operation.metal_lf ?? operation.lf);
                  entry.metal_corners = s(operation.metal_corners);
                  entry.metal_splicers = s(operation.metal_splicers);
                  entry.metal_cut_off_saw = s(operation.metal_cut_off_saw);
                  entry.metal_remove_sod_hours = s(operation.metal_remove_sod_hours);
                  if (!entry.metal_type) addFlag('metal_type', 'Metal Type (Aluminum or Steel)');
                  if (!entry.metal_lf) addFlag('metal_lf', 'Linear Feet');
                  if (!entry.metal_corners) addFlag('metal_corners', 'Corners');
                  if (!entry.metal_splicers) addFlag('metal_splicers', 'Splicers');
                  if (!entry.metal_cut_off_saw) addFlag('metal_cut_off_saw', 'Cut Off Saw needed?');
                  if (!entry.metal_remove_sod_hours) addFlag('metal_remove_sod_hours', 'Remove sod behind edge? (hrs)');
                } else if (et === 'Bullet') {
                  entry.bullet_supplier = s(operation.bullet_supplier);
                  entry.bullet_lf = s(operation.bullet_lf ?? operation.lf);
                  entry.bullet_color = s(operation.bullet_color);
                  entry.bullet_prep_hours = s(operation.bullet_prep_hours);
                  entry.bullet_permeable_chips = s(operation.bullet_permeable_chips);
                  entry.bullet_cut_off_saw = s(operation.bullet_cut_off_saw);
                  entry.bullet_disposal_hours = s(operation.bullet_disposal_hours);
                  if (!entry.bullet_supplier) addFlag('bullet_supplier', 'Supplier (Menards or Rochester)');
                  if (!entry.bullet_lf) addFlag('bullet_lf', 'Linear Feet');
                  if (!entry.bullet_color) addFlag('bullet_color', 'Color');
                  if (!entry.bullet_prep_hours) addFlag('bullet_prep_hours', 'Prep area for brick? (hrs)');
                  if (!entry.bullet_permeable_chips) addFlag('bullet_permeable_chips', 'Bulk Permeable Chips needed?');
                  if (!entry.bullet_cut_off_saw) addFlag('bullet_cut_off_saw', 'Cut Off Saw needed?');
                  if (!entry.bullet_disposal_hours) addFlag('bullet_disposal_hours', 'Disposal of debris? (hrs)');
                } else if (et === 'Natural Edge') {
                  entry.natural_method = s(operation.natural_method);
                  entry.natural_lf = s(operation.natural_lf ?? operation.lf);
                  if (!entry.natural_method) addFlag('natural_method', 'Method (Hand cut or Bed Edger)');
                  if (!entry.natural_lf) addFlag('natural_lf', 'Linear Feet');
                } else if (et === 'Poly') {
                  entry.poly_lf = s(operation.poly_lf ?? operation.lf);
                  entry.poly_angular_connectors = s(operation.poly_angular_connectors);
                  entry.poly_remove_sod_hours = s(operation.poly_remove_sod_hours);
                  if (!entry.poly_lf) addFlag('poly_lf', 'Linear Feet');
                  if (!entry.poly_angular_connectors) addFlag('poly_angular_connectors', 'Angular connectors needed?');
                  if (!entry.poly_remove_sod_hours) addFlag('poly_remove_sod_hours', 'Remove sod or soil behind edge? (hrs)');
                } else if (et === 'Snapped Limestone') {
                  entry.snapped_lf = s(operation.snapped_lf ?? operation.lf);
                  entry.snapped_ends_cut = s(operation.snapped_ends_cut);
                  entry.snapped_sand_needed = s(operation.snapped_sand_needed);
                  entry.snapped_prep_hours = s(operation.snapped_prep_hours);
                  entry.snapped_cut_off_saw = s(operation.snapped_cut_off_saw);
                  if (!entry.snapped_lf) addFlag('snapped_lf', 'Linear Feet');
                  if (!entry.snapped_ends_cut) addFlag('snapped_ends_cut', 'Ends cut to reduce gaps?');
                  if (!entry.snapped_sand_needed) addFlag('snapped_sand_needed', 'Coarse / Washed Sand needed?');
                  if (!entry.snapped_prep_hours) addFlag('snapped_prep_hours', 'Prep area for stone? (hrs)');
                  if (!entry.snapped_cut_off_saw) addFlag('snapped_cut_off_saw', 'Cut Off Saw needed?');
                } else {
                  addFlag('edge_type', 'Edge Type');
                }

                if (!operation.time_estimate) addFlag('time_estimate', 'Time Estimate');
                if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
                return entry;
              })()),
              // For Bed Preparation: map all sub-type-specific fields and flag missing ones
              ...(operation.operation_type === 'Bed Preparation' && (() => {
                const sub = operation.bed_sub_type || '';
                const flags = [];
                const flagLabels = {};
                const addFlag = (key, label) => { flags.push(key); flagLabels[key] = label; };
                const s = (v) => (v != null && v !== '') ? String(v) : '';

                const sfLength = s(operation.sf_length);
                const sfWidth = s(operation.sf_width);
                const sf = sfLength && sfWidth ? String(Math.round(parseFloat(sfLength) * parseFloat(sfWidth))) : '';

                const entry = {
                  main_type: operation.bed_main_type || '',
                  sub_type: sub,
                  sf_length: sfLength,
                  sf_width: sfWidth,
                  sf,
                };

                if (!sf) addFlag('sf', 'Square Footage');

                // ── Till 1" and Till 3" ────────────────────────────────────
                if (sub === 'till_1in' || sub === 'till_3in') {
                  entry.till_tilling_mode = s(operation.till_tilling_mode);
                  entry.till_hand_tiller_type = s(operation.till_hand_tiller_type);
                  entry.till_hand_tiller_hours = s(operation.till_hand_tiller_hours);
                  entry.till_machine_type = s(operation.till_machine_type);
                  entry.till_hydraulic_tiller = s(operation.till_hydraulic_tiller);
                  entry.remove_rock_hours = s(operation.remove_rock_hours);
                  entry.fertilizer_hours = s(operation.fertilizer_hours);
                  entry.chicken_crumbles = s(operation.chicken_crumbles);
                  entry.amend_amendment_type = s(operation.amend_amendment_type);
                  entry.finish_bed_hours = s(operation.finish_bed_hours);
                  if (!entry.till_tilling_mode) addFlag('till_tilling_mode', 'Hand vs Machine');
                  if (entry.till_tilling_mode === 'Hand' && !entry.till_hand_tiller_type) addFlag('till_hand_tiller_type', 'Hand Tiller Type');
                  if (entry.till_tilling_mode === 'Hand' && !entry.till_hand_tiller_hours) addFlag('till_hand_tiller_hours', 'Hand Tiller Unit Hours');
                  if (entry.till_tilling_mode === 'Machine' && !entry.till_machine_type) addFlag('till_machine_type', 'Machine Type (Dingo or Vermeer)');
                  if (entry.till_tilling_mode === 'Machine' && !entry.till_hydraulic_tiller) addFlag('till_hydraulic_tiller', 'Hydraulic Tiller Attachment?');
                  if (!entry.remove_rock_hours) addFlag('remove_rock_hours', 'Remove rock/debris/roots? (hrs)');
                  if (!entry.fertilizer_hours) addFlag('fertilizer_hours', 'Fertilizer? (hrs)');
                  if (!entry.chicken_crumbles) addFlag('chicken_crumbles', 'Chicken Crumbles?');
                  if (!entry.amend_amendment_type) addFlag('amend_amendment_type', 'Amendment type (Topsoil or Compost)');
                  if (!entry.finish_bed_hours) addFlag('finish_bed_hours', 'Finish bed by hand? (hrs)');
                }

                // ── Lawn No Amendments ──────────────────────────────────────
                if (sub === 'lawn_none') {
                  entry.lawn_tilling_mode = s(operation.lawn_tilling_mode);
                  entry.lawn_hand_tiller_type = s(operation.lawn_hand_tiller_type);
                  entry.lawn_hand_tiller_hours = s(operation.lawn_hand_tiller_hours);
                  entry.lawn_machine_type = s(operation.lawn_machine_type);
                  entry.lawn_hydraulic_tiller = s(operation.lawn_hydraulic_tiller);
                  entry.fertilizer_hours = s(operation.fertilizer_hours);
                  entry.finish_bed_hours = s(operation.finish_bed_hours);
                  if (!entry.lawn_tilling_mode) addFlag('lawn_tilling_mode', 'Hand vs Machine');
                  if (entry.lawn_tilling_mode === 'Hand' && !entry.lawn_hand_tiller_type) addFlag('lawn_hand_tiller_type', 'Hand Tiller Type');
                  if (entry.lawn_tilling_mode === 'Hand' && !entry.lawn_hand_tiller_hours) addFlag('lawn_hand_tiller_hours', 'Hand Tiller Unit Hours');
                  if (entry.lawn_tilling_mode === 'Machine' && !entry.lawn_machine_type) addFlag('lawn_machine_type', 'Machine Type (Dingo or Vermeer)');
                  if (entry.lawn_tilling_mode === 'Machine' && !entry.lawn_hydraulic_tiller) addFlag('lawn_hydraulic_tiller', 'Hydraulic Tiller Attachment?');
                  if (!entry.fertilizer_hours) addFlag('fertilizer_hours', 'Fertilizer? (hrs)');
                  if (!entry.finish_bed_hours) addFlag('finish_bed_hours', 'Finish bed by hand? (hrs)');
                }

                // ── Lawn With Amendments ────────────────────────────────────
                if (sub === 'lawn_1in') {
                  entry.lawn_tilling_mode = s(operation.lawn_tilling_mode);
                  entry.lawn_hand_tiller_type = s(operation.lawn_hand_tiller_type);
                  entry.lawn_hand_tiller_hours = s(operation.lawn_hand_tiller_hours);
                  entry.lawn_machine_type = s(operation.lawn_machine_type);
                  entry.lawn_hydraulic_tiller = s(operation.lawn_hydraulic_tiller);
                  entry.fertilizer_hours = s(operation.fertilizer_hours);
                  entry.finish_bed_hours = s(operation.finish_bed_hours);
                  entry.amend_amendment_type = s(operation.amend_amendment_type);
                  entry.amend_amendment_depth_in = s(operation.amend_amendment_depth_in);
                  if (!entry.lawn_tilling_mode) addFlag('lawn_tilling_mode', 'Hand vs Machine');
                  if (entry.lawn_tilling_mode === 'Hand' && !entry.lawn_hand_tiller_type) addFlag('lawn_hand_tiller_type', 'Hand Tiller Type');
                  if (entry.lawn_tilling_mode === 'Hand' && !entry.lawn_hand_tiller_hours) addFlag('lawn_hand_tiller_hours', 'Hand Tiller Unit Hours');
                  if (entry.lawn_tilling_mode === 'Machine' && !entry.lawn_machine_type) addFlag('lawn_machine_type', 'Machine Type (Dingo or Vermeer)');
                  if (entry.lawn_tilling_mode === 'Machine' && !entry.lawn_hydraulic_tiller) addFlag('lawn_hydraulic_tiller', 'Hydraulic Tiller Attachment?');
                  if (!entry.fertilizer_hours) addFlag('fertilizer_hours', 'Fertilizer? (hrs)');
                  if (!entry.finish_bed_hours) addFlag('finish_bed_hours', 'Finish bed by hand? (hrs)');
                  if (!entry.amend_amendment_type) addFlag('amend_amendment_type', 'Amendment type (Topsoil or Compost)');
                  if (!entry.amend_amendment_depth_in) addFlag('amend_amendment_depth_in', 'Amendment depth (inches)');
                }

                // ── No Till Hand ────────────────────────────────────────────
                if (sub === 'notill_hand') {
                  entry.slope_distance_hours = s(operation.slope_distance_hours);
                  if (!entry.slope_distance_hours) addFlag('slope_distance_hours', 'Additional time for slopes/distance/challenges? (hrs)');
                }

                // ── No Till Machine ─────────────────────────────────────────
                if (sub === 'notill_machine') {
                  entry.notill_machine_type = s(operation.notill_machine_type);
                  if (!entry.notill_machine_type) addFlag('notill_machine_type', 'Machine type (Vermeer or Dingo)');
                }

                // ── Reprofiling ─────────────────────────────────────────────
                if (sub && sub.startsWith('repro_')) {
                  entry.repro_tilling = s(operation.repro_tilling);
                  entry.repro_till_tilling_mode = s(operation.repro_till_tilling_mode);
                  entry.repro_till_hand_tiller_type = s(operation.repro_till_hand_tiller_type);
                  entry.repro_till_hand_tiller_hours = s(operation.repro_till_hand_tiller_hours);
                  entry.repro_till_machine_type = s(operation.repro_till_machine_type);
                  entry.repro_till_hydraulic_tiller = s(operation.repro_till_hydraulic_tiller);
                  entry.remove_rock_hours = s(operation.remove_rock_hours);
                  entry.repro_amendments = s(operation.repro_amendments);
                  entry.repro_amend_amendment_type = s(operation.repro_amend_amendment_type);
                  entry.repro_amend_amendment_depth_in = s(operation.repro_amend_amendment_depth_in);
                  entry.repro_chicken_crumbles = s(operation.repro_chicken_crumbles);
                  entry.fertilizer_hours = s(operation.fertilizer_hours);
                  entry.finish_bed_hours = s(operation.finish_bed_hours);
                  if (!entry.repro_tilling) addFlag('repro_tilling', 'Tilling needed?');
                  if (entry.repro_tilling === 'Yes' && !entry.repro_till_tilling_mode) addFlag('repro_till_tilling_mode', 'Tilling: Hand vs Machine');
                  if (entry.repro_till_tilling_mode === 'Hand' && !entry.repro_till_hand_tiller_type) addFlag('repro_till_hand_tiller_type', 'Hand Tiller Type');
                  if (entry.repro_till_tilling_mode === 'Hand' && !entry.repro_till_hand_tiller_hours) addFlag('repro_till_hand_tiller_hours', 'Hand Tiller Unit Hours');
                  if (entry.repro_till_tilling_mode === 'Machine' && !entry.repro_till_machine_type) addFlag('repro_till_machine_type', 'Tilling Machine (Dingo or Vermeer)');
                  if (entry.repro_till_tilling_mode === 'Machine' && !entry.repro_till_hydraulic_tiller) addFlag('repro_till_hydraulic_tiller', 'Hydraulic Tiller Attachment?');
                  if (!entry.remove_rock_hours) addFlag('remove_rock_hours', 'Remove rock/debris/roots? (hrs)');
                  if (!entry.repro_amendments) addFlag('repro_amendments', 'Amendments needed?');
                  if (entry.repro_amendments === 'Yes' && !entry.repro_amend_amendment_type) addFlag('repro_amend_amendment_type', 'Amendment type (Topsoil or Compost)');
                  if (entry.repro_amendments === 'Yes' && !entry.repro_amend_amendment_depth_in) addFlag('repro_amend_amendment_depth_in', 'Amendment depth (inches)');
                  if (entry.repro_amendments === 'Yes' && !entry.repro_chicken_crumbles) addFlag('repro_chicken_crumbles', 'Chicken Crumbles?');
                  if (!entry.fertilizer_hours) addFlag('fertilizer_hours', 'Fertilizer? (hrs)');
                  if (!entry.finish_bed_hours) addFlag('finish_bed_hours', 'Finish bed by hand? (hrs)');
                }

                if (!operation.time_estimate) addFlag('time_estimate', 'Time Estimate');
                if (flags.length > 0) { entry._flags = flags; entry._flag_labels = flagLabels; }
                return entry;
              })()),
              // For Demolition & Removals: config-driven field mapping with auto-flagging
              ...(operation.operation_type === 'Demolition & Removals' && (() => {
                const mapped = mapDemolitionEntry(operation);
                return mapped || {};
              })()),
              // For Boulders/Accents & Structures: type-specific field mapping with auto-flagging
              ...(operation.operation_type === 'Boulders/Accents & Structures' && (() => {
                const mapped = mapBouldersEntry(operation);
                return mapped || {};
              })()),
              // For Drainage: type-specific field mapping with auto-flagging
              ...(operation.operation_type === 'Drainage' && (() => {
                const mapped = mapDrainageEntry(operation);
                return mapped || {};
              })()),
            };
            
            const updated = [...entries, newEntry];
            await OfflineAreas.update(areaId, { [opDef.dataKey]: JSON.stringify(updated) });
            setArea(a => ({ ...a, [opDef.dataKey]: JSON.stringify(updated) }));
          }}
        />
      </div>

      {/* Operation Picker Dialog */}
      <Dialog open={showOpPicker} onOpenChange={setShowOpPicker}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Operation</DialogTitle>
          </DialogHeader>
          <div className="relative mt-1 mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search operations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredPickerOps.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No operations found</p>
            ) : filteredPickerOps.map(op => {
              const Icon = op.icon;
              const c = colorMap[op.color];
              return (
                <button
                  key={op.type}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors text-left"
                  onClick={() => { setShowOpPicker(false); navigate(op.wizardPath(areaId)); }}
                >
                  <div className={`h-9 w-9 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${c.icon}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{op.type}</p>
                    <p className="text-sm text-muted-foreground">{op.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}