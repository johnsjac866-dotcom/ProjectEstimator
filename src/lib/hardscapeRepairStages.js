export const HARDSCAPE_REPAIR_STAGES = [
  {
    id: "repair_type",
    title: "Repair Existing Type",
    description: "Select the type of hardscape to repair.",
    fields: [
      { key: "repair_type", label: "Repair Existing Type", type: "select", options: ["Patio or Walkway"] },
    ],
  },
  {
    id: "size",
    title: "Size",
    description: "Enter the dimensions of the repair area. SF will be calculated from Length × Width.",
    fields: [
      { key: "length", label: "Length (ft)", type: "number" },
      { key: "width", label: "Width (ft)", type: "number" },
      { key: "sf", label: "Square Footage (SF)", type: "number", hint: "Auto-calculated from Length × Width, or enter manually." },
      { key: "time_estimate", label: "Time Estimate (hrs)", type: "number" },
    ],
  },
  {
    id: "material_type",
    title: "Surface Type",
    description: "What type of surface material is being repaired?",
    fields: [
      { key: "material_type", label: "Type", type: "select", options: ["Brick", "FlagStone - Dimensional", "FlagStone - Irregular", "Paver"] },
    ],
  },
  {
    id: "new_material",
    title: "New Material Needed?",
    description: "Does the repair require new surface material?",
    fields: [
      { key: "new_material_needed", label: "New material needed?", type: "select", options: ["Yes", "No"] },
      { key: "new_material_unit", label: "Unit", type: "select", options: ["SF", "SY", "LF", "Each"], condition: { key: "new_material_needed", value: "Yes" } },
      { key: "new_material_qty", label: "Quantity", type: "number", condition: { key: "new_material_needed", value: "Yes" } },
    ],
  },
  {
    id: "new_base",
    title: "New Base Needed?",
    description: "Does the repair require a new base layer?",
    fields: [
      { key: "new_base_needed", label: "New base needed?", type: "select", options: ["Yes", "No"] },
      { key: "new_base_type", label: "Base Type", type: "select", options: ["Gator Base", "Road Gravel Base", "Permeable Base"], condition: { key: "new_base_needed", value: "Yes" } },
    ],
  },
  {
    id: "new_leveling",
    title: "New Leveling Layer Needed?",
    description: "Does the repair require a new leveling layer?",
    fields: [
      { key: "new_leveling_needed", label: "New leveling layer needed?", type: "select", options: ["Yes", "No"] },
      { key: "new_leveling_type", label: "Leveling Layer Type", type: "select", options: ["Limestone Screenings", "Niagara Chip", "Sand"], condition: { key: "new_leveling_needed", value: "Yes" } },
    ],
  },
  {
    id: "new_edge",
    title: "New Edge Needed?",
    description: "Does the repair require a new edge restraint?",
    fields: [
      { key: "new_edge_needed", label: "New edge needed?", type: "select", options: ["Yes", "No"] },
      { key: "new_edge_type", label: "Edge Type", type: "select", options: ["Aluminum Edge", "Concrete Edge"], condition: { key: "new_edge_needed", value: "Yes" } },
      { key: "new_edge_lf", label: "LF of edge", type: "number", condition: { key: "new_edge_needed", value: "Yes" } },
    ],
  },
  {
    id: "machine_access",
    title: "Machine Access",
    description: "What type of machine access is available on site?",
    fields: [
      { key: "machine_access", label: "Machine Access", type: "select", options: ["Vermeer", "Dingo", "By hand"] },
    ],
  },
  {
    id: "constraints",
    title: "Constraints or Hazards",
    description: "Note any site constraints, hazards, or special conditions.",
    fields: [
      { key: "constraints", label: "Constraints or hazards", type: "textarea" },
    ],
  },
];

export function getVisibleFields(stage, data) {
  return stage.fields.filter(field => {
    if (!field.condition) return true;
    if (field.condition.value) return data[field.condition.key] === field.condition.value;
    if (field.condition.notValue) return data[field.condition.key] !== field.condition.notValue;
    return true;
  });
}