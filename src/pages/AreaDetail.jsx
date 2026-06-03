import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ClipboardList, FileText, Settings, Leaf, Plus, Shovel, Hammer, Pencil, ChevronDown, ChevronRight, Search, Layers, Scissors, Sprout, Wind, Droplets, CheckCircle2, Mountain, Trash2, Wrench, Flag, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { parseOps } from "@/lib/opsUtils";

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

  async function loadArea() {
    const a = await base44.entities.Area.get(areaId);
    setArea(a);
    setLoading(false);
    // Auto-set In Progress if operations exist but status is Not Started
    const ops = ALL_OPERATIONS.filter(op => op.type !== "Site Management & Daily Cleanup");
    const allOps = [...ops, ALL_OPERATIONS.find(o => o.type === "Site Management & Daily Cleanup")].filter(Boolean);
    const hasOps = allOps.some(op => parseOps(a[op.dataKey]).length > 0);
    if (hasOps && (!a.status || a.status === "Not Started")) {
      await base44.entities.Area.update(areaId, { status: "In Progress" });
      setArea({ ...a, status: "In Progress" });
    }
  }

  async function markComplete() {
    await base44.entities.Area.update(areaId, { status: "Complete" });
    setArea(a => ({ ...a, status: "Complete" }));
  }

  async function markInProgress() {
    await base44.entities.Area.update(areaId, { status: "In Progress" });
    setArea(a => ({ ...a, status: "In Progress" }));
  }

  async function handleDeleteEntry(op, entryId) {
    const entries = parseOps(area[op.dataKey]);
    const updated = entries.filter(e => e.id !== entryId);
    await base44.entities.Area.update(areaId, { [op.dataKey]: JSON.stringify(updated) });
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
    <div>
      <Link to={`/project/${area.project_id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">{area.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${area.status === "Complete" ? "bg-emerald-100 text-emerald-700" : area.status === "In Progress" ? "bg-blue-100 text-blue-700" : "bg-muted text-muted-foreground"}`}>
              {area.status || "Not Started"}
            </span>
            <span className="text-muted-foreground text-sm">
              {totalEntries === 0 ? "No operations configured yet" : `${totalEntries} operation${totalEntries !== 1 ? "s" : ""} configured`}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {area.status !== "Complete" ? (
            <Button variant="outline" onClick={markComplete}>
              <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
            </Button>
          ) : (
            <Button variant="outline" onClick={markInProgress}>
              Reopen
            </Button>
          )}
          <Button onClick={() => { setSearch(""); setShowOpPicker(true); }}>
            <Plus className="h-4 w-4 mr-2" /> Add Operation
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
        <div className="max-w-lg space-y-3">
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
                   <p className="text-xs text-muted-foreground">{entries.length} entr{entries.length !== 1 ? "ies" : "y"}</p>
                 </div>
                 {entries.some(e => e._flags && e._flags.length > 0) && (
                   <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                     <Flag className="h-3 w-3" fill="currentColor" /> Flagged
                   </span>
                 )}
                 {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 border-t border-inherit pt-3 space-y-2">
                    {entries.map((entry, idx) => (
                      <div key={entry.id} className={`bg-background/70 rounded-lg px-3 py-2 border transition-colors ${entry._flags?.length > 0 ? "border-orange-300 bg-orange-50/30" : "border-inherit"}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium capitalize flex-1">{getEntryLabel(entry, idx)}</span>
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => navigate(`${op.wizardPath(areaId)}?opId=${entry.id}`)}>
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => navigate(op.summaryPath(areaId, entry.id))}>
                            <FileText className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          <button className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" onClick={() => handleDeleteEntry(op, entry.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {entry._flags?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {entry._flags.map(fk => (
                              <span key={fk} className="inline-flex items-center gap-1 text-xs text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
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
                    <p className="text-xs text-muted-foreground">{op.description}</p>
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