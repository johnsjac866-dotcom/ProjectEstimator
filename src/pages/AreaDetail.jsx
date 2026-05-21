import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, FileText, Settings, Leaf, Plus, CheckCircle2, Circle, Shovel, Hammer, Pencil, ChevronDown, ChevronRight } from "lucide-react";
import { parseOps } from "@/lib/opsUtils";

const ALL_OPERATIONS = [
  { type: "Site Management & Daily Cleanup", dataKey: "site_mgmt_data", wizardPath: (id) => `/site-management-wizard/${id}`, summaryPath: (id, opId) => `/site-management-summary/${id}?opId=${opId}`, icon: Settings, color: "blue", description: "Parking, access, stormwater, moving items & removal" },
  { type: "Walkway/Patio", dataKey: "patio_data", wizardPath: (id) => `/patio-wizard/${id}`, summaryPath: (id, opId) => `/patio-summary/${id}?opId=${opId}`, icon: ClipboardList, color: "amber", description: "Patio & walkway stages, materials and measurements" },
  { type: "Bed Preparation", dataKey: "bed_prep_data", wizardPath: (id) => `/bed-prep-wizard/${id}`, summaryPath: (id, opId) => `/bed-prep-summary/${id}?opId=${opId}`, icon: Leaf, color: "green", description: "Till, no-till, lawn or reprofiling configuration" },
  { type: "Rough Grading & Hauling", dataKey: "rough_grading_data", wizardPath: (id) => `/rough-grading-wizard/${id}`, summaryPath: (id, opId) => `/rough-grading-summary/${id}?opId=${opId}`, icon: Shovel, color: "orange", description: "Excavation, exportation, soil importation & spreading" },
  { type: "Demolition & Removals", dataKey: "demolition_data", wizardPath: (id) => `/demolition-wizard/${id}`, summaryPath: (id, opId) => `/demolition-summary/${id}?opId=${opId}`, icon: Hammer, color: "red", description: "Hardscape and vegetation/softscape demolition & removals" },
];

function getOperationsForArea(area) {
  if (area.operation_type === "Site Management & Daily Cleanup") return ALL_OPERATIONS.filter(op => op.type === "Site Management & Daily Cleanup");
  return ALL_OPERATIONS.filter(op => op.type !== "Site Management & Daily Cleanup");
}

const colorMap = {
  blue:   { bg: "bg-blue-50/50",   border: "border-blue-200",   icon: "text-blue-700",   iconBg: "bg-blue-100" },
  amber:  { bg: "bg-amber-50/50",  border: "border-amber-200",  icon: "text-amber-700",  iconBg: "bg-amber-100" },
  green:  { bg: "bg-green-50/50",  border: "border-green-200",  icon: "text-green-700",  iconBg: "bg-green-100" },
  orange: { bg: "bg-orange-50/50", border: "border-orange-200", icon: "text-orange-700", iconBg: "bg-orange-100" },
  red:    { bg: "bg-red-50/50",    border: "border-red-200",    icon: "text-red-700",    iconBg: "bg-red-100" },
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

  useEffect(() => { loadArea(); }, [areaId]);

  async function loadArea() {
    const a = await base44.entities.Area.get(areaId);
    setArea(a);
    setLoading(false);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!area) return <div className="text-center py-20 text-muted-foreground">Area not found</div>;

  const OPERATIONS = getOperationsForArea(area);
  const totalEntries = OPERATIONS.reduce((sum, op) => sum + parseOps(area[op.dataKey]).length, 0);

  return (
    <div>
      <Link to={`/project/${area.project_id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-1">{area.name}</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {totalEntries === 0 ? "No operations configured yet" : `${totalEntries} operation${totalEntries !== 1 ? "s" : ""} configured`}
      </p>

      <div className="max-w-lg space-y-3">
        {OPERATIONS.map((op) => {
          const entries = parseOps(area[op.dataKey]);
          const hasData = entries.length > 0;
          const Icon = op.icon;
          const c = colorMap[op.color];
          const isOpen = expanded[op.type];

          return (
            <div key={op.type} className={`rounded-xl border transition-all ${hasData ? `${c.bg} ${c.border}` : "border-border bg-card"}`}>
              <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setExpanded(e => ({ ...e, [op.type]: !e[op.type] }))}>
                <div className={`h-9 w-9 rounded-lg ${hasData ? c.iconBg : "bg-muted"} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${hasData ? c.icon : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{op.type}</p>
                  <p className="text-xs text-muted-foreground">{hasData ? `${entries.length} entry${entries.length !== 1 ? " entries" : ""}` : op.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasData ? <CheckCircle2 className={`h-4 w-4 ${c.icon}`} /> : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-inherit pt-3 space-y-2">
                  {entries.map((entry, idx) => (
                    <div key={entry.id} className="flex items-center gap-2 bg-background/70 rounded-lg px-3 py-2 border border-inherit">
                      <span className="text-xs font-medium flex-1 capitalize">{getEntryLabel(entry, idx)}</span>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => navigate(`${op.wizardPath(areaId)}?opId=${entry.id}`)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => navigate(op.summaryPath(areaId, entry.id))}>
                        <FileText className="h-3.5 w-3.5 mr-1" /> View
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-1" onClick={() => navigate(op.wizardPath(areaId))}>
                    <Plus className="h-4 w-4 mr-2" /> Add {entries.length > 0 ? "Another" : "First"} {op.type}
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}