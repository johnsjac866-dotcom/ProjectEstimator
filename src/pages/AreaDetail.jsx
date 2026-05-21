import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ClipboardList, FileText, Settings } from "lucide-react";

export default function AreaDetail() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [area, setArea] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadArea(); }, [areaId]);

  async function loadArea() {
    const a = await base44.entities.Area.get(areaId);
    setArea(a);
    setLoading(false);
  }

  async function selectOperation() {
    await base44.entities.Area.update(areaId, { operation_type: "Walkway/Patio", status: "In Progress" });
    navigate(`/patio-wizard/${areaId}`);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;
  if (!area) return <div className="text-center py-20 text-muted-foreground">Area not found</div>;

  const hasPatio = area.operation_type === "Walkway/Patio";
  const isSiteManagement = area.operation_type === "Site Management & Daily Cleanup";
  const hasData = hasPatio ? !!area.patio_data : !!area.site_mgmt_data;

  return (
    <div>
      <Link to={`/project/${area.project_id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-1">{area.name}</h1>
      <p className="text-muted-foreground text-sm mb-6">Select an operation for this area</p>

      <div className="max-w-md space-y-3">
        {isSiteManagement ? (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-blue-50/50 border-blue-200">
              <p className="font-semibold text-sm flex items-center gap-2"><Settings className="h-4 w-4 text-blue-700" /> Site Management &amp; Daily Cleanup</p>
              <p className="text-xs text-muted-foreground mt-1">{hasData ? "Configuration complete" : "Not started"}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/site-management-wizard/${areaId}`)} variant="outline" className="flex-1">
                {hasData ? "Edit Configuration" : "Start Setup"}
              </Button>
              {hasData && (
                <Button onClick={() => navigate(`/site-management-summary/${areaId}`)} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" /> View Summary
                </Button>
              )}
            </div>
          </div>
        ) : !hasPatio ? (
          <button
            onClick={selectOperation}
            className="w-full flex items-center gap-4 p-4 rounded-lg border-2 border-dashed border-border hover:border-amber-400 hover:bg-amber-50/50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <ClipboardList className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="font-semibold text-sm">Walkway / Patio</p>
              <p className="text-xs text-muted-foreground">Configure patio/walkway stages and measurements</p>
            </div>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="p-4 rounded-lg border bg-amber-50/50 border-amber-200">
              <p className="font-semibold text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4 text-amber-700" /> Walkway / Patio</p>
              <p className="text-xs text-muted-foreground mt-1">{hasData ? "Configuration complete" : "In progress"}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate(`/patio-wizard/${areaId}`)} variant="outline" className="flex-1">
                {hasData ? "Edit Configuration" : "Continue Setup"}
              </Button>
              {hasData && (
                <Button onClick={() => navigate(`/patio-summary/${areaId}`)} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" /> View Summary
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}