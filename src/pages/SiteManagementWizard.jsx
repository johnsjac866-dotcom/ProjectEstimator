import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, SkipForward } from "lucide-react";
import { SM_STAGES } from "@/lib/siteManagementStages";
import SMWizardStep from "@/components/siteManagement/SMWizardStep";

export default function SiteManagementWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [area, setArea] = useState(null);
  const [data, setData] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const a = await base44.entities.Area.get(areaId);
      setArea(a);
      if (a.site_mgmt_data) {
        try { setData(JSON.parse(a.site_mgmt_data)); } catch {}
      }
      setLoading(false);
    })();
  }, [areaId]);

  const stage = SM_STAGES[currentStep];
  const isLast = currentStep === SM_STAGES.length - 1;

  async function handleSave() {
    setSaving(true);
    await base44.entities.Area.update(areaId, {
      site_mgmt_data: JSON.stringify(data),
      status: "Complete",
    });
    setSaving(false);
    navigate(`/site-management-summary/${areaId}`);
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>

      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2">Step {currentStep + 1} of {SM_STAGES.length} — {area?.name}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / SM_STAGES.length) * 100}%` }} />
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-6">
        <SMWizardStep stage={stage} data={data} onChange={setData} />
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(s => Math.max(0, s - 1))} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <div className="flex gap-2">
          {!isLast && (
            <Button variant="ghost" onClick={() => setCurrentStep(s => s + 1)}>
              Skip <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button onClick={isLast ? handleSave : () => setCurrentStep(s => s + 1)} disabled={saving}>
            {isLast ? <>{saving ? "Saving..." : "Complete & View Summary"} <Check className="h-4 w-4 ml-2" /></> : <>Next <ArrowRight className="h-4 w-4 ml-2" /></>}
          </Button>
        </div>
      </div>
    </div>
  );
}