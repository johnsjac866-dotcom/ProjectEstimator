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
    { value: "transplant_dig_hold",  label: "Transplant - Dig and Hold Existing Perennials for Reuse",     category: "Demolition & Removals - Vegetation & Softscape Items - Transplant - Dig and Hold Existing Perennials for Reuse" },
    { value: "herbicide_cut_treat",  label: "Herbicide Application (Cut and Treat)",                       category: "Demolition & Removals - Vegetation & Softscape Items - Herbicide Application (Cut and Treat)" },
    { value: "strip_sod",            label: "Strip Sod Manually (Update Disposal Fee)",                    category: "Demolition & Removals - Vegetation & Softscape Items - Strip Sod Manually (Update Disposal Fee)" },
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
      { key: "machine_type",        label: "Machine type",                     type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "machine_access_width",label: "Machine access path width (ft)",   type: "number", condition: { key: "machine_use", value: "Yes" } },
      { key: "existing_material",   label: "Existing material type",           type: "text" },
      { key: "drainage_rock_below", label: "Drainage rock below?",             type: "radio", options: ["Yes", "No"] },
      { key: "drainage_rock_depth", label: "Drainage rock depth (in)",         type: "number", condition: { key: "drainage_rock_below", value: "Yes" } },
      { key: "drainage_rock_sf",    label: "Drainage rock SF",                 type: "number", condition: { key: "drainage_rock_below", value: "Yes" } },
      { key: "distance_to_truck",   label: "Distance to truck (ft)",           type: "number" },
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
      { key: "machine_type",        label: "Machine type",                     type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "machine_access_width",label: "Machine access path width (ft)",   type: "number", condition: { key: "machine_use", value: "Yes" } },
      { key: "patio_material",      label: "Existing patio material",          type: "select", options: ["Concrete", "Asphalt", "Paver", "Flagstone"] },
      { key: "breaker_hammer",      label: "Breaker hammer required?",         type: "radio", options: ["Yes", "No"] },
      { key: "distance_to_truck",   label: "Distance to truck (ft)",           type: "number" },
      { key: "disposal_method",     label: "Disposal method",                  type: "text" },
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
      { key: "machine_type",        label: "Machine type",                     type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "machine_access_width",label: "Machine access path width (ft)",   type: "number", condition: { key: "machine_use", value: "Yes" } },
      { key: "reuse_vs_disposal",   label: "Reuse vs disposal",                type: "radio", options: ["Reuse", "Disposal"] },
      { key: "distance_to_truck",   label: "Distance to truck (ft)",           type: "number" },
    ],
  },
  woody_flush_cut: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_to_cut",         label: "Time to cut (hrs)",                type: "text" },
      { key: "time_fill_holes",     label: "Time to fill holes (hrs)",         type: "text" },
      { key: "tons_material",       label: "Tons of material",                 type: "number" },
      { key: "loading_tarping_time",label: "Loading / tarping time - brush & stumps combined (hrs)", type: "text" },
      { key: "round_trip_disposal", label: "Round trip disposal time",         type: "text" },
    ],
    details: [
      { key: "method",              label: "Machine vs hand",                  type: "radio", options: ["Machine", "Hand"] },
    ],
  },
  woody_incl_stumps: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_to_cut",              label: "Time to cut (hrs)",                type: "text" },
      { key: "time_remove_stump",        label: "Time to remove stump & root mass (hrs)", type: "text" },
      { key: "time_fill_holes",          label: "Time to fill holes (hrs)",         type: "text" },
      { key: "tons_material",            label: "Tons of material",                 type: "number" },
      { key: "loading_tarping_time",     label: "Loading / tarping time - brush & stumps combined (hrs)", type: "text" },
      { key: "round_trip_disposal",      label: "Round trip disposal time (hrs)",   type: "text" },
      { key: "stump_size",               label: "Stump size",                       type: "select", options: ["Tree", "Large", "Medium", "Small"] },
    ],
    details: [
      { key: "machine_use",              label: "Machine use?",                     type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",             label: "Machine type",                     type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "machine_access_width",     label: "Machine access path width (ft)",   type: "number", condition: { key: "machine_use", value: "Yes" } },
    ],
  },
  perennials_dig: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
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
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "count_small",         label: "Small (1 gal) — count",           type: "number" },
      { key: "count_medium",        label: "Medium (3 gal) — count",          type: "number" },
      { key: "count_large",         label: "Large (5 gal) — count",           type: "number" },
      { key: "count_xlarge",        label: "Extra Large (10 gal) — count",    type: "number" },
    ],
    details: [
      { key: "watering_on_install", label: "Watering upon installation?",     type: "radio", options: ["Yes", "No"] },
      { key: "transplant_method",   label: "Direct transplant vs hold and reuse", type: "radio", options: ["Direct Transplant", "Hold and Reuse"] },
    ],
  },
  transplant_dig_hold: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "time_estimate",       label: "Time Estimate (hrs)",              type: "number" },
      { key: "count_small",         label: "Small (1 gal) — count",           type: "number" },
      { key: "count_medium",        label: "Medium (3 gal) — count",          type: "number" },
      { key: "count_large",         label: "Large (5 gal) — count",           type: "number" },
      { key: "count_xlarge",        label: "Extra Large (10 gal) — count",    type: "number" },
      { key: "project_duration",    label: "Duration of project (days)",       type: "number" },
      { key: "watering_events",     label: "Number of watering events",        type: "number" },
      { key: "time_per_watering",   label: "Time per watering (min)",          type: "text" },
      { key: "travel_per_watering", label: "Travel time per watering (min)",   type: "text" },
      { key: "total_watering_time", label: "Total watering time",              type: "text" },
    ],
    details: [
      { key: "holding_conditions",  label: "Temporary holding conditions",    type: "textarea" },
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
    hasSFCalc: true, hasCYCalc: false,
    measurements: [
      { key: "distance_from_truck",         label: "Distance from truck (ft)",                type: "number" },
      { key: "extra_time_over_100ft",       label: "Added time for distance over 100ft (hrs)", type: "text" },
      { key: "extra_labor_edges",           label: "Extra labor for edges/slopes/bumpy lawn (hrs)", type: "text" },
    ],
    details: [
      { key: "disposal_method",             label: "Disposal method",                         type: "text" },
    ],
  },
  landscape_edging: {
    hasSFCalc: false, hasCYCalc: false,
    measurements: [
      { key: "lf",                  label: "Linear Feet (LF)",                 type: "number" },
      { key: "time_to_remove",      label: "Time to remove (hrs)",             type: "text" },
      { key: "material",            label: "Material type",                    type: "select", options: ["Plastic", "Poly", "Brick/Bullet", "Concrete", "Other"] },
      { key: "material_other",      label: "Material (other — specify)",       type: "text", condition: { key: "material", value: "Other" } },
    ],
    details: [
      { key: "disposition",         label: "Reuse or Reinstall or Dispose",    type: "radio", options: ["Reuse", "Reinstall", "Dispose"] },
      { key: "disposal_method",     label: "Disposal method",                  type: "text", condition: { key: "disposition", value: "Dispose" } },
      { key: "bags_needed",         label: "Bags needed",                      type: "number" },
    ],
  },
  stone_mulch: {
    hasSFCalc: true, hasCYCalc: true,
    measurements: [
      { key: "time_to_remove",      label: "Time to remove (hrs)",             type: "text" },
    ],
    details: [
      { key: "machine_use",         label: "Machine use?",                     type: "radio", options: ["Yes", "No"] },
      { key: "machine_type",        label: "Machine type",                     type: "radio", options: ["Dingo", "Vermeer"], condition: { key: "machine_use", value: "Yes" } },
      { key: "machine_access_width",label: "Machine access path width (ft)",   type: "number", condition: { key: "machine_use", value: "Yes" } },
      { key: "distance_to_truck",   label: "Distance to truck (ft)",           type: "number" },
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
      { key: "removal_time",        label: "Removal time (hrs)",               type: "text" },
    ],
    details: [
      { key: "disposition",         label: "Reuse or Reinstall or Dispose",    type: "radio", options: ["Reuse", "Reinstall", "Dispose"] },
      { key: "disposal_method",     label: "Disposal method",                  type: "text", condition: { key: "disposition", value: "Dispose" } },
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