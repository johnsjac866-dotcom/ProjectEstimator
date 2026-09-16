import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pencil, Flag } from "lucide-react";
import { RG_FIELDS, getRGSubTypeLabel, getRGCategory, calcCY, calcCYFluff, calcEstimatedTons } from "@/lib/roughGradingStages";

function parseOps(jsonStr) {
  try { const p = JSON.parse(jsonStr || '[]'); if (Array.isArray(p)) return p; if (p && typeof p === 'object' && Object.keys(p).length > 0) return [{ ...p, id: 'legacy' }]; } catch {}
  return [];
}

export default function RoughGradingSummary() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const opId = new URLSearchParams(window.location.search).get('opId');
  const from = new URLSearchParams(window.location.search).get('from');
  const [area, setArea] = useState(null);
  const [project, setProject] = useState(null);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      setArea(a);
      const p = await OfflineProjects.get(a.project_id);
      setProject(p);
      const ops = parseOps(a.rough_grading_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const fields = RG_FIELDS[data.sub_type] || { step2: [], step3: [] };
  const category = getRGCategory(data.sub_type);
  const subLabel = getRGSubTypeLabel(data.sub_type);
  const flags = data._flags || [];
  const flagLabels = data._flag_labels || {};
  const isFlagged = (key) => flags.includes(key);
  const cy = data.cy ? Number(data.cy) : calcCY(data.sf, data.depth_inches);
  const cyFluff = data.cy_fluff ? Number(data.cy_fluff) : calcCYFluff(cy);
  const estTons = calcEstimatedTons(cy, data.disposal_material_type, data.disposal_dry_wet);

  function Row({ fieldKey, label, value, unit }) {
    const flagged = isFlagged(fieldKey);
    const hasValue = value != null && value !== '' && !(Array.isArray(value) && value.length === 0);
    return (
      <div className={`flex items-start gap-2 text-sm py-1.5 ${flagged ? 'bg-orange-50 -mx-2 px-2 rounded' : ''}`}>
        {flagged
          ? <Flag className="h-3.5 w-3.5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />
          : <span className="h-2 w-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />}
        <span className="text-muted-foreground flex-shrink-0">{label}:</span>
        {hasValue
          ? <span className="font-medium">{Array.isArray(value) ? value.join(', ') : value}{unit ? ` ${unit}` : ''}</span>
          : <span className="font-medium text-orange-600 italic">Missing — needs review</span>}
      </div>
    );
  }

  function handleEdit() {
    // Navigate to the wizard in edit mode; the wizard auto-scrolls to the first flag
    navigate(`/rough-grading-wizard/${areaId}?opId=${opId || data.id}`);
  }

  // Build the full ordered field list for display
  const step2Fields = [
    { key: 'sf_length', label: 'Length (ft)' },
    { key: 'sf_width', label: 'Width (ft)' },
    { key: 'sf', label: 'Square Footage' },
    { key: 'depth_inches', label: 'Depth (inches)' },
    ...fields.step2,
  ];
  // Add soil_types for importation
  if (data.sub_type === 'importation_hand' || data.sub_type === 'importation_machine') {
    step2Fields.push({ key: 'soil_types', label: 'Soil Type(s)' });
  }

  // Build step3 fields, injecting disposal details for excavation_machine
  const step3Fields = [];
  for (const f of fields.step3) {
    step3Fields.push(f);
    if (f.key === 'disposal_needed' && data.sub_type === 'excavation_machine' && data.disposal_needed === 'Yes') {
      step3Fields.push(
        { key: 'disposal_material_type', label: 'Disposal Material Type' },
        { key: 'disposal_dry_wet', label: 'Dry or Wet' },
        { key: 'disposal_fees', label: 'Disposal Fees' },
      );
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
      </div>

      {flags.length > 0 && (
        <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-orange-50 border border-orange-300 text-orange-800 text-sm">
          <Flag className="h-4 w-4 flex-shrink-0" fill="currentColor" />
          <span className="font-medium">{flags.length} field{flags.length > 1 ? 's' : ''} need review.</span>
          <span className="text-orange-600">Click Edit to go straight to the first flagged item.</span>
        </div>
      )}

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Rough Grading &amp; Hauling Summary</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name}</span></div>
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{project?.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{project?.address || "—"}</span></div>
            <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{area?.name}</span></div>
          </div>
        </div>

        {/* Category */}
        {category && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Estimate Category</h2>
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-orange-50 border border-orange-200 text-orange-800">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              {category}
            </div>
          </div>
        )}

        {/* Sub-type */}
        <div>
          <Row fieldKey="sub_type" label="Sub-type" value={subLabel} />
        </div>

        {/* Measurements & Calculations */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements &amp; Calculations</h3>
          <div className="space-y-1">
            <Row fieldKey="sf_length" label="Length" value={data.sf_length} unit="ft" />
            <Row fieldKey="sf_width" label="Width" value={data.sf_width} unit="ft" />
            <Row fieldKey="sf" label="Square Footage" value={data.sf} unit="SF" />
            <Row fieldKey="depth_inches" label="Depth" value={data.depth_inches} unit="in" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {cy != null && (
              <div className="text-sm">
                <p className="text-xs text-muted-foreground">Cubic Yards</p>
                <p className="font-medium">{cy} CY</p>
              </div>
            )}
            {cyFluff != null && (
              <div className="text-sm bg-orange-50 border border-orange-200 rounded-lg p-2">
                <p className="text-xs text-orange-700 font-semibold">CY + 25% Fluff Factor</p>
                <p className="font-bold text-lg text-orange-800">{cyFluff} CY</p>
              </div>
            )}
          </div>
        </div>

        {/* Step 2 fields (time, machine, distance, etc.) */}
        {step2Fields.filter(f => !['sf_length', 'sf_width', 'sf', 'depth_inches'].includes(f.key)).length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements &amp; Logistics</h3>
            <div className="space-y-1">
              {step2Fields
                .filter(f => !['sf_length', 'sf_width', 'sf', 'depth_inches'].includes(f.key))
                .map(f => <Row key={f.key} fieldKey={f.key} label={f.label} value={data[f.key]} unit={f.key === 'time_estimate' ? 'hrs' : f.key.includes('distance') || f.key.includes('width') ? 'ft' : ''} />)}
            </div>
          </div>
        )}

        {/* Step 3 fields (details & constraints) */}
        {step3Fields.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Details &amp; Constraints</h3>
            <div className="space-y-1">
              {step3Fields.map(f => {
                const show = !f.condition || data[f.condition.key] === f.condition.value;
                if (!show) return null;
                let val = data[f.key];
                let unit = '';
                if (f.key === 'ramps_needed') unit = '';
                if (f.key === 'disposal_fees') val = Array.isArray(val) ? val : (val ? [val] : []);
                return <Row key={f.key} fieldKey={f.key} label={f.label} value={val} unit={unit} />;
              })}
            </div>
          </div>
        )}

        {/* Estimated tons (excavation_machine disposal) */}
        {estTons != null && (
          <div className="border rounded-lg p-4 bg-orange-50/40">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-orange-800 mb-3">Disposal Weight Estimate</h3>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">Estimated weight:</span>
              <span className="font-bold text-orange-800">{estTons} tons</span>
              <span className="text-xs text-muted-foreground">({data.disposal_material_type}, {data.disposal_dry_wet})</span>
            </div>
          </div>
        )}

        {data.notes && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Notes</h3>
            <p className="text-sm">{data.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}