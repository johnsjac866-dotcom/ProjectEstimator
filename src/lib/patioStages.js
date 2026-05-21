export const PATIO_STAGES = [
  {
    id: "initial_checks",
    title: "Initial Patio/Walkway Checks",
    description: "Verify site access and logistics before proceeding.",
    fields: [
      { key: "vermeer_dingo_access", label: "Can Vermeer or Dingo access patio/walkway site?", type: "select", options: ["Yes", "No", "Limited"] },
      { key: "vermeer_lift_pallet", label: "Can Vermeer lift a full pallet?", type: "select", options: ["Yes", "No"] },
      { key: "material_delivery", label: "Can material be delivered to job site?", type: "select", options: ["Yes", "No", "With Restrictions"] },
      { key: "access_measurements", label: "Site access measurements / notes", type: "textarea" },
      { key: "existing_patio_reuse", label: "Is there an existing patio/walkway to reuse?", type: "select", options: ["Yes", "No"] },
    ],
  },
  {
    id: "demolition",
    title: "1) Demolition & Removals - Hardscape - Patio",
    category: "Demolition & Removals - Hardscape - Patio",
    description: "Is demolition of existing hardscape required?",
    fields: [
      { key: "demo_needed", label: "Demolition needed?", type: "select", options: ["Yes", "No"] },
      { key: "demo_sf", label: "SF of demolition area", type: "number", condition: { key: "demo_needed", value: "Yes" } },
      { key: "demo_material", label: "Existing material to remove", type: "text", condition: { key: "demo_needed", value: "Yes" } },
      { key: "demo_notes", label: "Demolition notes", type: "textarea", condition: { key: "demo_needed", value: "Yes" } },
    ],
  },
  {
    id: "excavation",
    title: "2) Excavation & Disposal",
    category: "Walkway / Patio - 2) Excavation & Disposal",
    description: "Excavation measurements, disposal method, and access decisions.",
    fields: [
      { key: "exc_needed", label: "Excavation needed?", type: "select", options: ["Yes", "No"] },
      { key: "exc_patio_sf", label: "SF of patio", type: "number", condition: { key: "exc_needed", value: "Yes" } },
      { key: "exc_extra_perimeter_lf", label: "Extra perimeter LF (add 1 LF around perimeter)", type: "number", condition: { key: "exc_needed", value: "Yes" } },
      { key: "exc_distance_to_truck", label: "Distance to truck (ft)", type: "number", condition: { key: "exc_needed", value: "Yes" } },
      { key: "exc_machine_access", label: "Dingo / Vermeer / Skid access?", type: "select", options: ["Dingo", "Vermeer", "Skid Steer", "No Machine Access"], condition: { key: "exc_needed", value: "Yes" } },
      { key: "exc_disposal_method", label: "Disposal method", type: "text", condition: { key: "exc_needed", value: "Yes" } },
      { key: "exc_by_hand_or_machine", label: "By hand or by machine?", type: "select", options: ["By Hand", "By Machine (Dingo)", "By Machine (Vermeer)"], condition: { key: "exc_needed", value: "Yes" } },
      { key: "exc_tight_access", label: "Tight access?", type: "select", options: ["Yes", "No"], condition: { key: "exc_needed", value: "Yes" } },
      { key: "exc_existing_material", label: "Existing material description", type: "text", condition: { key: "exc_needed", value: "Yes" } },
    ],
  },
  {
    id: "base_install",
    title: "3) Base Install",
    description: "Select the base type and provide measurements. Base SF = Patio SF + (1 × LF not abutting hardscape). Geotextile SF = Patio SF + (2 × LF not abutting hardscape).",
    pickOne: true,
    options: [
      { value: "3a", label: "3a) 6\" Permeable Base", category: "Walkway / Patio - 3a) Base Install - 6\" Permeable Base" },
      { value: "3b", label: "3b) 6\" Road Gravel Base", category: "Walkway / Patio - 3b) Base Install - 6\" Road Gravel Base" },
      { value: "3c", label: "3c) Gator Base", category: "Walkway / Patio - 3c) Base Install - Gator Base" },
    ],
    fields: [
      { key: "base_selection", label: "Base type", type: "pick_one" },
      { key: "base_sf", label: "SF", type: "number" },
      { key: "base_depth", label: "Base depth (inches)", type: "number", hint: "At least 6\" for Permeable/Road Gravel, 1.5\" for Gator Base" },
      { key: "base_lf_not_abutting", label: "LF not abutting hardscape", type: "number" },
      { key: "base_abutting_asphalt_cut", label: "Abutting asphalt needs to be cut?", type: "select", options: ["Yes", "No"] },
      { key: "base_by_hand_or_machine", label: "By machine or by hand?", type: "select", options: ["By Hand", "By Machine"] },
      { key: "base_plate_compactor", label: "Plate compactor needed?", type: "select", options: ["Yes", "No"] },
      { key: "base_access", label: "Access constraints", type: "text" },
      { key: "base_subgrade_condition", label: "Subgrade condition (especially near new additions)", type: "text" },
    ],
  },
  {
    id: "leveling_layer",
    title: "4) Install Leveling Layer",
    description: "Select leveling layer type. Ensure stone/paver system compatibility.",
    pickOne: true,
    options: [
      { value: "4a", label: "4a) Limestone Screenings (Irregular Flagstone)", category: "Walkway / Patio - 4a) Install Leveling Layer - Limestone Screenings (Irregular Flagstone)" },
      { value: "4b", label: "4b) Niagara Chip (Permeable - Brick or Flag)", category: "Walkway / Patio - 4b) Install Leveling Layer - Niagara Chip (Permeable - Brick or Flag)" },
      { value: "4c", label: "4c) Sand (Brick only - not standard)", category: "Walkway / Patio - 4c) Install Leveling Layer - Sand (Brick only - not standard)" },
    ],
    fields: [
      { key: "level_selection", label: "Leveling layer type", type: "pick_one" },
      { key: "level_sf", label: "SF", type: "number" },
      { key: "level_depth", label: "Layer depth (inches)", type: "number", hint: "Default 1 inch if not specified" },
      { key: "level_compatibility_notes", label: "Stone / Paver system compatibility notes", type: "textarea" },
    ],
  },
  {
    id: "install_type",
    title: "5) Surface Install",
    description: "Select surface material install type and provide measurements.",
    pickOne: true,
    options: [
      { value: "5a", label: "5a) Brick Install", category: "Walkway / Patio - 5a) Brick Install" },
      { value: "5b", label: "5b) Flagstone (Dimensional - Gauged For Thickness)", category: "Walkway / Patio - 5b) Flagstone (Dimensional - Gauged For Thickness)" },
      { value: "5c", label: "5c) Flagstone (Irregular)", category: "Walkway / Patio - 5c) Flagstone (Irregular)" },
      { value: "5d", label: "5d) Paver Install", category: "Walkway / Patio - 5d) Paver Install" },
    ],
    fields: [
      { key: "install_selection", label: "Install type", type: "pick_one" },
      { key: "install_sf", label: "SF", type: "number" },
      { key: "install_lf_curves", label: "LF of curves (if cutting)", type: "number" },
      { key: "install_pattern", label: "Pattern", type: "text" },
      { key: "install_piece_size", label: "Piece size / count (if applicable)", type: "text" },
      { key: "install_material_type", label: "Material type / color / source", type: "text" },
      { key: "install_border_course", label: "Border course?", type: "select", options: ["Yes", "No"] },
      { key: "install_border_lf_straight", label: "Border LF straight", type: "number", condition: { key: "install_border_course", value: "Yes" } },
      { key: "install_border_lf_convex", label: "Border LF curved convex", type: "number", condition: { key: "install_border_course", value: "Yes" } },
      { key: "install_border_lf_concave", label: "Border LF curved concave", type: "number", condition: { key: "install_border_course", value: "Yes" } },
      { key: "install_machine_access", label: "Access to machine use and full pallets", type: "text" },
      { key: "install_cutting_complexity", label: "Cutting complexity", type: "text" },
      { key: "install_thickness_consistency", label: "Thickness consistency", type: "text" },
    ],
  },
  {
    id: "edge_restraint",
    title: "6) Edge Restraint Install (Brick Only)",
    description: "Select edge restraint type. Only applicable for brick or paver installs.",
    pickOne: true,
    conditional: { key: "install_selection", values: ["5a", "5d"] },
    options: [
      { value: "6a", label: "6a) Aluminum Edge (Standard)", category: "Walkway / Patio - 6a) Edge Restraint install (Brick Only) - Aluminum Edge (Standard)" },
      { value: "6b", label: "6b) Concrete Edge", category: "Walkway / Patio - 6b) Edge Restraint install (Brick Only) - Concrete Edge" },
      { value: "none", label: "Not applicable" },
    ],
    fields: [
      { key: "edge_selection", label: "Edge restraint type", type: "pick_one" },
      { key: "edge_lf", label: "LF", type: "number", condition: { key: "edge_selection", notValue: "none" } },
      { key: "edge_curves_corners", label: "Curves / Corners description", type: "text", condition: { key: "edge_selection", notValue: "none" } },
      { key: "edge_subgrade_stability", label: "Subgrade stability notes", type: "text", condition: { key: "edge_selection", notValue: "none" } },
    ],
  },
  {
    id: "compact_field",
    title: "7) Compact Field (Brick/Paver Only)",
    category: "Walkway / Patio - 7) Compact Field(Brick Only)",
    description: "Compact field is required for brick or paver installs.",
    conditional: { key: "install_selection", values: ["5a", "5d"] },
    fields: [
      { key: "compact_needed", label: "Compact field needed?", type: "select", options: ["Yes", "No"] },
      { key: "compact_sf", label: "SF", type: "number", condition: { key: "compact_needed", value: "Yes" } },
    ],
  },
  {
    id: "joint_filler",
    title: "8) Joint Filler Install",
    description: "Select joint filler type. Ensure surface material compatibility.",
    pickOne: true,
    options: [
      { value: "8a", label: "8a) Sand & Sealer (Brick Standard)", category: "Walkway / Patio - 8a) Joint Filler Install - Sand & Sealer (Brick Standard)" },
      { value: "8b", label: "8b) Easy Joint", category: "Walkway / Patio - 8b) Joint Filler Install - Easy Joint" },
      { value: "8c", label: "8c) Permeable Chips (Permeable Brick or Flag Standard)", category: "Walkway / Patio - 8c) Joint Filler Install - Permeable Chips (Permeable Brick or Flag Standard)" },
      { value: "8d", label: "8d) Poly Sand (Brick)", category: "Walkway / Patio - 8d) Joint Filler Install - Poly Sand (Brick)" },
      { value: "8e", label: "8e) Poly Sand (Flagstone)", category: "Walkway / Patio - 8e) Joint Filler Install - Poly Sand (Flagstone)" },
      { value: "8f", label: "8f) Screenings (Flagstone)", category: "Walkway / Patio - 8f) Joint Filler Install - Screenings (Flagstone)" },
    ],
    fields: [
      { key: "joint_selection", label: "Joint filler type", type: "pick_one" },
      { key: "joint_sf", label: "SF", type: "number" },
      { key: "joint_weather", label: "Weather constraints", type: "text" },
      { key: "joint_compatibility", label: "Surface material compatibility notes", type: "text" },
    ],
  },
  {
    id: "repair_adjacent",
    title: "8) Repair Adjacent",
    category: "Walkway / Patio - 8) Repair Adjacent",
    description: "Repair any adjacent areas disturbed during construction.",
    fields: [
      { key: "repair_needed", label: "Repair adjacent needed?", type: "select", options: ["Yes", "No"] },
      { key: "repair_sf_lf", label: "SF/LF disturbed", type: "text", condition: { key: "repair_needed", value: "Yes" } },
      { key: "repair_material_method", label: "Repair material / method", type: "text", condition: { key: "repair_needed", value: "Yes" } },
    ],
  },
  {
    id: "seal",
    title: "9) Seal (Brick)",
    category: "Walkway / Patio - 9) Seal (Brick)",
    description: "Sealing is applicable if brick install and sealing are discussed.",
    conditional: { key: "install_selection", values: ["5a"] },
    fields: [
      { key: "seal_needed", label: "Sealing needed?", type: "select", options: ["Yes", "No"] },
      { key: "seal_sf", label: "SF", type: "number", condition: { key: "seal_needed", value: "Yes" } },
      { key: "seal_product", label: "Sealer product / finish", type: "text", condition: { key: "seal_needed", value: "Yes" } },
      { key: "seal_weather", label: "Weather / surface dryness constraints", type: "text", condition: { key: "seal_needed", value: "Yes" } },
    ],
  },
  {
    id: "final_cleanup",
    title: "9+) Final Cleanup",
    category: "Walkway / Patio - 9+) Final Cleanup",
    description: "Final site cleanup and client handoff.",
    fields: [
      { key: "cleanup_zones", label: "Work zones/areas", type: "textarea" },
      { key: "cleanup_haulaway", label: "Haul-away / washdown expectations", type: "text" },
      { key: "cleanup_handoff", label: "Client handoff standard", type: "text" },
    ],
  },
];

export function getApplicableStages(data) {
  return PATIO_STAGES.filter(stage => {
    if (!stage.conditional) return true;
    const val = data[stage.conditional.key];
    return stage.conditional.values.includes(val);
  });
}

export function getVisibleFields(stage, data) {
  return stage.fields.filter(field => {
    if (!field.condition) return true;
    if (field.condition.value) return data[field.condition.key] === field.condition.value;
    if (field.condition.notValue) return data[field.condition.key] !== field.condition.notValue;
    return true;
  });
}

export function getSelectedCategories(data) {
  const categories = [];
  for (const stage of PATIO_STAGES) {
    if (stage.conditional) {
      const val = data[stage.conditional.key];
      if (!stage.conditional.values.includes(val)) continue;
    }
    if (stage.category) {
      if (stage.id === "demolition" && data.demo_needed !== "Yes") continue;
      if (stage.id === "compact_field" && data.compact_needed !== "Yes") continue;
      if (stage.id === "repair_adjacent" && data.repair_needed !== "Yes") continue;
      if (stage.id === "seal" && data.seal_needed !== "Yes") continue;
      categories.push(stage.category);
    }
    if (stage.pickOne && stage.options) {
      const selKey = stage.fields.find(f => f.type === "pick_one")?.key;
      const selected = data[selKey];
      const opt = stage.options.find(o => o.value === selected);
      if (opt?.category) categories.push(opt.category);
    }
  }
  // Always add final cleanup and excavation if applicable
  return categories;
}