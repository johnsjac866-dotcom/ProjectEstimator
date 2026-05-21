import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Settings, ClipboardList, Leaf, Shovel, Hammer, ChevronDown, ChevronRight, FileText, Circle, CheckCircle2 } from "lucide-react";

const OP_CONFIG = {
  "Site Management & Daily Cleanup": { dataKey: "site_mgmt_data",    summaryPath: (id) => `/site-management-summary/${id}`, icon: Settings,    color: "blue" },
  "Walkway/Patio":                   { dataKey: "patio_data",         summaryPath: (id) => `/patio-summary/${id}`,            icon: ClipboardList, color: "amber" },
  "Bed Preparation":                  { dataKey: "bed_prep_data",      summaryPath: (id) => `/bed-prep-summary/${id}`,          icon: Leaf,          color: "green" },
  "Rough Grading & Hauling":          { dataKey: "rough_grading_data", summaryPath: (id) => `/rough-grading-summary/${id}`,     icon: Shovel,        color: "orange" },
  "Demolition & Removals":            { dataKey: "demolition_data",    summaryPath: (id) => `/demolition-summary/${id}`,           icon: Hammer,        color: "red" },
};

const colorMap = {
  blue:   { icon: "text-blue-700",   iconBg: "bg-blue-100",   badge: "bg-blue-50 text-blue-700 border-blue-200" },
  amber:  { icon: "text-amber-700",  iconBg: "bg-amber-100",  badge: "bg-amber-50 text-amber-700 border-amber-200" },
  green:  { icon: "text-green-700",  iconBg: "bg-green-100",  badge: "bg-green-50 text-green-700 border-green-200" },
  orange: { icon: "text-orange-700", iconBg: "bg-orange-100", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  red:    { icon: "text-red-700",    iconBg: "bg-red-100",    badge: "bg-red-50 text-red-700 border-red-200" },
};

// Which operations to show per area type
function getOpsForArea(area) {
  if (area.operation_type === "Site Management & Daily Cleanup") {
    return ["Site Management & Daily Cleanup"];
  }
  return ["Walkway/Patio", "Bed Preparation", "Rough Grading & Hauling", "Demolition & Removals"];
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
      const [p, a] = await Promise.all([
        base44.entities.Project.get(projectId),
        base44.entities.Area.filter({ project_id: projectId }),
      ]);
      setProject(p);
      // Site Management first
      const sorted = [...a].sort((x, y) => {
        if (x.operation_type === "Site Management & Daily Cleanup") return -1;
        if (y.operation_type === "Site Management & Daily Cleanup") return 1;
        return 0;
      });
      setAreas(sorted);
      setLoading(false);
    })();
  }, [projectId]);

  function toggle(areaId) {
    setExpanded(e => ({ ...e, [areaId]: !e[areaId] }));
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!project) return <div className="text-center py-20 text-muted-foreground">Project not found</div>;

  const totalOps = areas.reduce((sum, a) => {
    return sum + getOpsForArea(a).filter(op => !!a[OP_CONFIG[op].dataKey]).length;
  }, 0);

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/project/${projectId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>

      <div className="mb-8 pb-6 border-b">
        <h1 className="text-2xl font-bold tracking-tight">{project.name} — Summary</h1>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
          {project.client_name && <span>{project.client_name}</span>}
          {project.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.address}</span>}
          <span className="text-foreground font-medium">{areas.length} area{areas.length !== 1 ? "s" : ""} · {totalOps} operation{totalOps !== 1 ? "s" : ""} configured</span>
        </div>
      </div>

      <div className="space-y-3">
        {areas.map((area) => {
          const ops = getOpsForArea(area);
          const configuredOps = ops.filter(op => !!area[OP_CONFIG[op].dataKey]);
          const isOpen = expanded[area.id];

          return (
            <div key={area.id} className="border rounded-xl overflow-hidden">
              {/* Area header */}
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
                onClick={() => toggle(area.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{area.name}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {ops.map(op => {
                      const hasData = !!area[OP_CONFIG[op].dataKey];
                      const c = colorMap[OP_CONFIG[op].color];
                      return (
                        <span key={op} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${hasData ? c.badge : "bg-muted text-muted-foreground border-border"}`}>
                          {hasData ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                          {op}
                        </span>
                      );
                    })}
                  </div>
                </div>
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
              </button>

              {/* Operations list */}
              {isOpen && (
                <div className="border-t divide-y">
                  {ops.map(op => {
                    const cfg = OP_CONFIG[op];
                    const hasData = !!area[cfg.dataKey];
                    const Icon = cfg.icon;
                    const c = colorMap[cfg.color];

                    return (
                      <div key={op} className="flex items-center gap-3 px-4 py-3">
                        <div className={`h-8 w-8 rounded-lg ${hasData ? c.iconBg : "bg-muted"} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`h-4 w-4 ${hasData ? c.icon : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{op}</p>
                          <p className="text-xs text-muted-foreground">{hasData ? "Configured" : "Not started"}</p>
                        </div>
                        {hasData ? (
                          <Button size="sm" variant="outline" onClick={() => navigate(cfg.summaryPath(area.id))}>
                            <FileText className="h-3.5 w-3.5 mr-1.5" /> View
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No data</span>
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