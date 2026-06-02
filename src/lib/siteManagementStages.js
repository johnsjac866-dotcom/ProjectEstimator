export const SM_STAGES = [
  {
    id: "tax_status",
    title: "Tax Status",
    description: "Select all that apply — Non-Taxable, Taxable, or both.",
    fields: [
      { key: "tax_status_nontaxable", label: "Non-Taxable", type: "checkbox" },
      { key: "tax_status_taxable",    label: "Taxable",     type: "checkbox" },
    ],
  },
  {
    id: "parking_storage",
    title: "Parking / Storage / Site Organization",
    description: "Select all items needed. Draw these items onto the plan.",
    fields: [
      { key: "street_occupancy_permit", label: "Street Occupancy Permit", type: "checkbox" },
      { key: "parking_spot_days", label: "Parking spot — Days", type: "number", condition: { key: "street_occupancy_permit", value: true } },
      { key: "trailer_dumpster_days", label: "Leave trailer / dumpster / material on street — Days", type: "number", condition: { key: "street_occupancy_permit", value: true } },
      { key: "no_parking_signs", label: "No parking signs", type: "checkbox", condition: { key: "street_occupancy_permit", value: true } },
      { key: "sidewalk_closed_signage_days", label: "Sidewalk closed signage — Days", type: "number", condition: { key: "street_occupancy_permit", value: true } },
      { key: "job_box", label: "Job Box", type: "checkbox" },
      { key: "jobsite_trailer", label: "Jobsite Trailer", type: "checkbox" },
      { key: "pallet_use", label: "Pallet use", type: "checkbox" },
      { key: "porta_potty", label: "Porta Potty", type: "checkbox" },
    ],
  },
  {
    id: "access_needs",
    title: "Access Needs",
    description: "Select all access protection and preparation needed.",
    fields: [
      { key: "ground_protection", label: "Ground Protection", type: "checkbox" },
      { key: "plywood_ea", label: "Plywood — Ea", type: "number", condition: { key: "ground_protection", value: true } },
      { key: "rubber_access_mats_lf", label: "Rubber Access Mats — LF", type: "number", condition: { key: "ground_protection", value: true } },
      { key: "tree_protection", label: "Tree Protection / Tie Back", type: "checkbox" },
      { key: "tree_protection_lf", label: "Tree Protection / Tie Back — LF", type: "number", condition: { key: "tree_protection", value: true } },
      { key: "foam_board", label: "Foam Board (Padding for buildings, etc.)", type: "checkbox" },
      { key: "foam_board_ea", label: "Foam Board — Ea", type: "number", condition: { key: "foam_board", value: true } },
      { key: "ramp_creation", label: "Ramp Creation for machine access", type: "checkbox" },
      { key: "ramp_creation_notes", label: "Ramp Creation — Notes", type: "text", condition: { key: "ramp_creation", value: true } },
    ],
  },
  {
    id: "stormwater",
    title: "Stormwater Management",
    description: "Select all stormwater management items needed.",
    fields: [
      { key: "downspout_extensions", label: "Downspout Extensions", type: "checkbox" },
      { key: "downspout_sections", label: "Downspout Extensions — # Sections", type: "number", condition: { key: "downspout_extensions", value: true } },
      { key: "downspout_lf", label: "Downspout Extensions — LF Total", type: "number", condition: { key: "downspout_extensions", value: true } },
      { key: "silt_fence", label: "Silt Fence", type: "checkbox" },
      { key: "silt_fence_sections", label: "Silt Fence — # Sections", type: "number", condition: { key: "silt_fence", value: true } },
      { key: "silt_fence_lf", label: "Silt Fence — LF Total", type: "number", condition: { key: "silt_fence", value: true } },
      { key: "erosion_logs", label: "Erosion Logs", type: "checkbox" },
      { key: "erosion_logs_sections", label: "Erosion Logs — # Sections", type: "number", condition: { key: "erosion_logs", value: true } },
      { key: "erosion_logs_lf", label: "Erosion Logs — LF Total", type: "number", condition: { key: "erosion_logs", value: true } },
      { key: "tarps", label: "Tarps", type: "checkbox" },
      { key: "tarps_16x24_qty", label: "Tarps 16×24' — Qty", type: "number", condition: { key: "tarps", value: true } },
      { key: "tarps_8x12_qty", label: "Tarps 8×12' — Qty", type: "number", condition: { key: "tarps", value: true } },
      { key: "tarps_other1_size", label: "Other tarp size #1", type: "text", condition: { key: "tarps", value: true } },
      { key: "tarps_other1_qty", label: "Other tarp #1 — Qty", type: "number", condition: { key: "tarps", value: true } },
      { key: "tarps_other2_size", label: "Other tarp size #2", type: "text", condition: { key: "tarps", value: true } },
      { key: "tarps_other2_qty", label: "Other tarp #2 — Qty", type: "number", condition: { key: "tarps", value: true } },
    ],
  },
  {
    id: "parking_coordination",
    title: "Parking Coordination",
    description: "Parking coordination time and effort.",
    fields: [
      { key: "parking_coordination", label: "Parking Coordination needed?", type: "checkbox" },
      { key: "parking_days", label: "Days on project", type: "number", condition: { key: "parking_coordination", value: true } },
      { key: "parking_hours", label: "Hours coordinating", type: "number", condition: { key: "parking_coordination", value: true } },
    ],
  },
  {
    id: "moving_items",
    title: "Moving Items (Small / Tight Projects)",
    description: "Moving items multiple times on small or tight projects.",
    fields: [
      { key: "moving_items", label: "Moving items multiple times needed?", type: "checkbox" },
      { key: "moving_items_hours", label: "Hours coordinating", type: "number", condition: { key: "moving_items", value: true } },
    ],
  },
  {
    id: "remove_reinstall",
    title: "Remove and Reinstall Site Elements",
    description: "e.g. Fence panel needed to access site. Select if applicable.",
    fields: [
      { key: "remove_reinstall", label: "Remove and Reinstall Site Elements needed?", type: "checkbox" },
      { key: "remove_reinstall_purchase", label: "Time to Purchase / Deliver", type: "text", condition: { key: "remove_reinstall", value: true } },
      { key: "remove_reinstall_install", label: "Time to Install", type: "text", condition: { key: "remove_reinstall", value: true } },
      { key: "remove_reinstall_manage", label: "Time to Daily Manage", type: "text", condition: { key: "remove_reinstall", value: true } },
      { key: "remove_reinstall_remove", label: "Time to Remove / Restock", type: "text", condition: { key: "remove_reinstall", value: true } },
    ],
  },
];

export function getSMVisibleFields(stage, data) {
  return stage.fields.filter(field => {
    if (!field.condition) return true;
    return data[field.condition.key] === field.condition.value;
  });
}