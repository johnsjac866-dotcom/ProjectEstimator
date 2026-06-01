import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ClipboardList, FileText, Settings, Leaf, Plus, Shovel, Hammer, Pencil, ChevronDown, ChevronRight, Search, Layers, Scissors, Sprout, Wind } from "lucide-react";
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
          <p className="text-muted-foreground text-sm">
            {totalEntries === 0 ? "No operations configured yet" : `${totalEntries} operation${totalEntries !== 1 ? "s" : ""} configured`}
          </p>
        </div>
        <Button onClick={() => { setSearch(""); setShowOpPicker(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Operation
        </Button>
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
                  {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
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