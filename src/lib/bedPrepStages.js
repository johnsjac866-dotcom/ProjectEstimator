export const BED_MAIN_TYPES = [
  { value: "till", label: "Bed Preparation - Till" },
  { value: "no_till", label: "Bed Preparation - No Till" },
  { value: "lawn", label: "Bed Preparation - Lawn" },
  { value: "reprofiling", label: "Bed Preparation - Reprofiling" },
];

export const BED_SUB_TYPES = {
  till: [
    { value: "till_1in", label: "5\" Till, 1\" Amendments", category: "Bed Preparation - 5\" Till, 1\" Amendments" },
    { value: "till_3in", label: "5\" Till, 3\" Amendments", category: "Bed Preparation - 5\" Till, 3\" Amendments" },
  ],
  no_till: [
    { value: "notill_hand", label: "No Till - 1\" Compost Amendment - By Hand", category: "Bed Preparation - No Till - 1\" Compost Amendment - By Hand" },
    { value: "notill_machine", label: "No Till - 1\" Compost Amendment - By Machine - Large Load", category: "Bed Preparation - No Till - 1\" Compost Amendment - By Machine - Large Load" },
    { value: "notill_deadsod", label: "No Till - Planting Into Dead Sod / Vegetation - No Amendments", category: "Bed Preparation - No Till - Planting Into Dead Sod / Vegetation - No Amendments" },
  ],
  lawn: [
    { value: "lawn_none", label: "Lawn - No Amendments", category: "Bed Preparation - Lawn - No Amendments" },
    { value: "lawn_1in", label: "Lawn - 1\" Amendments", category: "Bed Preparation - Lawn - 1\" Amendments" },
  ],
  reprofiling: [
    { value: "repro_hardscape", label: "Reprofiling - Against Existing Hardscape/Fence", category: "Bed Preparation - Reprofiling - Against Existing Hardscape/Fence" },
    { value: "repro_narrow", label: "Reprofiling - Narrow Bed", category: "Bed Preparation - Reprofiling - Narrow Bed" },
    { value: "repro_sloped", label: "Reprofiling - Slopped Bed", category: "Bed Preparation - Reprofiling - Slopped Bed" },
    { value: "repro_soil", label: "Reprofiling - Soil Addition", category: "Bed Preparation - Reprofiling - Soil Addition" },
  ],
};

// Fields per sub-type: { measurements, decisions, constraints }
export const BED_FIELDS = {
  till_1in: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "amendment_depth", label: "Amendment depth (1\")", type: "text", defaultValue: "1\"" },
      { key: "access_path_distance", label: "Access path distance", type: "text" },
      { key: "machine_type", label: "Machine type if used", type: "text" },
    ],
    decisions: [
      { key: "amendment_spec", label: "Amendment spec", type: "text" },
      { key: "till_depth", label: "Till depth", type: "text" },
      { key: "hand_vs_machine", label: "Hand vs machine", type: "select", options: ["By Hand", "By Machine"] },
    ],
    constraints: [
      { key: "roots", label: "Roots present?", type: "checkbox" },
      { key: "soil_condition", label: "Soil condition notes", type: "text" },
      { key: "access_notes", label: "Access constraints", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  till_3in: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "amendment_depth", label: "Amendment depth (3\")", type: "text", defaultValue: "3\"" },
      { key: "access_path_distance", label: "Access path distance", type: "text" },
      { key: "machine_type", label: "Machine type if used", type: "text" },
    ],
    decisions: [
      { key: "amendment_spec", label: "Amendment spec", type: "text" },
      { key: "till_depth", label: "Till depth", type: "text" },
      { key: "hand_vs_machine", label: "Hand vs machine", type: "select", options: ["By Hand", "By Machine"] },
    ],
    constraints: [
      { key: "roots", label: "Roots present?", type: "checkbox" },
      { key: "soil_condition", label: "Soil condition notes", type: "text" },
      { key: "access_notes", label: "Access constraints", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  notill_hand: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "amendment_depth", label: "Amendment depth (1\")", type: "text", defaultValue: "1\"" },
      { key: "access_path_distance", label: "Access path distance", type: "text" },
    ],
    decisions: [
      { key: "compost_spec", label: "Compost spec", type: "text" },
      { key: "hand_vs_machine", label: "Hand vs machine", type: "select", options: ["By Hand", "By Machine"] },
    ],
    constraints: [
      { key: "carry_distance", label: "Carry distance", type: "text" },
      { key: "access_notes", label: "Access constraints", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  notill_machine: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "amendment_depth", label: "Amendment depth (1\")", type: "text", defaultValue: "1\"" },
      { key: "access_path_distance", label: "Access path distance", type: "text" },
    ],
    decisions: [
      { key: "compost_spec", label: "Compost spec", type: "text" },
      { key: "hand_vs_machine", label: "Hand vs machine", type: "select", options: ["By Hand", "By Machine"] },
    ],
    constraints: [
      { key: "carry_distance", label: "Carry distance", type: "text" },
      { key: "access_notes", label: "Access constraints", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  notill_deadsod: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
    ],
    decisions: [
      { key: "notill_suitability", label: "No-till suitability assessment", type: "text" },
      { key: "vegetation_kill_status", label: "Vegetation kill status", type: "text" },
    ],
    constraints: [
      { key: "dead_sod_condition", label: "Dead sod / vegetation condition", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  lawn_none: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
    ],
    decisions: [
      { key: "repair_vs_new", label: "Repair vs new install context", type: "select", options: ["Repair", "New Install"] },
    ],
    constraints: [
      { key: "access_notes", label: "Access constraints", type: "text" },
      { key: "soil_readiness", label: "Soil readiness notes", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  lawn_1in: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "amendment_depth", label: "Amendment depth (1\")", type: "text", defaultValue: "1\"" },
    ],
    decisions: [
      { key: "amendment_spec", label: "Amendment spec", type: "text" },
      { key: "repair_vs_new", label: "Repair vs new install context", type: "select", options: ["Repair", "New Install"] },
    ],
    constraints: [
      { key: "access_notes", label: "Access constraints", type: "text" },
      { key: "soil_readiness", label: "Soil readiness notes", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  repro_hardscape: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "lf_new_bed_edge", label: "LF along new bed edge", type: "number" },
      { key: "lf_existing_hardscape", label: "LF along existing hardscape", type: "number" },
      { key: "depth_elevation_change", label: "Depth / elevation change", type: "text" },
      { key: "access_path_distance", label: "Access path distance", type: "text" },
    ],
    decisions: [
      { key: "soil_addition", label: "Soil addition required?", type: "select", options: ["Yes", "No"] },
      { key: "final_grading_intent", label: "Final grading intent", type: "text" },
      { key: "hand_or_machine", label: "Hand or machine", type: "select", options: ["By Hand", "By Machine"] },
    ],
    constraints: [
      { key: "fence_hardscape_proximity", label: "Fence / hardscape proximity notes", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  repro_narrow: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "lf_new_bed_edge", label: "LF along new bed edge", type: "number" },
      { key: "depth_elevation_change", label: "Depth / elevation change", type: "text" },
      { key: "access_path_distance", label: "Access path distance", type: "text" },
    ],
    decisions: [
      { key: "soil_addition", label: "Soil addition required?", type: "select", options: ["Yes", "No"] },
      { key: "final_grading_intent", label: "Final grading intent", type: "text" },
    ],
    constraints: [
      { key: "tight_shaping", label: "Tight shaping conditions notes", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  repro_sloped: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "lf_new_bed_edge", label: "LF along new bed edge", type: "number" },
      { key: "depth_elevation_change", label: "Depth / elevation change", type: "text" },
      { key: "access_path_distance", label: "Access path distance", type: "text" },
    ],
    decisions: [
      { key: "soil_addition", label: "Soil addition required?", type: "select", options: ["Yes", "No"] },
      { key: "final_grading_intent", label: "Final grading intent", type: "text" },
    ],
    constraints: [
      { key: "tight_shaping", label: "Tight shaping conditions notes", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
  repro_soil: {
    measurements: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "sf", label: "SF (Square Feet)", type: "number" },
      { key: "lf_new_bed_edge", label: "LF along new bed edge", type: "number" },
      { key: "depth_elevation_change", label: "Depth / elevation change", type: "text" },
      { key: "access_path_distance", label: "Access path distance", type: "text" },
    ],
    decisions: [
      { key: "soil_addition", label: "Soil addition required?", type: "select", options: ["Yes", "No"] },
      { key: "final_grading_intent", label: "Final grading intent", type: "text" },
    ],
    constraints: [
      { key: "tight_shaping", label: "Tight shaping conditions notes", type: "text" },
      { key: "missing_info", label: "Missing Info / flags", type: "textarea" },
    ],
  },
};

export function getSubTypes(mainType) {
  return BED_SUB_TYPES[mainType] || [];
}

export function getSubTypeLabel(subTypeValue) {
  for (const arr of Object.values(BED_SUB_TYPES)) {
    const found = arr.find(s => s.value === subTypeValue);
    if (found) return found.label;
  }
  return subTypeValue;
}

export function getSubTypeCategory(subTypeValue) {
  for (const arr of Object.values(BED_SUB_TYPES)) {
    const found = arr.find(s => s.value === subTypeValue);
    if (found) return found.category;
  }
  return "";
}