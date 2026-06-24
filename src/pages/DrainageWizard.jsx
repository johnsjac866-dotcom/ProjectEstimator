import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Areas as OfflineAreas } from "@/lib/offlineStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseOps } from "@/lib/opsUtils";
import FlagField from "@/components/FlagField";
import { SelectButtons, CalcBox } from "@/components/drainage/shared";
import ExcavationSection from "@/components/drainage/ExcavationSection";
import PVCFittingsSection from "@/components/drainage/PVCFittingsSection";
import {
  MiterDrainSection, CatchBasinSection, LawnRepairNote,
  DownspoutConnectionSection, AtriumDrainSection, FreezedrainSection,
  TopsoilSection, StoneFabricSection, FrenchDrainFields, StreamBedFields,
  ImperviousMembraneFields,
} from "@/components/drainage/DrainTypeFields";

const DRAIN_TYPES = [
  "Buried Downspout", "Buried Drain", "Buried Sump Line",
  "Curtain Drain", "French Drain", "Dry Stream Bed", "Impervious Membrane",
];
const PIPE_GROUP = ["Buried Downspout", "Buried Drain", "Buried Sump Line"];
const FILTER_GROUP = ["Curtain Drain", "French Drain"];

function generateId() { return Math.random().toString(36).substr(2, 9); }

function calcCY(lf, pipeSizeIn, depthIn, wide = false) {
  if (!lf || !pipeSizeIn || !depthIn) return null;
  const widthFt = (parseFloat(pipeSizeIn) + (wide ? 12 : 6)) / 12;
  return ((parseFloat(lf) * widthFt * (parseFloat(depthIn) / 12)) / 27).toFixed(2);
}

function calcStreamStoneCY(sf, depthIn) {
  if (!sf || !depthIn) return null;
  return ((parseFloat(sf) * (parseFloat(depthIn) / 12)) / 27).toFixed(2);
}

export default function DrainageWizard() {
  const { areaId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [drainType, setDrainType] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [area, setArea] = useState(null);
  const opId = new URLSearchParams(window.location.search).get("opId");

  useEffect(() => {
    (async () => {
      const a = await OfflineAreas.get(areaId);
      if (!a) { setArea(null); return; }
      setArea(a);
      if (opId) {
        const ops = parseOps(a.drainage_data);
        const existing = ops.find(o => o.id === opId);
        if (existing) { setDrainType(existing.drain_type); setForm(existing); setStep(2); }
      }
    })();
  }, [areaId]);

  // Scroll to first flagged field
  useEffect(() => {
    if (step !== 2 || !(form._flags?.length > 0)) return;
    const timer = setTimeout(() => {
      for (const el of document.querySelectorAll('[data-flagfield]')) {
        if ((form._flags || []).includes(el.getAttribute('data-flagfield'))) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          break;
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [step]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function toggleFlag(key, label) {
    setForm(f => {
      const flags = f._flags || [];
      const flagLabels = f._flag_labels || {};
      if (flags.includes(key)) {
        const updated = { ...flagLabels }; delete updated[key];
        return { ...f, _flags: flags.filter(x => x !== key), _flag_labels: updated };
      }
      return { ...f, _flags: [...flags, key], _flag_labels: { ...flagLabels, [key]: label } };
    });
  }

  const flags = form._flags || [];
  const lf = parseFloat(form.lf) || 0;
  const pipeIn = parseFloat(form.pipe_size) || 0;
  const excDepthIn = parseFloat(form.excavation_depth) || 0;
  const streamWidth = parseFloat(form.width) || 0;
  const streamDepth = parseFloat(form.stream_depth) || 0;
  const sf = drainType === "Dry Stream Bed" && lf && streamWidth ? (lf * streamWidth).toFixed(1) : null;
  const excavCY = lf && pipeIn && excDepthIn ? calcCY(lf, pipeIn, excDepthIn, FILTER_GROUP.includes(drainType)) : null;
  const stoneCY = FILTER_GROUP.includes(drainType) && form.stone_needed === "Yes" && lf && pipeIn && excDepthIn
    ? calcCY(lf, pipeIn, excDepthIn, true) : null;
  const streamStoneCY = drainType === "Dry Stream Bed" && sf && streamDepth ? calcStreamStoneCY(sf, streamDepth) : null;
  const memL = parseFloat(form.mem_length) || 0;
  const memW = parseFloat(form.mem_width) || 0;
  const memD = parseFloat(form.mem_depth) || 0;
  const membraneCY = memL && memW && memD ? ((memL * memW * memD / 12) / 27).toFixed(2) : null;
  const topsoilSF = lf && pipeIn ? (lf * (pipeIn + 6) / 12).toFixed(0) : null;
  const topsoilCYrecommend = topsoilSF ? ((parseFloat(topsoilSF) * 0.25) / 27).toFixed(2) : null;

  async function handleSave() {
    setSaving(true);
    const ops = parseOps(area.drainage_data);
    const entry = { ...form, drain_type: drainType, sub_type: drainType, sf, excavCY, stoneCY, streamStoneCY, membraneCY };
    const updated = opId ? ops.map(o => o.id === opId ? entry : o) : [...ops, { ...entry, id: generateId() }];
    await OfflineAreas.update(areaId, { drainage_data: JSON.stringify(updated) });
    setSaving(false);
    navigate(`/area/${areaId}`);
  }

  if (area === null) return <div className="text-center py-20 text-muted-foreground"><p>Area not found.</p></div>;

  const isPipe = PIPE_GROUP.includes(drainType);
  const isFilter = FILTER_GROUP.includes(drainType);
  const isStream = drainType === "Dry Stream Bed";
  const isMembrane = drainType === "Impervious Membrane";

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Drainage</h1>
        <p className="text-muted-foreground text-sm mt-1">{area.name}</p>
        <div className="flex gap-2 mt-3">
          {[1, 2].map(n => <div key={n} className={`h-1.5 rounded-full flex-1 transition-colors ${n <= step ? "bg-primary" : "bg-muted"}`} />)}
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold mb-4">Select Drain Type</h2>
          <div className="grid grid-cols-2 gap-3">
            {DRAIN_TYPES.map(type => (
              <button key={type} type="button"
                onClick={() => { setDrainType(type); setForm({ drain_type: type, sub_type: type }); setStep(2); }}
                className="p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 text-left transition-all">
                <p className="font-medium text-sm">{type}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && drainType && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="font-semibold">{drainType}</span>
          </div>

          {isMembrane ? (
            <ImperviousMembraneFields form={form} set={set} flags={flags} toggleFlag={toggleFlag} membraneCY={membraneCY} />
          ) : (
            <>
              <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
              </FlagField>

              <FlagField fieldKey="lf" label="Linear Feet (LF)" flags={flags} onToggle={toggleFlag}>
                <Input type="number" value={form.lf || ""} onChange={e => set("lf", e.target.value)} placeholder="0" />
              </FlagField>

              {isStream && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <FlagField fieldKey="width" label="Width (ft)" flags={flags} onToggle={toggleFlag}>
                      <Input type="number" value={form.width || ""} onChange={e => set("width", e.target.value)} placeholder="0" />
                    </FlagField>
                    <FlagField fieldKey="stream_depth" label="Depth (in)" flags={flags} onToggle={toggleFlag}>
                      <Input type="number" value={form.stream_depth || ""} onChange={e => set("stream_depth", e.target.value)} placeholder="0" />
                    </FlagField>
                  </div>
                  {sf && <CalcBox label="Square Footage" value={sf} unit="SF" />}
                </>
              )}

              {(isPipe || isFilter) && (
                <FlagField fieldKey="pipe_size" label="Pipe Size (in)" flags={flags} onToggle={toggleFlag}>
                  <Input type="number" value={form.pipe_size || ""} onChange={e => set("pipe_size", e.target.value)} placeholder="e.g. 4" />
                </FlagField>
              )}

              {(isPipe || isStream) && (
                <FlagField fieldKey="existing_downspout" label="Existing Downspout?" flags={flags} onToggle={toggleFlag}>
                  <SelectButtons value={form.existing_downspout} onChange={v => set("existing_downspout", v)} options={["Yes", "No"]} />
                </FlagField>
              )}
              {isFilter && (
                <FlagField fieldKey="existing_drain" label="Existing Drain?" flags={flags} onToggle={toggleFlag}>
                  <SelectButtons value={form.existing_drain} onChange={v => set("existing_drain", v)} options={["Yes", "No"]} />
                </FlagField>
              )}
              {(form.existing_downspout === "Yes" || form.existing_drain === "Yes") && (
                <FlagField fieldKey="existing_lf" label="Existing LF" flags={flags} onToggle={toggleFlag}>
                  <Input type="number" value={form.existing_lf || ""} onChange={e => set("existing_lf", e.target.value)} placeholder="0" />
                </FlagField>
              )}

              <ExcavationSection form={form} set={set} excavCY={excavCY} drainType={drainType} flags={flags} toggleFlag={toggleFlag} />

              {drainType === "Buried Downspout" && (
                <>
                  <PVCFittingsSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <DownspoutConnectionSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <CatchBasinSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <MiterDrainSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <LawnRepairNote form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                </>
              )}

              {drainType === "Buried Drain" && (
                <>
                  <CatchBasinSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <AtriumDrainSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <PVCFittingsSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <MiterDrainSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <LawnRepairNote form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                </>
              )}

              {drainType === "Buried Sump Line" && (
                <>
                  <PVCFittingsSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <FreezedrainSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <MiterDrainSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                  <TopsoilSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} topsoilCYrecommend={topsoilCYrecommend} />
                  <LawnRepairNote form={form} set={set} flags={flags} toggleFlag={toggleFlag} />
                </>
              )}

              {drainType === "Curtain Drain" && (
                <StoneFabricSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} stoneCY={stoneCY} />
              )}

              {drainType === "French Drain" && (
                <FrenchDrainFields form={form} set={set} flags={flags} toggleFlag={toggleFlag} stoneCY={stoneCY} />
              )}

              {isStream && (
                <StreamBedFields form={form} set={set} flags={flags} toggleFlag={toggleFlag} streamStoneCY={streamStoneCY} />
              )}
            </>
          )}

          <FlagField fieldKey="notes" label="Additional Notes" flags={flags} onToggle={toggleFlag}>
            <Textarea value={form.notes || ""} onChange={e => set("notes", e.target.value)} placeholder="Any additional notes..." rows={3} />
          </FlagField>

          <Button className="w-full" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}