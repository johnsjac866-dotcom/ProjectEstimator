import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, FileText, Settings, Leaf, Plus, CheckCircle2, Circle } from "lucide-react";

const OPERATIONS = [
  {
    type: "Site Management & Daily Cleanup",
    dataKey: "site_mgmt_data",
    wizardPath: (id) => `/site-management-wizard/${id}`,
    summaryPath: (id) => `/site-management-summary/${id}`,
    icon: Settings,
    color: "blue",
    description: "Parking, access, stormwater, moving items & removal",
  },
  {
    type: "Walkway/Patio",
    dataKey: "patio_data",
    wizardPath: (id) => `/patio-wizard/${id}`,
    summaryPath: (id) => `/patio-summary/${id}`,
    icon: ClipboardList,
    color: "amber",
    description: "Patio & walkway stages, materials and measurements",
  },
  {
    type: "Bed Preparation",
    dataKey: "bed_prep_data",
    wizardPath: (id) => `/bed-prep-wizard/${id}`,
    summaryPath: (id) => `/bed-prep-summary/${id}`,
    icon: Leaf,
    color: "green",
    description: "Till, no-till, lawn or reprofiling configuration",
  },
];

const colorMap = {
  blue: { bg: "bg-blue-50/50", border: "border-blue-200", icon: "text-blue-700", iconBg: "bg-blue-100", dot: "bg-blue-500" },
  amber: { bg: "bg-amber-50/50", border: "border-amber-200", icon: "text-amber-700", iconBg: "bg-amber-100", dot: "bg-amber-500" },
  green: { bg: "bg-green-50/50", border: "border-green-200", icon: "text-green-700", iconBg: "bg-green-100", dot: "bg-green-500" },
};

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

  const configuredCount = OPERATIONS.filter(op => !!area[op.dataKey]).length;

  return (
    <div>
      <Link to={`/project/${area.project_id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-1">{area.name}</h1>
      <p className="text-muted-foreground text-sm mb-6">
        {configuredCount === 0 ? "No operations configured yet" : `${configuredCount} operation${configuredCount > 1 ? "s" : ""} configured`}
      </p>

      <div className="max-w-lg space-y-3">
        {OPERATIONS.map((op) => {
          const hasData = !!area[op.dataKey];
          const Icon = op.icon;
          const c = colorMap[op.color];
          const isOpen = expanded[op.type];

          return (
            <div key={op.type} className={`rounded-xl border transition-all ${hasData ? `${c.bg} ${c.border}` : "border-border bg-card"}`}>
              <button
                className="w-full flex items-center gap-3 p-4 text-left"
                onClick={() => setExpanded(e => ({ ...e, [op.type]: !e[op.type] }))}
              >
                <div className={`h-9 w-9 rounded-lg ${hasData ? c.iconBg : "bg-muted"} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-4 w-4 ${hasData ? c.icon : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{op.type}</p>
                  <p className="text-xs text-muted-foreground">{op.description}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {hasData ? (
                    <CheckCircle2 className={`h-4 w-4 ${c.icon}`} />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40" />
                  )}
                  <Plus className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? "rotate-45" : ""}`} />
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 flex gap-2 border-t border-inherit pt-3 mt-0">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => navigate(op.wizardPath(areaId))}
                  >
                    {hasData ? "Edit Configuration" : "Start Setup"}
                  </Button>
                  {hasData && (
                    <Button className="flex-1" onClick={() => navigate(op.summaryPath(areaId))}>
                      <FileText className="h-4 w-4 mr-2" /> View Summary
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}