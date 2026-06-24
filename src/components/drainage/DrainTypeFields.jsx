import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import FlagField from "@/components/FlagField";
import { SelectButtons, CalcBox } from "./shared";

export function MiterDrainSection({ form, set, flags, toggleFlag }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="miter_drain" label="Miter Drain Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.miter_drain} onChange={v => set("miter_drain", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.miter_drain === "Yes" && (
        <>
          <FlagField fieldKey="miter_drain_type" label="Heavy Duty or Light Duty?" flags={flags} onToggle={toggleFlag}>
            <SelectButtons value={form.miter_drain_type} onChange={v => set("miter_drain_type", v)} options={["Heavy duty", "Light duty"]} />
          </FlagField>
          <FlagField fieldKey="miter_drain_count" label="Count" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.miter_drain_count || ""} onChange={e => set("miter_drain_count", e.target.value)} placeholder="0" />
          </FlagField>
        </>
      )}
    </div>
  );
}

export function CatchBasinSection({ form, set, flags, toggleFlag }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="catch_basin_needed" label="Catch Basin Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.catch_basin_needed} onChange={v => set("catch_basin_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.catch_basin_needed === "Yes" && (
        <>
          <FlagField fieldKey="catch_basin_size" label="Size" flags={flags} onToggle={toggleFlag}>
            <SelectButtons value={form.catch_basin_size} onChange={v => set("catch_basin_size", v)} options={['9" × 9"', '12" × 12" with grate']} />
          </FlagField>
          <FlagField fieldKey="catch_basin_count" label="Count" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.catch_basin_count || ""} onChange={e => set("catch_basin_count", e.target.value)} placeholder="0" />
          </FlagField>
        </>
      )}
    </div>
  );
}

export function LawnRepairNote({ form, set, flags, toggleFlag }) {
  return (
    <div className="space-y-1">
      <FlagField fieldKey="lawn_repair" label="Lawn Repair Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.lawn_repair} onChange={v => set("lawn_repair", v)} options={["Yes", "No"]} />
      </FlagField>
      <p className="text-xs text-muted-foreground">⚠️ Lawn repair is not included unless work area is added.</p>
    </div>
  );
}

export function DownspoutConnectionSection({ form, set, flags, toggleFlag }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="downspout_connection_needed" label="Downspout Connection Assembly Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.downspout_connection_needed} onChange={v => set("downspout_connection_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.downspout_connection_needed === "Yes" && (
        <>
          <FlagField fieldKey="downspout_connection_size" label="Size" flags={flags} onToggle={toggleFlag}>
            <SelectButtons value={form.downspout_connection_size} onChange={v => set("downspout_connection_size", v)} options={['3" × 4"', '2" × 3"']} />
          </FlagField>
          <FlagField fieldKey="downspout_connection_count" label="Count" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.downspout_connection_count || ""} onChange={e => set("downspout_connection_count", e.target.value)} placeholder="0" />
          </FlagField>
        </>
      )}
    </div>
  );
}

export function AtriumDrainSection({ form, set, flags, toggleFlag }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="atrium_drain_needed" label="Atrium Drain Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.atrium_drain_needed} onChange={v => set("atrium_drain_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.atrium_drain_needed === "Yes" && (
        <FlagField fieldKey="atrium_drain_count" label="Count" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.atrium_drain_count || ""} onChange={e => set("atrium_drain_count", e.target.value)} placeholder="0" />
        </FlagField>
      )}
    </div>
  );
}

export function FreezedrainSection({ form, set, flags, toggleFlag }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="freezedrain_needed" label="Freezedrain Assembly Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.freezedrain_needed} onChange={v => set("freezedrain_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.freezedrain_needed === "Yes" && (
        <FlagField fieldKey="freezedrain_count" label="Count" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.freezedrain_count || ""} onChange={e => set("freezedrain_count", e.target.value)} placeholder="0" />
        </FlagField>
      )}
    </div>
  );
}

export function TopsoilSection({ form, set, flags, toggleFlag, topsoilCYrecommend }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="topsoil_needed" label="Topsoil / Screened Soil for Finish Grading?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.topsoil_needed} onChange={v => set("topsoil_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.topsoil_needed === "Yes" && (
        <>
          {topsoilCYrecommend && (
            <p className="text-xs text-muted-foreground">Recommended: ~{topsoilCYrecommend} CY based on trench dimensions</p>
          )}
          <FlagField fieldKey="topsoil_cy" label="Cubic Yards" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.topsoil_cy || ""} onChange={e => set("topsoil_cy", e.target.value)} placeholder={topsoilCYrecommend || "0"} />
          </FlagField>
        </>
      )}
    </div>
  );
}

export function StoneFabricSection({ form, set, flags, toggleFlag, stoneCY }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="stone_needed" label="Stone Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.stone_needed} onChange={v => set("stone_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.stone_needed === "Yes" && stoneCY && <CalcBox label="Stone CY" value={stoneCY} unit="CY" />}
      <FlagField fieldKey="fabric_needed" label="Fabric Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.fabric_needed} onChange={v => set("fabric_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.fabric_needed === "Yes" && (
        <FlagField fieldKey="fabric_sf" label="How Much (SF)" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.fabric_sf || ""} onChange={e => set("fabric_sf", e.target.value)} placeholder="0" />
        </FlagField>
      )}
    </div>
  );
}

export function FrenchDrainFields({ form, set, flags, toggleFlag, stoneCY }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="corrugated_tile_needed" label="Corrugated Drain Tile Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.corrugated_tile_needed} onChange={v => set("corrugated_tile_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.corrugated_tile_needed === "Yes" && (
        <div className="grid grid-cols-2 gap-2">
          <FlagField fieldKey="tile_perforated_sock_count" label="Perforated in Sock (count)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.tile_perforated_sock_count || ""} onChange={e => set("tile_perforated_sock_count", e.target.value)} placeholder="0" />
          </FlagField>
          <FlagField fieldKey="tile_solid_count" label="Solid (count)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.tile_solid_count || ""} onChange={e => set("tile_solid_count", e.target.value)} placeholder="0" />
          </FlagField>
        </div>
      )}

      <FlagField fieldKey="pvc_cleanout_needed" label="PVC Cleanout Assembly Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.pvc_cleanout_needed} onChange={v => set("pvc_cleanout_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.pvc_cleanout_needed === "Yes" && (
        <FlagField fieldKey="pvc_cleanout_count" label="Count" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.pvc_cleanout_count || ""} onChange={e => set("pvc_cleanout_count", e.target.value)} placeholder="0" />
        </FlagField>
      )}

      <FlagField fieldKey="misc_drainage_needed" label="Miscellaneous Drainage Material Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.misc_drainage_needed} onChange={v => set("misc_drainage_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.misc_drainage_needed === "Yes" && (
        <FlagField fieldKey="misc_drainage_notes" label="Description" flags={flags} onToggle={toggleFlag}>
          <Textarea value={form.misc_drainage_notes || ""} onChange={e => set("misc_drainage_notes", e.target.value)} placeholder="Describe miscellaneous drainage materials..." rows={2} />
        </FlagField>
      )}

      <FlagField fieldKey="coarse_sand_needed" label="Coarse / Washed Sand Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.coarse_sand_needed} onChange={v => set("coarse_sand_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.coarse_sand_needed === "Yes" && (
        <FlagField fieldKey="coarse_sand_tons" label="Tons" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.coarse_sand_tons || ""} onChange={e => set("coarse_sand_tons", e.target.value)} placeholder="0" />
        </FlagField>
      )}

      <FlagField fieldKey="drainage_rock_needed" label='Drainage Rock / Wash Stone 1.5" Needed?' flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.drainage_rock_needed} onChange={v => set("drainage_rock_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.drainage_rock_needed === "Yes" && (
        <FlagField fieldKey="drainage_rock_tons" label="Tons" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.drainage_rock_tons || ""} onChange={e => set("drainage_rock_tons", e.target.value)} placeholder="0" />
        </FlagField>
      )}

      <StoneFabricSection form={form} set={set} flags={flags} toggleFlag={toggleFlag} stoneCY={stoneCY} />
    </div>
  );
}

export function StreamBedFields({ form, set, flags, toggleFlag, streamStoneCY }) {
  return (
    <div className="space-y-2">
      <FlagField fieldKey="ball_cart_needed" label="Ball Cart Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.ball_cart_needed} onChange={v => set("ball_cart_needed", v)} options={["Yes", "No"]} />
      </FlagField>

      <FlagField fieldKey="boulders_needed" label="Boulders Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.boulders_needed} onChange={v => set("boulders_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.boulders_needed === "Yes" && (
        <div className="grid grid-cols-3 gap-2">
          <FlagField fieldKey="fieldstone_10_18" label='Fieldstone 10–18" Count' flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.fieldstone_10_18 || ""} onChange={e => set("fieldstone_10_18", e.target.value)} placeholder="0" />
          </FlagField>
          <FlagField fieldKey="fieldstone_18_24" label='Fieldstone 18–24" Count' flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.fieldstone_18_24 || ""} onChange={e => set("fieldstone_18_24", e.target.value)} placeholder="0" />
          </FlagField>
          <FlagField fieldKey="fieldstone_24_30" label='Fieldstone 24–30" Count' flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.fieldstone_24_30 || ""} onChange={e => set("fieldstone_24_30", e.target.value)} placeholder="0" />
          </FlagField>
        </div>
      )}

      <FlagField fieldKey="drainage_rock_needed" label="Drainage Rock / Wash Stone Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.drainage_rock_needed} onChange={v => set("drainage_rock_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.drainage_rock_needed === "Yes" && (
        <>
          {streamStoneCY && <CalcBox label="Estimated Stone CY" value={streamStoneCY} unit="CY" />}
          <FlagField fieldKey="drainage_rock_cy" label="CY (confirm)" flags={flags} onToggle={toggleFlag}>
            <Input type="number" value={form.drainage_rock_cy || ""} onChange={e => set("drainage_rock_cy", e.target.value)} placeholder={streamStoneCY || "0"} />
          </FlagField>
        </>
      )}

      <FlagField fieldKey="stone_type" label="Stone Type" flags={flags} onToggle={toggleFlag}>
        <Input value={form.stone_type || ""} onChange={e => set("stone_type", e.target.value)} placeholder="e.g. River rock, Cobble" />
      </FlagField>

      <FlagField fieldKey="stream_purpose" label="Decorative vs Functional?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.stream_purpose} onChange={v => set("stream_purpose", v)} options={["Decorative", "Functional"]} />
      </FlagField>
    </div>
  );
}

export function ImperviousMembraneFields({ form, set, flags, toggleFlag, membraneCY }) {
  return (
    <div className="space-y-4">
      <FlagField fieldKey="time_estimate" label="Time Estimate (hrs)" flags={flags} onToggle={toggleFlag}>
        <Input type="number" value={form.time_estimate || ""} onChange={e => set("time_estimate", e.target.value)} placeholder="0" />
      </FlagField>

      <FlagField fieldKey="rough_grading_needed" label="Rough Grading, Excavation & Hauling Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.rough_grading_needed} onChange={v => set("rough_grading_needed", v)} options={["Yes", "No"]} />
      </FlagField>

      {form.rough_grading_needed === "Yes" && (
        <div className="space-y-3 border rounded-lg p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rough Grading &amp; Excavation</p>
          <div className="grid grid-cols-3 gap-2">
            <FlagField fieldKey="mem_length" label="Length (ft)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.mem_length || ""} onChange={e => set("mem_length", e.target.value)} placeholder="0" />
            </FlagField>
            <FlagField fieldKey="mem_width" label="Width (ft)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.mem_width || ""} onChange={e => set("mem_width", e.target.value)} placeholder="0" />
            </FlagField>
            <FlagField fieldKey="mem_depth" label="Depth (in)" flags={flags} onToggle={toggleFlag}>
              <Input type="number" value={form.mem_depth || ""} onChange={e => set("mem_depth", e.target.value)} placeholder="0" />
            </FlagField>
          </div>
          {membraneCY && <CalcBox label="Excavation CY" value={membraneCY} unit="CY" />}
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
        </div>
      )}

      <FlagField fieldKey="detail_excavation_hours" label="Detail Excavation for Appropriate Pitches — Labor (hrs)" flags={flags} onToggle={toggleFlag}>
        <Input type="number" value={form.detail_excavation_hours || ""} onChange={e => set("detail_excavation_hours", e.target.value)} placeholder="0" />
      </FlagField>

      <FlagField fieldKey="place_membrane_hours" label="Place Membrane Sandwiched in Woven Fabric — Labor (hrs)" flags={flags} onToggle={toggleFlag}>
        <Input type="number" value={form.place_membrane_hours || ""} onChange={e => set("place_membrane_hours", e.target.value)} placeholder="0" />
      </FlagField>

      <FlagField fieldKey="roofing_membrane_needed" label="Rubber Roofing Membrane Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.roofing_membrane_needed} onChange={v => set("roofing_membrane_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.roofing_membrane_needed === "Yes" && (
        <FlagField fieldKey="roofing_membrane_rolls" label="Rolls" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.roofing_membrane_rolls || ""} onChange={e => set("roofing_membrane_rolls", e.target.value)} placeholder="0" />
        </FlagField>
      )}

      <FlagField fieldKey="woven_fabric_needed" label="Woven Fabric Including Pins Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.woven_fabric_needed} onChange={v => set("woven_fabric_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.woven_fabric_needed === "Yes" && (
        <FlagField fieldKey="woven_fabric_sf" label="Square Feet" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.woven_fabric_sf || ""} onChange={e => set("woven_fabric_sf", e.target.value)} placeholder="0" />
        </FlagField>
      )}

      <FlagField fieldKey="place_stone_hours" label="Place Stone & Smooth — Labor (hrs)" flags={flags} onToggle={toggleFlag}>
        <Input type="number" value={form.place_stone_hours || ""} onChange={e => set("place_stone_hours", e.target.value)} placeholder="0" />
      </FlagField>

      <FlagField fieldKey="drainage_rock_needed" label='Drainage Rock / Wash Stone 1.5" Needed?' flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.drainage_rock_needed} onChange={v => set("drainage_rock_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.drainage_rock_needed === "Yes" && (
        <FlagField fieldKey="drainage_rock_tons" label="Tons" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.drainage_rock_tons || ""} onChange={e => set("drainage_rock_tons", e.target.value)} placeholder="0" />
        </FlagField>
      )}

      <FlagField fieldKey="edging_needed" label="Edging Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.edging_needed} onChange={v => set("edging_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.edging_needed === "No" && (
        <p className="text-xs text-amber-600">⚠️ Add edging operation if needed.</p>
      )}

      <FlagField fieldKey="poly_plastic_needed" label="6-Mil Black Poly Plastic Needed?" flags={flags} onToggle={toggleFlag}>
        <SelectButtons value={form.poly_plastic_needed} onChange={v => set("poly_plastic_needed", v)} options={["Yes", "No"]} />
      </FlagField>
      {form.poly_plastic_needed === "Yes" && (
        <FlagField fieldKey="poly_plastic_rolls" label="Rolls" flags={flags} onToggle={toggleFlag}>
          <Input type="number" value={form.poly_plastic_rolls || ""} onChange={e => set("poly_plastic_rolls", e.target.value)} placeholder="0" />
        </FlagField>
      )}
    </div>
  );
}