import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas, Projects as OfflineProjects } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Flag, Pencil, AlertTriangle } from "lucide-react";
import { BED_FIELDS, getSubTypeLabel, getSubTypeCategory, BED_MAIN_TYPES } from "@/lib/bedPrepStages";
import { parseOps } from "@/lib/opsUtils";

function Row({ label, value, flagged }) {
  if (!value && value !== 0) return null;
  return (
    <div className={`flex items-start gap-2 text-sm ${flagged ? "text-orange-700" : ""}`}>
      <span className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${flagged ? "bg-orange-400" : "bg-blue-400"}`} />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{String(value)}</span>
      {flagged && <Flag className="h-3 w-3 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" />}
    </div>
  );
}

function FlaggedRow({ fieldKey, flags, flagLabels }) {
  if (!flags.includes(fieldKey)) return null;
  const label = flagLabels?.[fieldKey] || fieldKey;
  return (
    <div className="flex items-start gap-2 text-sm text-orange-700">
      <span className="h-2 w-2 rounded-full bg-orange-400 flex-shrink-0 mt-1.5" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium italic">Missing — needs review</span>
      <Flag className="h-3 w-3 text-orange-400 flex-shrink-0 mt-0.5" fill="currentColor" />
    </div>
  );
}

function RowOrFlag({ label, fieldKey, value, flags, flagLabels }) {
  if (value || value === 0) return <Row label={label} value={value} flagged={flags.includes(fieldKey)} />;
  if (flags.includes(fieldKey)) return <FlaggedRow fieldKey={fieldKey} flags={flags} flagLabels={flagLabels} />;
  return null;
}

export default function BedPrepSummary() {
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
      const ops = parseOps(a.bed_prep_data);
      const entry = opId ? ops.find(o => o.id === opId) : ops[0];
      setData(entry || {});
      setLoading(false);
    })();
  }, [areaId]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" /></div>;

  const fields = BED_FIELDS[data.sub_type] || { measurements: [], decisions: [], constraints: [] };
  const mainTypeLabel = BED_MAIN_TYPES.find(t => t.value === data.main_type)?.label || data.main_type;
  const subTypeLabel = getSubTypeLabel(data.sub_type);
  const category = getSubTypeCategory(data.sub_type);
  const flags = data._flags || [];
  const flagLabels = data._flag_labels || {};
  const sub = data.sub_type;

  // CY calculation helper
  function calcCY(sfVal, depthInches) {
    const sf = parseFloat(sfVal) || 0;
    if (sf <= 0 || depthInches <= 0) return null;
    return (sf * (depthInches / 12) / 27).toFixed(2);
  }

  const sf = parseFloat(data.sf) || 0;

  function renderStandardFields(fieldList) {
    return fieldList.map(field => {
      const val = data[field.key];
      if (field.type === "checkbox") {
        if (!val) return null;
        return <Row key={field.key} label={field.label} value="Yes" flagged={flags.includes(field.key)} />;
      }
      return <RowOrFlag key={field.key} label={field.label} fieldKey={field.key} value={val} flags={flags} flagLabels={flagLabels} />;
    });
  }

  function renderCustomDecisions() {
    const rows = [];

    // ── Till 1" and Till 3" ───────────────────────────────────────────────
    if (sub === "till_1in" || sub === "till_3in") {
      const depthIn = sub === "till_1in" ? 1 : 3;
      const cy = calcCY(data.sf, depthIn);
      const chickLbs = sf > 0 ? Math.ceil(sf / 1000 * 25) : null;
      rows.push(
        <RowOrFlag key="till_mode" label="Hand vs Machine" fieldKey="till_tilling_mode" value={data.till_tilling_mode} flags={flags} flagLabels={flagLabels} />,
      );
      if (data.till_tilling_mode === "Hand") {
        rows.push(
          <RowOrFlag key="th_type" label="Hand Tiller Type" fieldKey="till_hand_tiller_type" value={data.till_hand_tiller_type} flags={flags} flagLabels={flagLabels} />,
          <RowOrFlag key="th_hrs" label="Hand Tiller Unit Hours" fieldKey="till_hand_tiller_hours" value={data.till_hand_tiller_hours} flags={flags} flagLabels={flagLabels} />,
        );
      }
      if (data.till_tilling_mode === "Machine") {
        rows.push(
          <RowOrFlag key="tm_type" label="Machine Type" fieldKey="till_machine_type" value={data.till_machine_type} flags={flags} flagLabels={flagLabels} />,
          <RowOrFlag key="tm_hyd" label="Hydraulic Tiller Attachment?" fieldKey="till_hydraulic_tiller" value={data.till_hydraulic_tiller} flags={flags} flagLabels={flagLabels} />,
        );
      }
      rows.push(
        <RowOrFlag key="rr" label="Remove Rock / Debris / Roots (hrs)" fieldKey="remove_rock_hours" value={data.remove_rock_hours} flags={flags} flagLabels={flagLabels} />,
        <RowOrFlag key="fert" label="Fertilizer (hrs)" fieldKey="fertilizer_hours" value={data.fertilizer_hours} flags={flags} flagLabels={flagLabels} />,
        <RowOrFlag key="chick" label="Chicken Crumbles?" fieldKey="chicken_crumbles" value={data.chicken_crumbles} flags={flags} flagLabels={flagLabels} />,
      );
      if (data.chicken_crumbles === "Yes" && chickLbs) {
        rows.push(<div key="chick_calc" className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-sm text-blue-800"><span className="font-semibold">Lbs needed:</span> {chickLbs} lbs</div>);
      }
      rows.push(
        <RowOrFlag key="amend_type" label="Amendment Type" fieldKey="amend_amendment_type" value={data.amend_amendment_type} flags={flags} flagLabels={flagLabels} />,
      );
      if (cy && sf > 0) {
        rows.push(<div key="cy_calc" className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-sm text-blue-800"><span className="font-semibold">Cubic Yards:</span> {cy} CY ({sf} SF × {depthIn}" ÷ 12 ÷ 27)</div>);
      }
      rows.push(
        <RowOrFlag key="finish" label="Finish Bed by Hand (hrs)" fieldKey="finish_bed_hours" value={data.finish_bed_hours} flags={flags} flagLabels={flagLabels} />,
      );
    }

    // ── Lawn No Amendments ──────────────────────────────────────────────
    if (sub === "lawn_none") {
      rows.push(
        <RowOrFlag key="lm" label="Hand vs Machine" fieldKey="lawn_tilling_mode" value={data.lawn_tilling_mode} flags={flags} flagLabels={flagLabels} />,
      );
      if (data.lawn_tilling_mode === "Hand") {
        rows.push(
          <RowOrFlag key="lh_type" label="Hand Tiller Type" fieldKey="lawn_hand_tiller_type" value={data.lawn_hand_tiller_type} flags={flags} flagLabels={flagLabels} />,
          <RowOrFlag key="lh_hrs" label="Hand Tiller Unit Hours" fieldKey="lawn_hand_tiller_hours" value={data.lawn_hand_tiller_hours} flags={flags} flagLabels={flagLabels} />,
        );
      }
      if (data.lawn_tilling_mode === "Machine") {
        rows.push(
          <RowOrFlag key="lm_type" label="Machine Type" fieldKey="lawn_machine_type" value={data.lawn_machine_type} flags={flags} flagLabels={flagLabels} />,
          <RowOrFlag key="lm_hyd" label="Hydraulic Tiller Attachment?" fieldKey="lawn_hydraulic_tiller" value={data.lawn_hydraulic_tiller} flags={flags} flagLabels={flagLabels} />,
        );
      }
      rows.push(
        <RowOrFlag key="fert" label="Fertilizer (hrs)" fieldKey="fertilizer_hours" value={data.fertilizer_hours} flags={flags} flagLabels={flagLabels} />,
        <RowOrFlag key="finish" label="Finish Bed by Hand (hrs)" fieldKey="finish_bed_hours" value={data.finish_bed_hours} flags={flags} flagLabels={flagLabels} />,
      );
    }

    // ── Lawn With Amendments ────────────────────────────────────────────
    if (sub === "lawn_1in") {
      rows.push(
        <RowOrFlag key="lm" label="Hand vs Machine" fieldKey="lawn_tilling_mode" value={data.lawn_tilling_mode} flags={flags} flagLabels={flagLabels} />,
      );
      if (data.lawn_tilling_mode === "Hand") {
        rows.push(
          <RowOrFlag key="lh_type" label="Hand Tiller Type" fieldKey="lawn_hand_tiller_type" value={data.lawn_hand_tiller_type} flags={flags} flagLabels={flagLabels} />,
          <RowOrFlag key="lh_hrs" label="Hand Tiller Unit Hours" fieldKey="lawn_hand_tiller_hours" value={data.lawn_hand_tiller_hours} flags={flags} flagLabels={flagLabels} />,
        );
      }
      if (data.lawn_tilling_mode === "Machine") {
        rows.push(
          <RowOrFlag key="lm_type" label="Machine Type" fieldKey="lawn_machine_type" value={data.lawn_machine_type} flags={flags} flagLabels={flagLabels} />,
          <RowOrFlag key="lm_hyd" label="Hydraulic Tiller Attachment?" fieldKey="lawn_hydraulic_tiller" value={data.lawn_hydraulic_tiller} flags={flags} flagLabels={flagLabels} />,
        );
      }
      rows.push(
        <RowOrFlag key="fert" label="Fertilizer (hrs)" fieldKey="fertilizer_hours" value={data.fertilizer_hours} flags={flags} flagLabels={flagLabels} />,
        <RowOrFlag key="finish" label="Finish Bed by Hand (hrs)" fieldKey="finish_bed_hours" value={data.finish_bed_hours} flags={flags} flagLabels={flagLabels} />,
        <RowOrFlag key="amend_type" label="Amendment Type" fieldKey="amend_amendment_type" value={data.amend_amendment_type} flags={flags} flagLabels={flagLabels} />,
        <RowOrFlag key="amend_depth" label="Amendment Depth (in)" fieldKey="amend_amendment_depth_in" value={data.amend_amendment_depth_in} flags={flags} flagLabels={flagLabels} />,
      );
      const cy = calcCY(data.sf, parseFloat(data.amend_amendment_depth_in) || 0);
      if (cy && sf > 0) {
        rows.push(<div key="cy_calc" className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-sm text-blue-800"><span className="font-semibold">Cubic Yards:</span> {cy} CY</div>);
      }
    }

    // ── No Till Hand ────────────────────────────────────────────────────
    if (sub === "notill_hand") {
      const cy = calcCY(data.sf, 1);
      if (cy && sf > 0) rows.push(<div key="cy_calc" className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-sm text-blue-800"><span className="font-semibold">Compost needed:</span> {cy} CY ({sf} SF × 1" ÷ 12 ÷ 27)</div>);
      rows.push(<RowOrFlag key="slope" label="Additional Time for Slopes/Distance/Challenges (hrs)" fieldKey="slope_distance_hours" value={data.slope_distance_hours} flags={flags} flagLabels={flagLabels} />);
    }

    // ── No Till Machine ─────────────────────────────────────────────────
    if (sub === "notill_machine") {
      const cy = calcCY(data.sf, 1);
      const loads = cy ? Math.ceil(parseFloat(cy) / 18) : null;
      if (cy && sf > 0) rows.push(<div key="cy_calc" className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-sm text-blue-800"><span className="font-semibold">Compost needed:</span> {cy} CY — <span className="font-semibold">Loads:</span> {loads}</div>);
      rows.push(<RowOrFlag key="nm_type" label="Machine Type" fieldKey="notill_machine_type" value={data.notill_machine_type} flags={flags} flagLabels={flagLabels} />);
    }

    // ── Reprofiling ─────────────────────────────────────────────────────
    if (sub && sub.startsWith("repro_")) {
      const chickLbs = sf > 0 && data.repro_amendments === "Yes" ? Math.ceil(sf / 1000 * 25) : null;
      rows.push(
        <RowOrFlag key="repro_till" label="Tilling Needed?" fieldKey="repro_tilling" value={data.repro_tilling} flags={flags} flagLabels={flagLabels} />,
      );
      if (data.repro_tilling === "Yes") {
        rows.push(
          <RowOrFlag key="rt_mode" label="Tilling: Hand vs Machine" fieldKey="repro_till_tilling_mode" value={data.repro_till_tilling_mode} flags={flags} flagLabels={flagLabels} />,
        );
        if (data.repro_till_tilling_mode === "Hand") {
          rows.push(
            <RowOrFlag key="rth_type" label="Hand Tiller Type" fieldKey="repro_till_hand_tiller_type" value={data.repro_till_hand_tiller_type} flags={flags} flagLabels={flagLabels} />,
            <RowOrFlag key="rth_hrs" label="Hand Tiller Unit Hours" fieldKey="repro_till_hand_tiller_hours" value={data.repro_till_hand_tiller_hours} flags={flags} flagLabels={flagLabels} />,
          );
        }
        if (data.repro_till_tilling_mode === "Machine") {
          rows.push(
            <RowOrFlag key="rtm_type" label="Machine Type" fieldKey="repro_till_machine_type" value={data.repro_till_machine_type} flags={flags} flagLabels={flagLabels} />,
            <RowOrFlag key="rtm_hyd" label="Hydraulic Tiller Attachment?" fieldKey="repro_till_hydraulic_tiller" value={data.repro_till_hydraulic_tiller} flags={flags} flagLabels={flagLabels} />,
          );
        }
      }
      rows.push(
        <RowOrFlag key="rr" label="Remove Rock / Debris / Roots (hrs)" fieldKey="remove_rock_hours" value={data.remove_rock_hours} flags={flags} flagLabels={flagLabels} />,
        <RowOrFlag key="ra" label="Amendments Needed?" fieldKey="repro_amendments" value={data.repro_amendments} flags={flags} flagLabels={flagLabels} />,
      );
      if (data.repro_amendments === "Yes") {
        rows.push(
          <RowOrFlag key="ra_type" label="Amendment Type" fieldKey="repro_amend_amendment_type" value={data.repro_amend_amendment_type} flags={flags} flagLabels={flagLabels} />,
          <RowOrFlag key="ra_depth" label="Amendment Depth (in)" fieldKey="repro_amend_amendment_depth_in" value={data.repro_amend_amendment_depth_in} flags={flags} flagLabels={flagLabels} />,
        );
        const cy = calcCY(data.sf, parseFloat(data.repro_amend_amendment_depth_in) || 0);
        if (cy && sf > 0) rows.push(<div key="cy_calc" className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-sm text-blue-800"><span className="font-semibold">Cubic Yards:</span> {cy} CY</div>);
        rows.push(
          <RowOrFlag key="rc" label="Chicken Crumbles?" fieldKey="repro_chicken_crumbles" value={data.repro_chicken_crumbles} flags={flags} flagLabels={flagLabels} />,
        );
        if (data.repro_chicken_crumbles === "Yes" && chickLbs) {
          rows.push(<div key="chick_calc" className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-sm text-blue-800"><span className="font-semibold">Lbs needed:</span> {chickLbs} lbs</div>);
        }
      }
      rows.push(
        <RowOrFlag key="fert" label="Fertilizer (hrs)" fieldKey="fertilizer_hours" value={data.fertilizer_hours} flags={flags} flagLabels={flagLabels} />,
        <RowOrFlag key="finish" label="Finish Bed by Hand (hrs)" fieldKey="finish_bed_hours" value={data.finish_bed_hours} flags={flags} flagLabels={flagLabels} />,
      );
    }

    return rows;
  }

  // Filter out time_estimate and sf from measurements to render separately
  const measurementFields = fields.measurements.filter(f => f.key !== "time_estimate");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link to={from === 'project-summary' ? `/project-summary/${area?.project_id}` : `/area/${areaId}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {from === 'project-summary' ? 'Back to Project Summary' : 'Back to Area'}
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/bed-prep-wizard/${areaId}?opId=${opId || data.id}`)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-8 print:border-0 space-y-6">
        {/* Header */}
        <div className="border-b pb-6">
          <h1 className="text-2xl font-bold">Bed Preparation Summary</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            <div><span className="text-muted-foreground">Project:</span> <span className="font-medium">{project?.name}</span></div>
            <div><span className="text-muted-foreground">Client:</span> <span className="font-medium">{project?.client_name || "—"}</span></div>
            <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{project?.address || "—"}</span></div>
            <div><span className="text-muted-foreground">Area:</span> <span className="font-medium">{area?.name}</span></div>
          </div>
        </div>

        {/* Flags banner */}
        {flags.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-orange-700 bg-orange-50 border border-orange-300 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">{flags.length} item{flags.length !== 1 ? "s" : ""} flagged for review.</span>
            <span className="text-orange-600">Click Edit to go straight to the first flagged item.</span>
          </div>
        )}

        {/* Estimate Category */}
        {category && (
          <div>
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Estimate Category</h2>
            <div className="flex items-center gap-2 text-sm py-1.5 px-3 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {category}
            </div>
          </div>
        )}

        {/* Type */}
        <div className="text-sm">
          <span className="text-muted-foreground">Type:</span>{" "}
          <span className="font-medium">{mainTypeLabel}</span>
          {subTypeLabel && <> — <span className="font-semibold text-primary">{subTypeLabel}</span></>}
        </div>

        {/* Measurements */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Measurements</h3>
          <div className="space-y-2">
            <RowOrFlag label="Time Estimate" fieldKey="time_estimate" value={data.time_estimate ? `${data.time_estimate} hrs` : null} flags={flags} flagLabels={flagLabels} />
            {measurementFields.map(field => (
              <RowOrFlag key={field.key} label={field.label} fieldKey={field.key} value={data[field.key]} flags={flags} flagLabels={flagLabels} />
            ))}
            {data.sf_length && data.sf_width && (
              <Row label="Dimensions" value={`${data.sf_length} ft × ${data.sf_width} ft`} />
            )}
            {data.sf && <Row label="Square Feet" value={`${data.sf} SF`} flagged={flags.includes("sf")} />}
          </div>
        </div>

        {/* Decisions (custom + standard) */}
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Decisions</h3>
          <div className="space-y-2">
            {renderCustomDecisions()}
            {fields.decisions.length > 0 && fields.decisions.map(field => (
              <RowOrFlag key={field.key} label={field.label} fieldKey={field.key} value={data[field.key]} flags={flags} flagLabels={flagLabels} />
            ))}
          </div>
        </div>

        {/* Constraints */}
        {fields.constraints.length > 0 && (
          <div className="border rounded-lg p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Constraints / Risk Factors</h3>
            <div className="space-y-2">
              {fields.constraints.map(field => (
                <RowOrFlag key={field.key} label={field.label} fieldKey={field.key} value={data[field.key]} flags={flags} flagLabels={flagLabels} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}