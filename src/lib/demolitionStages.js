export const DEMO_GROUPS = [
  { value: "hardscape", label: "Hardscape" },
  { value: "vegetation", label: "Vegetation & Softscape Items" },
];

export const DEMO_SUB_TYPES = {
  hardscape: [
    { value: "deck_timber_wall",    label: "(Deck or Timber Wall)",                category: "Demolition & Removals - Hardscape - (Deck or Timber Wall)" },
    { value: "patio",               label: "Patio",                                 category: "Demolition & Removals - Hardscape - Patio" },
    { value: "hand_removal_reuse",  label: "Hand Removal for Reuse (Brick/Flag)",   category: "Demolition & Removals - Hardscape - Hand Removal for Reuse (Brick/ Flag)" },
    { value: "stone_retaining_wall",label: "Stone Retaining Wall",                  category: "Demolition & Removals - Hardscape -Stone Retaining Wall" },
  ],
  vegetation: [
    { value: "woody_flush_cut",      label: "Existing Woody Plantings (Flush Cut)",                        category: "Demolition & Removals - Vegetation & Softscape Items - Existing Woody Plantings (Flush Cut)" },
    { value: "woody_incl_stumps",    label: "Existing Woody Plantings (Incl Stumps)",                      category: "Demolition & Removals - Vegetation & Softscape Items - Existing Woody Plantings (Incl Stumps)" },
    { value: "perennials_dig",       label: "Existing Plantings - Perennials (Dig)",                       category: "Demolition & Removals - Vegetation & Softscape Items - Existing Plantings - Perennials (Dig)" },
    { value: "perennials_herbicide", label: "Existing Plantings - Perennials and/or Lawn (Herbicide)",     category: "Demolition & Removals - Vegetation & Softscape Items - Existing Plantings - Perennials and/or Lawn (Herbicide)" },
    { value: "transplant_direct",    label: "Transplant - Direct Transplant",                               category: "Demolition & Removals - Vegetation & Softscape Items - Transplant - Direct Transplant" },
    { value: "transplant_dig_hold",  label: "Transplant - Hold Above Ground",                              category: "Demolition & Removals - Vegetation & Softscape Items - Transplant - Hold Above Ground" },
    { value: "herbicide_cut_treat",  label: "Herbicide Application (Cut and Treat)",                       category: "Demolition & Removals - Vegetation & Softscape Items - Herbicide Application (Cut and Treat)" },
    { value: "strip_sod",            label: "Strip Sod",                                                    category: "Demolition & Removals - Vegetation & Softscape Items - Strip Sod" },
    { value: "landscape_edging",     label: "Landscape Edging",                                            category: "Demolition & Removals - Vegetation & Softscape Items - Landscape Edging" },
    { value: "stone_mulch",          label: "Stone Landscape Mulch",                                       category: "Demolition & Removals - Vegetation & Softscape Items - Stone Landscape Mulch" },
    { value: "weed_fabric",          label: "Weed Fabric",                                                 category: "Demolition & Removals - Vegetation & Softscape Items - Weed Fabric" },
    { value: "wood_mulch",           label: "Wood Landscape Mulch",                                        category: "Demolition & Removals - Vegetation & Softscape Items - Wood Landscape Mulch" },
    { value: "misc_items",           label: "Misc Items",                                                  category: "Demolition & Removals - Vegetation & Softscape Items - Misc Items" },
  ],
};

// hasSFCalc: true = show L×W→SF helper
// hasCYCalc: true = show Depth→CY calc using SF
export const DEMO_FIELDS = {
  deck_timber_wall: {
    hasSFCalc: true, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "thickness",           label: "Thickness (in)",                   type: "number" },
      { key: "thickness_base",      label: "Thickness of base (in)",           type: "number" },
    ],
    details: [
      { key: "machine_use",         label: "Machine use?",                     type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",        label: "Machine type (⚠️ check access)",   type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "hydraulic_tiller",    label: "Hydraulic tiller?",                type: "radio", options: ["Yes", "No"] },
      { key: "skil_saw",            label: '10" Skil Saw?',                    type: "radio", options: ["Yes", "No"] },
      { key: "recip_saw",           label: "Reciprocating Saw?",               type: "radio", options: ["Yes", "No"] },
      { key: "existing_material",   label: "Existing material type",           type: "text" },
      { key: "drainage_rock_below", label: "Drainage rock below?",             type: "radio", options: ["Yes", "No"] },
      { key: "drainage_rock_depth", label: "Drainage rock depth (in)",         type: "number", condition: { key: "drainage_rock_below", value: "Yes" } },
      { key: "drainage_rock_sf",    label: "Drainage rock SF",                 type: "number", condition: { key: "drainage_rock_below", value: "Yes" } },
      { key: "distance_to_truck",   label: "Distance to truck (ft)",           type: "number" },
      { key: "disposal_needed",     label: "Disposal needed?",                 type: "radio", options: ["Yes", "No"] },
      { key: "disposal_location",   label: "Disposal location",                type: "radio", options: ["Dane County Landfill", "Mandt (Clean Concrete)"], condition: { key: "disposal_needed", value: "Yes" } },
      { key: "dumpster_needed",     label: "Dumpster needed? (⚠️ Add street occupancy permit)", type: "radio", options: ["Yes", "No"] },
      { key: "pallets_needed",      label: "Pallets needed? (count)",          type: "number" },
      { key: "road_gravel_tons",    label: "Road Gravel needed? (tons)",        type: "number" },
    ],
  },
  patio: {
    hasSFCalc: true, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "thickness",           label: "Thickness (in)",                   type: "number" },
      { key: "removal_of_base",     label: "Removal of base?",                 type: "radio", options: ["Yes", "No"] },
      { key: "thickness_base",      label: "Thickness of base (in)",           type: "number", condition: { key: "removal_of_base", value: "Yes" } },
    ],
    details: [
      { key: "machine_use",         label: "Machine use?",                     type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",        label: "Machine type (⚠️ check access)",   type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "remove_backfill_hrs", label: "Remove Backfill (hours)",          type: "number" },
      { key: "patio_material",      label: "Existing patio material",          type: "select", options: ["Concrete", "Asphalt", "Paver", "Flagstone"] },
      { key: "breaker_hammer",      label: "Breaker hammer required?",         type: "radio", options: ["Yes", "No"] },
      { key: "distance_to_truck",   label: "Distance to truck (ft)",           type: "number" },
      { key: "disposal_needed",     label: "Disposal needed?",                 type: "radio", options: ["Yes", "No"] },
      { key: "disposal_location",   label: "Disposal location",                type: "radio", options: ["Dane County Landfill", "Mandt"], condition: { key: "disposal_needed", value: "Yes" } },
      { key: "mandt_type",          label: "Mandt type",                       type: "radio", options: ["Clean Concrete (footings)", "Rubble"], condition: { key: "disposal_location", value: "Mandt" } },
      { key: "dumpster_needed",     label: "Dumpster needed? (⚠️ Add street occupancy permit)", type: "radio", options: ["Yes", "No"] },
      { key: "pallets_needed",      label: "Pallets needed? (count)",          type: "number" },
    ],
  },
  hand_removal_reuse: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "scope_quantity",      label: "Scope quantity",                   type: "text" },
      { key: "pallet_count",        label: "Pallet count (if needed)",         type: "number" },
    ],
    details: [
      { key: "reuse_storage_plan",  label: "Reuse and storage plan",           type: "textarea" },
      { key: "disposal_needed",     label: "Disposal needed?",                 type: "radio", options: ["Yes", "No"] },
      { key: "disposal_location",   label: "Disposal location",                type: "radio", options: ["Mandt (Rubble)"], condition: { key: "disposal_needed", value: "Yes" } },
    ],
  },
  stone_retaining_wall: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "lf",                  label: "Linear Feet (LF)",                 type: "number" },
      { key: "width",               label: "Width (ft)",                       type: "number" },
      { key: "wall_height",         label: "Wall height (ft, if relevant)",    type: "number" },
    ],
    details: [
      { key: "machine_use",         label: "Machine use?",                     type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",        label: "Machine type (⚠️ check access)",   type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "remove_stone_hrs",    label: "Remove stone (hours)",             type: "number" },
      { key: "remove_backfill_hrs", label: "Remove backfill (hours)",          type: "number" },
      { key: "reuse_vs_disposal",   label: "Reuse vs disposal",                type: "radio", options: ["Reuse", "Disposal"] },
      { key: "disposal_location",   label: "Disposal location",                type: "radio", options: ["Dane County Landfill", "Mandt (Clean Concrete)"], condition: { key: "reuse_vs_disposal", value: "Disposal" } },
      { key: "distance_to_truck",   label: "Distance to truck (ft)",           type: "number" },
      { key: "dumpster_needed",     label: "Dumpster needed? (⚠️ Add street occupancy permit)", type: "radio", options: ["Yes", "No"] },
      { key: "pallets_needed",      label: "Pallets needed? (count)",          type: "number" },
    ],
  },
  woody_flush_cut: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "time_to_cut",         label: "Time to cut (hrs)",                type: "text" },
      { key: "tons_material",       label: "Tons of material",                 type: "number" },
      { key: "loading_tarping_time",label: "Loading / tarping time (hrs)",     type: "text" },
      { key: "round_trip_disposal", label: "Round trip disposal time",         type: "text" },
    ],
    details: [
      { key: "chainsaw",            label: "Chainsaw?",                        type: "radio", options: ["Yes", "No"] },
      { key: "recip_saw",           label: "Reciprocating saw?",               type: "radio", options: ["Yes", "No"] },
      { key: "brush_chipper",       label: "Brush chipper?",                   type: "radio", options: ["Yes", "No"] },
      { key: "stumps_excluded",     label: "Are stumps/root masses excluded?", type: "radio", options: ["Yes", "No"] },
      { key: "machine_use",         label: "Machine use? (⚠️ check access)",   type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",        label: "Machine type",                     type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
    ],
  },
  woody_incl_stumps: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",            label: "Time Estimate (hrs)",              type: "number" },
      { key: "time_to_cut",              label: "Time to cut (hrs)",                type: "text" },
      { key: "time_remove_stump",        label: "Time to remove stump & root mass (hrs)", type: "text" },
      { key: "tons_material",            label: "Tons of material",                 type: "number" },
      { key: "loading_tarping_time",     label: "Loading / tarping time (hrs)",     type: "text" },
      { key: "round_trip_disposal",      label: "Round trip disposal time (hrs)",   type: "text" },
    ],
    details: [
      { key: "chainsaw",                 label: "Chainsaw?",                        type: "radio", options: ["Yes", "No"] },
      { key: "recip_saw",                label: "Reciprocating saw?",               type: "radio", options: ["Yes", "No"] },
      { key: "brush_chipper",            label: "Brush chipper?",                   type: "radio", options: ["Yes", "No"] },
      { key: "machine_use",              label: "Machine use? (⚠️ check access)",   type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",             label: "Machine type",                     type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "bucket_stump_ripper",      label: "Bucket and/or stump ripper and/or trenching attachment?", type: "radio", options: ["Yes", "No"], condition: { key: "machine_use", value: "Yes" } },
      { key: "stump_mature_type",        label: "Mature tree — type",               type: "text" },
      { key: "stump_mature_count",       label: "Mature tree — count",              type: "number" },
      { key: "stump_large_type",         label: "Large stump — type",               type: "text" },
      { key: "stump_large_count",        label: "Large stump — count",              type: "number" },
      { key: "stump_medium_type",        label: "Medium stump — type",              type: "text" },
      { key: "stump_medium_count",       label: "Medium stump — count",             type: "number" },
      { key: "stump_small_type",         label: "Small stump — type",               type: "text" },
      { key: "stump_small_count",        label: "Small stump — count",              type: "number" },
    ],
  },
  perennials_dig: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "approx_time_dig",     label: "Approximate time to dig (hrs)",    type: "text" },
      { key: "tons_material",       label: "Tons of material",                 type: "number" },
    ],
    details: [
      { key: "remove_vs_reuse",     label: "Remove vs reuse",                  type: "radio", options: ["Remove", "Reuse"] },
      { key: "loading_tarping_time",label: "Loading / tarping time (hrs)",     type: "text", condition: { key: "remove_vs_reuse", value: "Remove" } },
      { key: "round_trip_disposal", label: "Round trip disposal time",         type: "text", condition: { key: "remove_vs_reuse", value: "Remove" } },
      { key: "dump_location",       label: "Dump location",                    type: "text", condition: { key: "remove_vs_reuse", value: "Remove" } },
      { key: "method",              label: "Hand vs machine",                  type: "radio", options: ["Hand", "Machine"] },
    ],
  },
  perennials_herbicide: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "treatment_sf",        label: "Treatment area SF",                type: "number" },
    ],
    details: [
      { key: "client_approval",     label: "Client approval",                  type: "radio", options: ["Yes", "Not Yet"] },
      { key: "treatment_timing",    label: "Treatment timing",                 type: "text" },
      { key: "nearby_plantings",    label: "Nearby desirable plantings",       type: "textarea" },
    ],
  },
  transplant_direct: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",          label: "Time Estimate (hrs)",                    type: "number" },
      { key: "plants_list",            label: "Plants (type, quantity, size)",          type: "textarea" },
      { key: "time_dig_hours",         label: "Time to dig plants and pot/burlap (hrs)",type: "number" },
      { key: "time_replant_hours",     label: "Time to replant plants (hrs)",           type: "number" },
      { key: "fill_holes_hours",       label: "Fill holes labor hours",                 type: "number" },
    ],
    details: [
      { key: "watering_on_install",    label: "Watering upon installation?",            type: "radio", options: ["Yes", "No"] },
      { key: "time_water_1x_hours",    label: "Time to water 1x labor (hrs)",           type: "number", condition: { key: "watering_on_install", value: "Yes" } },
      { key: "machine_use",            label: "Machine use? (⚠️ check access — includes up to 3 non-hydraulic attachments)", type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",           label: "Machine type",                           type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "root_ball_difficulty",   label: "Root ball size / difficulty",            type: "text" },
    ],
  },
  transplant_dig_hold: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",          label: "Time Estimate (hrs)",                    type: "number" },
      { key: "dig_pot_labor_hours",    label: "Dig plants and pot/burlap labor hours",  type: "number" },
      { key: "small_pots_count",       label: "Small plastic pots needed — count",      type: "number" },
      { key: "hold_duration",          label: "How long will plants be held above ground?", type: "text" },
      { key: "storage_location",       label: "Where will plants be stored while above ground?", type: "text" },
      { key: "plants_list",            label: "Plants (type, quantity, size)",          type: "textarea" },
    ],
    details: [
      { key: "watering_system",        label: "Watering system needed?",                type: "radio", options: ["Yes", "No"] },
      { key: "watering_events",        label: "Number of watering events",              type: "number" },
      { key: "time_per_watering",      label: "Time per watering (hrs)",                type: "text" },
      { key: "travel_per_watering",    label: "Travel time per watering event (hrs)",   type: "text" },
      { key: "replanting_plants",      label: "Replanting plants?",                     type: "radio", options: ["Yes", "No"] },
      { key: "pm_travel_hours",        label: "Project management labor / travel hours to check plants or drive to water", type: "number" },
    ],
  },
  herbicide_cut_treat: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "treatment_sf",        label: "Treatment area SF",                type: "number" },
    ],
    details: [
      { key: "client_approval",     label: "Client approval",                  type: "radio", options: ["Yes", "Not Yet"] },
      { key: "treatment_timing",    label: "Treatment timing",                 type: "text" },
      { key: "nearby_plantings",    label: "Nearby desirable plantings",       type: "textarea" },
    ],
  },
  strip_sod: {
    hasSFCalc: true, hasCYCalc: true,
    measurements: [
      { key: "time_estimate",               label: "Time Estimate (hrs)",                     type: "number" },
    ],
    details: [
      { key: "machine_use",                 label: "Machine use? (⚠️ check access)",           type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",                label: "Machine type",                             type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "sod_cutter",                  label: "Sod cutter?",                              type: "radio", options: ["Yes", "No"] },
      { key: "ramps_needed",                label: "Ramps needed?",                            type: "radio", options: ["Yes", "No"] },
      { key: "obstacle_removal_hours",      label: "Extra removal from fence, plants, or other obstacles (hrs)", type: "number" },
      { key: "tilling",                     label: "Tilling?",                                 type: "radio", options: ["Yes", "No"] },
      { key: "disposal_needed",             label: "Disposal needed?",                         type: "radio", options: ["Yes", "No"] },
      { key: "distance_from_truck",         label: "Distance from truck (ft)",                 type: "number", condition: { key: "disposal_needed", value: "Yes" } },
      { key: "disposal_method",             label: "Disposal method",                          type: "text", condition: { key: "disposal_needed", value: "Yes" } },
    ],
  },
  landscape_edging: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "lf",                  label: "Linear Feet (LF)",                 type: "number" },
      { key: "removal_labor_hours", label: "Removal labor hours",              type: "number" },
    ],
    details: [
      { key: "edging_type_plastic", label: "Plastic edging?",                  type: "radio", options: ["Yes", "No"] },
      { key: "edging_type_brick",   label: "Brick or stone edging?",           type: "radio", options: ["Yes", "No"] },
      { key: "disposition",         label: "Reuse or Reinstall or Dispose",    type: "radio", options: ["Reuse", "Reinstall", "Dispose"] },
      { key: "disposal_travel_hrs", label: "Disposal travel hours",            type: "number", condition: { key: "disposition", value: "Dispose" } },
      { key: "disposal_mandt_concrete", label: "Clean concrete - Mandt?",      type: "radio", options: ["Yes", "No"], condition: { key: "disposition", value: "Dispose" } },
      { key: "disposal_inorganic",  label: "Inorganic garbage / debris?",      type: "radio", options: ["Yes", "No"], condition: { key: "disposition", value: "Dispose" } },
      { key: "disposal_dane_county",label: "Dane County Landfill?",            type: "radio", options: ["Yes", "No"], condition: { key: "disposition", value: "Dispose" } },
      { key: "ramps_needed",        label: "Ramps needed?",                    type: "radio", options: ["Yes", "No"] },
    ],
  },
  stone_mulch: {
    hasSFCalc: true, hasCYCalc: true,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "equip_operator_hours",label: "Equipment operator labor hours",   type: "number" },
      { key: "time_to_remove",      label: "Time to remove (hrs)",             type: "text" },
    ],
    details: [
      { key: "machine_use",         label: "Machine use? (⚠️ check access)",   type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",        label: "Machine type",                     type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "trash_bags_fabric",   label: "Trash bags needed for fabric removal?", type: "radio", options: ["Yes", "No"] },
      { key: "ramps_needed",        label: "Ramps needed?",                    type: "radio", options: ["Yes", "No"] },
      { key: "disposition",         label: "Reuse or Reinstall or Dispose",    type: "radio", options: ["Reuse", "Reinstall", "Dispose"] },
      { key: "disposal_method",     label: "Disposal method",                  type: "text", condition: { key: "disposition", value: "Dispose" } },
    ],
  },
  weed_fabric: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "sf",                  label: "Square Footage (SF)",              type: "number" },
      { key: "bags_needed",         label: "Bags needed (if applicable)",      type: "number" },
    ],
    details: [
      { key: "removal_type",        label: "Full removal vs partial disturbance", type: "radio", options: ["Full Removal", "Partial Disturbance"] },
      { key: "buried_condition",    label: "Buried condition notes",           type: "text" },
      { key: "contamination",       label: "Contamination with roots/stone",   type: "radio", options: ["Yes", "No"] },
    ],
  },
  wood_mulch: {
    hasSFCalc: true, hasCYCalc: true,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "removal_time",        label: "Removal time (hrs)",               type: "text" },
    ],
    details: [
      { key: "disposition",         label: "Reuse or Reinstall or Dispose",    type: "radio", options: ["Reuse", "Reinstall", "Dispose"] },
      { key: "disposal_travel_hrs", label: "Disposal travel hours",            type: "number", condition: { key: "disposition", value: "Dispose" } },
      { key: "disposal_method",     label: "Disposal method",                  type: "text", condition: { key: "disposition", value: "Dispose" } },
      { key: "trash_bags_needed",   label: "Trash bags needed?",               type: "radio", options: ["Yes", "No"] },
      { key: "inorganic_debris_bags",label: "Inorganic garbage / debris bags?",type: "radio", options: ["Yes", "No"] },
    ],
  },
  misc_items: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "material_type",       label: "Material type",                    type: "text" },
      { key: "approx_time",         label: "Approximate time (hrs)",           type: "text" },
    ],
    details: [],
  },
};

export function getDemoSubTypes(group) {
  return DEMO_SUB_TYPES[group] || [];
}
export function getDemoSubTypeLabel(group, value) {
  return getDemoSubTypes(group).find(s => s.value === value)?.label || value;
}
export function getDemoCategory(group, value) {
  return getDemoSubTypes(group).find(s => s.value === value)?.category || "";
}
export function getDemoGroupLabel(group) {
  return DEMO_GROUPS.find(g => g.value === group)?.label || group;
}