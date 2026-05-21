export const RG_SUB_TYPES = [
  { value: "excavation_hand",    label: "Excavation & Exportation - By Hand",              category: "Rough Grading & Hauling - Excavation & Exportation By Hand" },
  { value: "excavation_machine", label: "Excavation & Exportation - By Machine",           category: "Rough Grading & Hauling - Excavation & Exportation By Machine" },
  { value: "importation_hand",   label: "Soil Importation & Spreading - By Hand",          category: "Rough Grading & Hauling - Soil Importation & Spreading - By Hand" },
  { value: "importation_machine",label: "Soil Importation & Spreading - By Machine",       category: "Rough Grading & Hauling - Soil Importation & Spreading - By Machine" },
];

// Fields per sub-type — SF/depth/CY are handled specially in the wizard UI
export const RG_FIELDS = {
  excavation_hand: {
    step2: [
      { key: "distance_to_parking", label: "Distance to parking spot (ft)", type: "number" },
    ],
    step3: [
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
      { key: "machine_type", label: "Vermeer or Dingo?", type: "radio", options: ["Vermeer", "Dingo"] },
      { key: "machine_access_width", label: "Machine access path width (ft)", type: "number" },
    ],
    step3: [
      { key: "sod_vegetation_removed", label: "Sod or vegetation being removed?", type: "radio", options: ["Yes", "No"],
        note: "If Yes: add 'Demolition & Removals - Vegetation & Softscape Items - Strip Sod Manually (Update Disposal Fee)' category — SF = top 1\" of area being removed" },
      { key: "disposal_needed", label: "Disposal needed?", type: "radio", options: ["Yes", "No"] },
      { key: "disposal_location", label: "Disposal location", type: "select",
        options: ["Mandt - 2079 Hwy MM, Fitchburg", "Homburg - 5715 Milwaukee St, Madison"],
        condition: { key: "disposal_needed", value: "Yes" } },
      { key: "surface_protection", label: "Surface protection needed?", type: "radio", options: ["Yes", "No"] },
      { key: "utilities_checked", label: "⚠️ Confirm: marked utilities are NOT within 18 inches of machine path", type: "radio", options: ["Confirmed", "Not Yet Checked"] },
      { key: "grading_plan_required", label: "Grading plan required? (Bring zip level or U level)", type: "radio", options: ["Yes", "No"] },
    ],
  },
  importation_hand: {
    step2: [
      { key: "carry_distance", label: "Carry distance (ft)", type: "number" },
      { key: "soil_type", label: "Soil type", type: "text" },
    ],
    step3: [],
  },
  importation_machine: {
    step2: [
      { key: "machine_type", label: "Vermeer or Dingo?", type: "radio", options: ["Vermeer", "Dingo"] },
      { key: "machine_access_width", label: "Machine access path width (ft)", type: "number" },
      { key: "soil_type", label: "Soil type", type: "text" },
    ],
    step3: [
      { key: "surface_protection", label: "Surface protection needed?", type: "radio", options: ["Yes", "No"] },
      { key: "utilities_checked", label: "⚠️ Confirm: marked utilities are NOT within 18 inches of machine path", type: "radio", options: ["Confirmed", "Not Yet Checked"] },
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