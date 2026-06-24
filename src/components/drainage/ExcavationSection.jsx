import { Input } from "@/components/ui/input";
import FlagField from "@/components/FlagField";
import { SelectButtons, CalcBox, SoilMultiSelect } from "./shared";

export default function ExcavationSection({ form, set, excavCY, drainType, flags, toggleFlag }) {
  const soilComp = form.soil_composition || [];
  const toggleSoil = (v) => set("soil_composition", v);

  return (
    <div className="space-y-3 border rounded-lg p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Excavation</p>

      <FlagField fieldKey="excavation_mode" label="Excavation Method" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.excavation_mode} onChange={v => set("excavation_mode", v)} options={["Machine", "Hand"]} />
      </FlagField>

      {form.excavation_mode === "Machine" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
          <p className="text-xs text-amber-700 font-medium">⚠️ Check access before proceeding</p>
          <FlagField fieldKey="excavation_machine_type" label="Machine Type" flags={flags} onToggle={toggleFlag}>
            <SelectButtons value={form.excavation_machine_type} onChange={v => set("excavation_machine_type", v)} options={["Vermeer", "Dingo"]} />
          </FlagField>
        </div>
      )}

      <FlagField fieldKey="trencher_attachment" label="Trencher or Excavator Attachment Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.trencher_attachment} onChange={v => set("trencher_attachment", v)} options={["Yes", "No"]} />
      </FlagField>

      <FlagField fieldKey="excavation_depth" label="Excavation Depth (in)" flags={flags} onToggle={toggleFlag}>
        <Input type="number" value={form.excavation_depth || ""} onChange={e => set("excavation_depth", e.target.value)} placeholder="0" />
      </FlagField>

      <FlagField fieldKey="soil_composition" label="Soil Type (select all that apply)" flags={flags} onToggle={toggleFlag}>
        <SoilMultiSelect value={soilComp} onChange={toggleSoil} />
      </FlagField>

      <FlagField fieldKey="spoil_type" label="Spoil Disposal" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.spoil_type} onChange={v => set("spoil_type", v)} options={["Remain on site", "Hauled off"]} />
      </FlagField>

      {form.spoil_type === "Hauled off" && (
        <FlagField fieldKey="disposal_site" label="Disposal Site" flags={flags} onToggle={toggleFlag}>
          <Input value={form.disposal_site || ""} onChange={e => set("disposal_site", e.target.value)} placeholder="Disposal site location" />
        </FlagField>
      )}

      {excavCY && <CalcBox label="Excavation CY" value={excavCY} unit="CY" />}

      <FlagField fieldKey="sod_removal" label="Sod Removal?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.sod_removal} onChange={v => set("sod_removal", v)} options={["Yes", "No"]} />
      </FlagField>

      {drainType === "Curtain Drain" && form.sod_removal === "Yes" && (
        <FlagField fieldKey="sod_disposal_method" label="Disposal Method" flags={flags} onToggle={toggleFlag}>
          <Input value={form.sod_disposal_method || ""} onChange={e => set("sod_disposal_method", e.target.value)} placeholder="Disposal method..." />
        </FlagField>
      )}

      <FlagField fieldKey="obstruction_hours" label="Extra Time for Rocks / Roots / Obstructions (hrs)" flags={flags} onToggle={toggleFlag}>
        <Input type="number" value={form.obstruction_hours || ""} onChange={e => set("obstruction_hours", e.target.value)} placeholder="0" />
      </FlagField>

      <FlagField fieldKey="zip_level" label="Zip Level Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.zip_level} onChange={v => set("zip_level", v)} options={["Yes", "No"]} />
      </FlagField>
    </div>
  );
}