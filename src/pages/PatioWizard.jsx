import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, SkipForward } from "lucide-react";
import { getApplicableStages } from "@/lib/patioStages";
import WizardStep from "@/components/patio/WizardStep";

export default function PatioWizard() {
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
      if (a.patio_data) {
        try { setData(JSON.parse(a.patio_data)); } catch {}
      }
      setLoading(false);
    })();
  }, [areaId]);

  const stages = getApplicableStages(data);
  const stage = stages[currentStep];
  const isLast = currentStep === stages.length - 1;

  async function handleSave() {
    setSaving(true);
    await base44.entities.Area.update(areaId, {
      patio_data: JSON.stringify(data),
      status: "Complete",
    });
    setSaving(false);
    navigate(`/patio-summary/${areaId}`);
  }

  function handleNext() {
    if (isLast) {
      handleSave();
    } else {
      // Re-check applicable stages since data may have changed
      const newStages = getApplicableStages(data);
      const nextIdx = Math.min(currentStep + 1, newStages.length - 1);
      setCurrentStep(nextIdx);
    }
  }

  function handlePrev() {
    setCurrentStep(Math.max(0, currentStep - 1));
  }

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto">
      <Link to={`/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to Area
      </Link>

      <div className="mb-6">
        <p className="text-xs text-muted-foreground mb-2">Step {currentStep + 1} of {stages.length} — {area?.name}</p>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-amber-500 rounded-full transition-all duration-300" style={{ width: `${((currentStep + 1) / stages.length) * 100}%` }} />
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 mb-6">
        {stage && <WizardStep stage={stage} data={data} onChange={setData} />}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <div className="flex gap-2">
          {!isLast && (
            <Button variant="ghost" onClick={handleNext}>
              Skip <SkipForward className="h-4 w-4 ml-1" />
            </Button>
          )}
          <Button onClick={handleNext} disabled={saving}>
            {isLast ? (
              <>{saving ? "Saving..." : "Complete & View Summary"} <Check className="h-4 w-4 ml-2" /></>
            ) : (
              <>Next <ArrowRight className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}