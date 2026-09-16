import { Input } from "@/components/ui/input";
import FlagField from "@/components/FlagField";
import { SelectButtons } from "./shared";

const PVC_FITTINGS = [
  { k: "fit_90_long_turn", l: "90° Long Turn" },
  { k: "fit_90_tight", l: "Std 90° Tight" },
  { k: "fit_22_5_elbow", l: "22.5° Elbow" },
  { k: "fit_hub_45_elbow", l: "Hub 45° Elbow" },
  { k: "fit_tee", l: "Tee" },
  { k: "fit_wye", l: "Wye" },
  { k: "fit_cleanout", l: "Cleanout Assembly" },
];

export default function PVCFittingsSection({ form, set, flags, toggleFlag }) {
  return (
    <div className="space-y-3 border rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">PVC Supplies &amp; Fittings</p>

      <FlagField fieldKey="pvc_supplies_needed" label="PVC Glue, Primer & Supplies Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.pvc_supplies_needed} onChange={v => set("pvc_supplies_needed", v)} options={["Yes", "No"]} />
      </FlagField>

      {form.pvc_supplies_needed === "Yes" && (
        <FlagField fieldKey="pvc_supplies_count" label="Count" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.pvc_supplies_count || ""} onChange={e => set("pvc_supplies_count", e.target.value)} placeholder="0" />
        </FlagField>
      )}

      <FlagField fieldKey="pvc_fittings_needed" label="PVC Fittings Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.pvc_fittings_needed} onChange={v => set("pvc_fittings_needed", v)} options={["Yes", "No"]} />
      </FlagField>

      {form.pvc_fittings_needed === "Yes" && (
        <div className="mt-1 grid grid-cols-2 gap-2">
          {PVC_FITTINGS.map(f => (
            <FlagField key={f.k} fieldKey={f.k} label={f.l} flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form[f.k] || ""} onChange={e => set(f.k, e.target.value)} placeholder="0" />
            </FlagField>
          ))}
        </div>
      )}
    </div>
  );
}