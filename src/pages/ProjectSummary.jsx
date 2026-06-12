import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Projects as OfflineProjects, Areas as OfflineAreas, resolveId } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Settings, ClipboardList, Leaf, Shovel, Hammer, ChevronDown, ChevronRight, FileText, Pencil, Plus, Scissors, Sprout, Wind, Droplets, Wrench, Layers, Flag, Download } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";
import { generateProjectSummaryPDF } from "@/lib/pdfExport";

const OP_CONFIG = {
  "Site Management & Daily Cleanup": { dataKey: "site_mgmt_data", summaryPath: (aId, opId) => `/site-management-summary/${aId}?opId=${opId}`, wizardPath: (aId, opId) => opId ? `/site-management-wizard/${aId}?opId=${opId}` : `/site-management-wizard/${aId}`, newPath: (aId) => `/site-management-wizard/${aId}`, icon: Settings, color: "blue" },
  "Walkway/Patio":                   { dataKey: "patio_data",         summaryPath: (aId, opId) => `/patio-summary/${aId}?opId=${opId}`,            wizardPath: (aId, opId) => opId ? `/patio-wizard/${aId}?opId=${opId}` : `/patio-wizard/${aId}`,                         newPath: (aId) => `/patio-wizard/${aId}`,            icon: ClipboardList, color: "amber" },
  "Bed Preparation":                  { dataKey: "bed_prep_data",      summaryPath: (aId, opId) => `/bed-prep-summary/${aId}?opId=${opId}`,          wizardPath: (aId, opId) => opId ? `/bed-prep-wizard/${aId}?opId=${opId}` : `/bed-prep-wizard/${aId}`,                   newPath: (aId) => `/bed-prep-wizard/${aId}`,          icon: Leaf,          color: "green" },
  "Rough Grading & Hauling":          { dataKey: "rough_grading_data", summaryPath: (aId, opId) => `/rough-grading-summary/${aId}?opId=${opId}`,     wizardPath: (aId, opId) => opId ? `/rough-grading-wizard/${aId}?opId=${opId}` : `/rough-grading-wizard/${aId}`,         newPath: (aId) => `/rough-grading-wizard/${aId}`,     icon: Shovel,        color: "orange" },
  "Demolition & Removals":            { dataKey: "demolition_data",    summaryPath: (aId, opId) => `/demolition-summary/${aId}?opId=${opId}`,        wizardPath: (aId, opId) => opId ? `/demolition-wizard/${aId}?opId=${opId}` : `/demolition-wizard/${aId}`,             newPath: (aId) => `/demolition-wizard/${aId}`,        icon: Hammer,        color: "red" },
  "Bed Edging":                       { dataKey: "bed_edging_data",    summaryPath: (aId, opId) => `/bed-edging-summary/${aId}?opId=${opId}`,          wizardPath: (aId, opId) => opId ? `/bed-edging-wizard/${aId}?opId=${opId}` : `/bed-edging-wizard/${aId}`,             newPath: (aId) => `/bed-edging-wizard/${aId}`,        icon: Scissors,      color: "purple" },
  "Planting":                         { dataKey: "planting_data",      summaryPath: (aId, opId) => `/planting-summary/${aId}?opId=${opId}`,            wizardPath: (aId, opId) => opId ? `/planting-wizard/${aId}?opId=${opId}` : `/planting-wizard/${aId}`,                 newPath: (aId) => `/planting-wizard/${aId}`,          icon: Sprout,        color: "teal" },
  "Mulch":                            { dataKey: "mulch_data",          summaryPath: (aId, opId) => `/mulch-summary/${aId}?opId=${opId}`,                wizardPath: (aId, opId) => opId ? `/mulch-wizard/${aId}?opId=${opId}` : `/mulch-wizard/${aId}`,                         newPath: (aId) => `/mulch-wizard/${aId}`,              icon: Wind,          color: "yellow" },
  "Drainage":                         { dataKey: "drainage_data",       summaryPath: (aId, opId) => `/drainage-summary/${aId}?opId=${opId}`,             wizardPath: (aId, opId) => opId ? `/drainage-wizard/${aId}?opId=${opId}` : `/drainage-wizard/${aId}`,                  newPath: (aId) => `/drainage-wizard/${aId}`,           icon: Droplets,      color: "sky" },
  "Boulders/Accents & Structures":    { dataKey: "boulders_data",       summaryPath: (aId, opId) => `/boulders-summary/${aId}?opId=${opId}`,           wizardPath: (aId, opId) => opId ? `/boulders-wizard/${aId}?opId=${opId}` : `/boulders-wizard/${aId}`,                   newPath: (aId) => `/boulders-wizard/${aId}`,          icon: Layers,        color: "zinc" },
  "Lawn Repair & Install":            { dataKey: "lawn_data",           summaryPath: (aId, opId) => `/lawn-summary/${aId}?opId=${opId}`,                  wizardPath: (aId, opId) => opId ? `/lawn-wizard/${aId}?opId=${opId}` : `/lawn-wizard/${aId}`,                          newPath: (aId) => `/lawn-wizard/${aId}`,               icon: Leaf,          color: "lime" },
  "Maintenance":                      { dataKey: "maintenance_data",    summaryPath: (aId, opId) => `/maintenance-summary/${aId}?opId=${opId}`,          wizardPath: (aId, opId) => opId ? `/maintenance-wizard/${aId}?opId=${opId}` : `/maintenance-wizard/${aId}`,           newPath: (aId) => `/maintenance-wizard/${aId}`,        icon: Wrench,        color: "slate" },
  "Hardscape - Repair Existing":      { dataKey: "hardscape_repair_data", summaryPath: (aId, opId) => `/hardscape-repair-summary/${aId}?opId=${opId}`, wizardPath: (aId, opId) => opId ? `/hardscape-repair-wizard/${aId}?opId=${opId}` : `/hardscape-repair-wizard/${aId}`, newPath: (aId) => `/hardscape-repair-wizard/${aId}`, icon: Wrench, color: "slate" },
  "Retaining Wall":                   { dataKey: "retaining_wall_data", summaryPath: (aId, opId) => `/retaining-wall-summary/${aId}?opId=${opId}`,      wizardPath: (aId, opId) => opId ? `/retaining-wall-wizard/${aId}?opId=${opId}` : `/retaining-wall-wizard/${aId}`,    newPath: (aId) => `/retaining-wall-wizard/${aId}`,     icon: Layers,        color: "zinc" },
  "Pathway / Steps":                  { dataKey: "stepping_stone_data", summaryPath: (aId, opId) => `/stepping-stone-summary/${aId}?opId=${opId}`,        wizardPath: (aId, opId) => opId ? `/stepping-stone-wizard/${aId}?opId=${opId}` : `/stepping-stone-wizard/${aId}`,    newPath: (aId) => `/stepping-stone-wizard/${aId}`,     icon: Layers,        color: "indigo" },
};

const colorMap = {
  blue:   { icon: "text-blue-700",   iconBg: "bg-blue-100",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
  amber:  { icon: "text-amber-700",  iconBg: "bg-amber-100",  badge: "bg-amber-50 text-amber-700 border-amber-200" },
  green:  { icon: "text-green-700",  iconBg: "bg-green-100",  badge: "bg-green-50 text-green-700 border-green-200" },
  orange: { icon: "text-orange-700", iconBg: "bg-orange-100", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  red:    { icon: "text-red-700",    iconBg: "bg-red-100",    badge: "bg-red-50 text-red-700 border-red-200" },
  purple: { icon: "text-purple-700", iconBg: "bg-purple-100", badge: "bg-purple-50 text-purple-700 border-purple-200" },
  teal:   { icon: "text-teal-700",   iconBg: "bg-teal-100",   badge: "bg-teal-50 text-teal-700 border-teal-200" },
  yellow: { icon: "text-yellow-700", iconBg: "bg-yellow-100", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  sky:    { icon: "text-sky-700",    iconBg: "bg-sky-100",    badge: "bg-sky-50 text-sky-700 border-sky-200" },
  lime:   { icon: "text-lime-700",   iconBg: "bg-lime-100",   badge: "bg-lime-50 text-lime-700 border-lime-200" },
  slate:  { icon: "text-slate-700",  iconBg: "bg-slate-100",  badge: "bg-slate-50 text-slate-700 border-slate-200" },
  zinc:   { icon: "text-zinc-700",   iconBg: "bg-zinc-100",   badge: "bg-zinc-50 text-zinc-700 border-zinc-200" },
  indigo: { icon: "text-indigo-700", iconBg: "bg-indigo-100", badge: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

function getOpsForArea(area) {
  if (area.operation_type === "Site Management & Daily Cleanup") return ["Site Management & Daily Cleanup"];
  return ["Walkway/Patio", "Bed Preparation", "Rough Grading & Hauling", "Demolition & Removals", "Bed Edging", "Planting", "Mulch", "Drainage", "Lawn Repair & Install", "Boulders/Accents & Structures", "Hardscape - Repair Existing", "Maintenance", "Retaining Wall", "Pathway / Steps"];
}

function getEntryLabel(entry, idx) {
  return entry.maintenance_type || (entry.sub_type ? entry.sub_type.replace(/_/g, ' ') : `Entry #${idx + 1}`);
}

export default function ProjectSummary() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [areas, setAreas] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const resolvedId = resolveId(projectId);
      const [p, a] = await Promise.all([
        OfflineProjects.get(resolvedId),
        OfflineAreas.getByProjectId(projectId),
      ]);
      setProject(p);
      const sorted = [...a].sort((x, y) => {
        if (x.operation_type === "Site Management & Daily Cleanup") return -1;
        if (y.operation_type === "Site Management & Daily Cleanup") return 1;
        return 0;
      });
      setAreas(sorted);
      setLoading(false);
    })();
  }, [projectId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>;

  const totalOps = areas.reduce((sum, a) => {
    return sum + getOpsForArea(a).reduce((s, op) => s + parseOps(a[OP_CONFIG[op].dataKey]).length, 0);
  }, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/project/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>

      <div className="mb-8 pb-6 border-b">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{project.name} — Summary</h1>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0"
            onClick={() => generateProjectSummaryPDF({ project, areas, parseOps, OP_CONFIG, getOpsForArea, getEntryLabel })}
          >
            <Download className="h-4 w-4" /> PDF
          </Button>
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
          {project.client_name && <span>{project.client_name}</span>}
          {project.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.address}</span>}
          <span className="text-foreground font-medium">{areas.length} area{areas.length !== 1 ? "s" : ""} · {totalOps} operation{totalOps !== 1 ? "s" : ""} configured</span>
        </div>
      </div>

      <div className="space-y-3">
        {areas.map((area) => {
          const ops = getOpsForArea(area);
          const isOpen = expanded[area.id];
          const areaTotal = ops.reduce((s, op) => s + parseOps(area[OP_CONFIG[op].dataKey]).length, 0);

          return (
            <div key={area.id} className="border rounded-xl overflow-hidden">
              <button className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors" onClick={() => setExpanded(e => ({ ...e, [area.id]: !e[area.id] }))}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{area.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{areaTotal} operation{areaTotal !== 1 ? "s" : ""} configured</p>
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t divide-y">
                  {ops.filter(op => parseOps(area[OP_CONFIG[op].dataKey]).length > 0).map(op => {
                    const cfg = OP_CONFIG[op];
                    const entries = parseOps(area[cfg.dataKey]);
                    const Icon = cfg.icon;
                    const c = colorMap[cfg.color];

                    return (
                      <div key={op} className="px-4 py-3">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`h-7 w-7 rounded-lg ${entries.length > 0 ? c.iconBg : "bg-muted"} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`h-3.5 w-3.5 ${entries.length > 0 ? c.icon : "text-muted-foreground"}`} />
                          </div>
                          <p className="text-sm font-medium flex-1">{op}</p>
                          {entries.some(e => e._flags?.length > 0) && (
                            <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                              <Flag className="h-3 w-3" fill="currentColor" /> Flagged
                            </span>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => navigate(cfg.newPath(area.id))}>
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </Button>
                        </div>
                        {entries.length > 0 ? (
                          <div className="ml-10 space-y-1">
                            {entries.map((entry, idx) => (
                              <div key={entry.id} className={`text-xs rounded-lg px-3 py-1.5 ${entry._flags?.length > 0 ? "bg-orange-50 border border-orange-200" : "bg-muted/40"}`}>
                                 <div className="flex items-center gap-2">
                                   <span className="flex-1 capitalize font-medium">{getEntryLabel(entry, idx)}</span>
                                   <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => navigate(cfg.wizardPath(area.id, entry.id))}>
                                     <Pencil className="h-3 w-3 mr-1" /> Edit
                                   </Button>
                                   <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => navigate(cfg.summaryPath(area.id, entry.id) + "&from=project-summary")}>
                                     <FileText className="h-3 w-3 mr-1" /> View
                                   </Button>
                                 </div>
                                 {entry._flags?.length > 0 && (
                                   <div className="mt-1 flex flex-wrap gap-1">
                                     {entry._flags.map(fk => (
                                       <span key={fk} className="inline-flex items-center gap-1 text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded">
                                         <Flag className="h-2.5 w-2.5" fill="currentColor" />
                                         {(entry._flag_labels && entry._flag_labels[fk]) || fk}
                                       </span>
                                     ))}
                                   </div>
                                 )}
                               </div>
                            ))}
                          </div>
                        ) : (
                          <p className="ml-10 text-xs text-muted-foreground italic">No data</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}