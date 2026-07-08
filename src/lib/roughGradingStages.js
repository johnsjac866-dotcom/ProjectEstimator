export const RG_SUB_TYPES = [
  { value: "excavation_hand",    label: "Excavation & Exportation - By Hand",              category: "Rough Grading & Hauling - Excavation & Exportation By Hand" },
  { value: "excavation_machine", label: "Excavation & Exportation - By Machine",           category: "Rough Grading & Hauling - Excavation & Exportation By Machine" },
  { value: "importation_hand",   label: "Soil Importation & Spreading - By Hand",          category: "Rough Grading & Hauling - Soil Importation & Spreading - By Hand" },
  { value: "importation_machine",label: "Soil Importation & Spreading - By Machine",       category: "Rough Grading & Hauling - Soil Importation & Spreading - By Machine" },
];

export const SOIL_IMPORT_TYPES = [
  "Fill Soil (for rough grading)",
  "Garden Mix (topsoil/compost)",
  "Topsoil (Unscreened for rough grading)",
  "Coarse / Washed Sand",
];

export const DISPOSAL_MATERIAL_TYPES = ["Gravel", "Rock", "Sand", "Topsoil", "Clay"];

// lbs per cubic yard by material + dry/wet
export const MATERIAL_WEIGHTS = {
  "Gravel": { dry: 2565, wet: 3375 },
  "Rock":   { dry: 3200, wet: 3200 },
  "Sand":   { dry: 2750, wet: 3300 },
  "Topsoil":{ dry: 2400, wet: 3375 },
  "Clay":   { dry: 2300, wet: 2970 },
};

export const DISPOSAL_FEE_OPTIONS = [
  "Mandt – Up to 5 tons (dirt)",
  "Dumpster – Up to 10 Yds",
  "Mandt – Up to 5 tons (rubble)",
  "Fee – Up to 2.5 cu yd (Non-Tax)",
  "Fee – Up to 20 tons",
];

// Fields per sub-type — SF/depth/CY are handled specially in the wizard UI
// Complex fields (soil_types, material_type/disposal) are handled inline in the wizard
export const RG_FIELDS = {
  excavation_hand: {
    step2: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "distance_to_parking", label: "Distance to parking spot (ft)", type: "number" },
    ],
    step3: [
      { key: "dump_trailer_needed", label: "Dump Trailer Needed?", type: "radio", options: ["Yes", "No"] },
      { key: "ramps_needed", label: "Ramps Needed (count)", type: "number" },
      { key: "sod_vegetation_removed", label: "Sod or vegetation being removed?", type: "radio", options: ["Yes", "No"],
        note: "If Yes: add 'Demolition & Removals - Vegetation & Softscape Items - Strip Sod Manually (Update Disposal Fee)' category — SF = top 1\" of area being removed" },
      { key: "disposal_needed", label: "Disposal needed?", type: "radio", options: ["Yes", "No"] },
      { key: "disposal_location", label: "Disposal location", type: "select",
        options: ["Mandt - 2079 Hwy MM, Fitchburg", "Homburg - 5715 Milwaukee St, Madison"],
        condition: { key: "disposal_needed", value: "Yes" } },
      { key: "store_on_site", label: "Can crew store material on site?", type: "radio", options: ["Yes", "No"] },
      { key: "grading_plan_required", label: "Grading plan required? (Bring zip level or U level)", type: "radio", options: ["Yes", "No"] },
    ],
  },
  excavation_machine: {
    step2: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "machine_type", label: "Vermeer or Dingo?", type: "radio", options: ["Vermeer", "Dingo"] },
      { key: "hydraulic_tiller", label: "Hydraulic Tiller?", type: "radio", options: ["Yes", "No"],
        condition: { key: "machine_type", value: "Dingo" } },
      { key: "rock_hound", label: "Rock Hound?", type: "radio", options: ["Yes", "No"],
        condition: { key: "machine_type", value: "Dingo" } },
      { key: "machine_access_width", label: "Machine access path width (ft)", type: "number" },
    ],
    step3: [
      { key: "sod_vegetation_removed", label: "Sod or vegetation being removed?", type: "radio", options: ["Yes", "No"],
        note: "If Yes: add 'Demolition & Removals - Vegetation & Softscape Items - Strip Sod Manually (Update Disposal Fee)' category — SF = top 1\" of area being removed" },
      { key: "disposal_needed", label: "Disposal needed?", type: "radio", options: ["Yes", "No"] },
      // Disposal material/fees handled inline in wizard (complex)
      { key: "surface_protection", label: "Surface protection needed?", type: "radio", options: ["Yes", "No"] },
      { key: "utilities_checked", label: "⚠️ Confirm: marked utilities are NOT within 18 inches of machine path", type: "radio", options: ["Confirmed", "Not Yet Checked"] },
      { key: "grading_plan_required", label: "Grading plan required? (Bring zip level or U level)", type: "radio", options: ["Yes", "No"] },
    ],
  },
  importation_hand: {
    step2: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "carry_distance", label: "Carry distance to parking spot (ft)", type: "number" },
      // soil_types: multi-select handled inline
    ],
    step3: [
      { key: "dump_trailer_needed", label: "Dump Trailer Needed?", type: "radio", options: ["Yes", "No"] },
      { key: "ramps_needed", label: "Ramps Needed (count)", type: "number" },
      { key: "grading_plan_required", label: "Grading plan / Zip level needed?", type: "radio", options: ["Yes", "No"] },
    ],
  },
  importation_machine: {
    step2: [
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
      { key: "machine_type", label: "Vermeer or Dingo?", type: "radio", options: ["Vermeer", "Dingo"] },
      { key: "machine_access_width", label: "Machine access path width (ft)", type: "number" },
      // soil_types: multi-select handled inline
    ],
    step3: [
      { key: "dump_trailer_needed", label: "Dump Trailer Needed?", type: "radio", options: ["Yes", "No"] },
      { key: "ramps_needed", label: "Ramps Needed (count)", type: "number" },
      { key: "surface_protection", label: "Surface protection needed?", type: "radio", options: ["Yes", "No"] },
      { key: "utilities_checked", label: "⚠️ Confirm: marked utilities are NOT within 18 inches of machine path", type: "radio", options: ["Confirmed", "Not Yet Checked"] },
      { key: "grading_plan_required", label: "Grading plan / Zip level needed?", type: "radio", options: ["Yes", "No"] },
    ],
  },
};

export function getRGSubTypeLabel(value) {
  return RG_SUB_TYPES.find(s => s.value === value)?.label || value;
}
export function getRGCategory(value) {
  return RG_SUB_TYPES.find(s => s.value === value)?.category || "";
}

export function calcCY(sf, depthInches) {
  if (!sf || !depthInches || isNaN(sf) || isNaN(depthInches)) return null;
  const cy = (parseFloat(sf) * parseFloat(depthInches) / 12) / 27;
  return Math.round(cy * 100) / 100;
}

export function calcCYFluff(cy) {
  if (cy == null) return null;
  return Math.round(cy * 1.25 * 100) / 100;
}

export function calcEstimatedTons(cy, materialType, dryOrWet) {
  if (!cy || !materialType || !dryOrWet) return null;
  const weights = MATERIAL_WEIGHTS[materialType];
  if (!weights) return null;
  const key = dryOrWet === "Wet" ? "wet" : "dry";
  const lbs = parseFloat(cy) * weights[key];
  const tons = lbs / 2000;
  return Math.round(tons * 100) / 100;
}