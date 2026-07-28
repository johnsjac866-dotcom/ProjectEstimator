/**
 * Clarification rules per operation type.
 *
 * Each rule defines:
 *   - trigger(op): returns true if this operation needs clarification
 *   - questions: array of { id, question, options: [{label, value}], skipIf?, showIf?, defaultValue? }
 *   - resolve(op, answers): returns the updated operation with resolved fields
 *
 * When the AI analysis returns an operation with `missing_critical_data`,
 * the frontend checks if a clarification rule exists for that operation type
 * and triggers the ClarificationDialog.
 */

// Helper: derive Bed Prep main_type from sub_type
function bedMainTypeFromSub(sub) {
  if (!sub) return null;
  if (sub.startsWith('till')) return 'till';
  if (sub.startsWith('notill')) return 'no_till';
  if (sub.startsWith('lawn')) return 'lawn';
  if (sub.startsWith('repro')) return 'reprofiling';
  return null;
}

// Helper: derive Demolition group from sub_type
function demoGroupFromSub(sub) {
  if (!sub) return null;
  const hardscape = ['deck_timber_wall', 'patio', 'hand_removal_reuse', 'stone_retaining_wall'];
  return hardscape.includes(sub) ? 'hardscape' : 'vegetation';
}

export const CLARIFICATION_RULES = {
  "Rough Grading & Hauling": {
    trigger: (op) => {
      if (!op.sub_type) return true;
      if ((op.sub_type === "excavation_machine" || op.sub_type === "importation_machine") && !op.rg_fields?.machine_type && !op.machine_type) return true;
      return false;
    },
    questions: [
      {
        id: "grading_direction",
        question: "Is this Rough Grading for Excavation (hauling away) or Importation (bringing in soil)?",
        options: [
          { label: "Excavation", value: "excavation" },
          { label: "Importation", value: "importation" },
        ],
        skipIf: (op) => op.sub_type && (op.sub_type.startsWith("excavation") || op.sub_type.startsWith("importation")),
        defaultValue: (op) => {
          if (!op.sub_type) return null;
          if (op.sub_type.startsWith("excavation")) return "excavation";
          if (op.sub_type.startsWith("importation")) return "importation";
          return null;
        },
      },
      {
        id: "access_method",
        question: "Are we using heavy machinery or is this a hand-access job?",
        options: [
          { label: "By Hand", value: "hand" },
          { label: "By Machine", value: "machine" },
        ],
        skipIf: (op) => op.sub_type && (op.sub_type.endsWith("hand") || op.sub_type.endsWith("machine")),
        defaultValue: (op) => {
          if (!op.sub_type) return null;
          if (op.sub_type.endsWith("hand")) return "hand";
          if (op.sub_type.endsWith("machine")) return "machine";
          return null;
        },
      },
      {
        id: "machine_type",
        question: "Which machine — Vermeer or Dingo?",
        options: [
          { label: "Vermeer", value: "Vermeer" },
          { label: "Dingo", value: "Dingo" },
        ],
        showIf: (answers, op) => {
          const isMachine = answers.access_method === "machine" || (op.sub_type && op.sub_type.endsWith("machine"));
          const hasMachineType = op.rg_fields?.machine_type || op.machine_type;
          return isMachine && !hasMachineType;
        },
      },
    ],
    resolve: (op, answers) => {
      let direction = answers.grading_direction;
      if (!direction && op.sub_type) {
        if (op.sub_type.startsWith("excavation")) direction = "excavation";
        if (op.sub_type.startsWith("importation")) direction = "importation";
      }
      let access = answers.access_method;
      if (!access && op.sub_type) {
        if (op.sub_type.endsWith("hand")) access = "hand";
        if (op.sub_type.endsWith("machine")) access = "machine";
      }
      let subType = op.sub_type;
      if (direction && access) subType = `${direction}_${access}`;
      const updated = { ...op, sub_type: subType };
      if (answers.machine_type) {
        updated.rg_fields = { ...(op.rg_fields || {}), machine_type: answers.machine_type };
      }
      return updated;
    },
  },

  "Bed Preparation": {
    trigger: (op) => !op.bed_sub_type,
    questions: [
      {
        id: "bed_sub_type",
        question: "Which bed preparation type?",
        options: [
          { label: 'Till — 1" Amendments', value: "till_1in" },
          { label: 'Till — 3" Amendments', value: "till_3in" },
          { label: "No Till — By Hand", value: "notill_hand" },
          { label: "No Till — By Machine", value: "notill_machine" },
          { label: "No Till — Into Dead Sod", value: "notill_deadsod" },
          { label: "Lawn — No Amendments", value: "lawn_none" },
          { label: "Lawn — With Amendments", value: "lawn_1in" },
          { label: "Reprofiling — Against Hardscape", value: "repro_hardscape" },
          { label: "Reprofiling — Narrow Bed", value: "repro_narrow" },
          { label: "Reprofiling — Sloped Bed", value: "repro_sloped" },
          { label: "Reprofiling — Soil Addition", value: "repro_soil" },
        ],
      },
    ],
    resolve: (op, answers) => ({
      ...op,
      bed_sub_type: answers.bed_sub_type,
      bed_main_type: bedMainTypeFromSub(answers.bed_sub_type),
    }),
  },

  "Mulch": {
    trigger: (op) => !op.mulch_type,
    questions: [
      {
        id: "mulch_type",
        question: "Is this Organic or Stone mulch?",
        options: [
          { label: "Organic", value: "Organic" },
          { label: "Stone", value: "Stone" },
        ],
      },
    ],
    resolve: (op, answers) => ({ ...op, mulch_type: answers.mulch_type }),
  },

  "Bed Edging": {
    trigger: (op) => !op.edge_type,
    questions: [
      {
        id: "edge_type",
        question: "Which edging type?",
        options: [
          { label: "Brick", value: "Brick" },
          { label: "Metal", value: "Metal" },
          { label: "Bullet", value: "Bullet" },
          { label: "Natural Edge", value: "Natural Edge" },
          { label: "Poly", value: "Poly" },
          { label: "Snapped Limestone", value: "Snapped Limestone" },
        ],
      },
    ],
    resolve: (op, answers) => ({ ...op, edge_type: answers.edge_type, sub_type: answers.edge_type }),
  },

  "Boulders/Accents & Structures": {
    trigger: (op) => !op.boulders_type,
    questions: [
      {
        id: "boulders_type",
        question: "What type of boulders/structures work?",
        options: [
          { label: "Boulders / Accents", value: "Boulders / Accents" },
          { label: "Structures — Fence", value: "Structures - Fence" },
          { label: "Structures — Arbor", value: "Structures - Arbor" },
          { label: "Raised Garden Bed", value: "Raised Garden Bed" },
        ],
      },
    ],
    resolve: (op, answers) => ({ ...op, boulders_type: answers.boulders_type }),
  },

  "Planting": {
    trigger: (op) => !op.planting_type,
    questions: [
      {
        id: "planting_type",
        question: "What type of planting?",
        options: [
          { label: "Trees & Shrubs", value: "Trees & Shrubs" },
          { label: "Perennials", value: "Perennials" },
          { label: "Bulbs", value: "Bulbs" },
          { label: "Annuals", value: "Annuals" },
        ],
      },
    ],
    resolve: (op, answers) => ({ ...op, planting_type: answers.planting_type }),
  },

  "Lawn Repair & Install": {
    trigger: (op) => !op.lawn_type,
    questions: [
      {
        id: "lawn_type",
        question: "What type of lawn work?",
        options: [
          { label: "Sod Installation", value: "Sod Installation" },
          { label: "Seed Install", value: "Seed Install" },
          { label: "Top Dress Lawn", value: "Top Dress Lawn" },
        ],
      },
    ],
    resolve: (op, answers) => ({ ...op, lawn_type: answers.lawn_type }),
  },

  "Demolition & Removals": {
    trigger: (op) => !op.demo_sub_type,
    questions: [
      {
        id: "demo_sub_type",
        question: "What type of demolition?",
        options: [
          { label: "Hardscape — Deck/Timber Wall", value: "deck_timber_wall" },
          { label: "Hardscape — Patio", value: "patio" },
          { label: "Hardscape — Hand Removal for Reuse", value: "hand_removal_reuse" },
          { label: "Hardscape — Stone Retaining Wall", value: "stone_retaining_wall" },
          { label: "Vegetation — Woody (Flush Cut)", value: "woody_flush_cut" },
          { label: "Vegetation — Woody (Incl Stumps)", value: "woody_incl_stumps" },
          { label: "Vegetation — Perennials (Dig)", value: "perennials_dig" },
          { label: "Vegetation — Perennials/Lawn (Herbicide)", value: "perennials_herbicide" },
          { label: "Vegetation — Transplant (Direct)", value: "transplant_direct" },
          { label: "Vegetation — Transplant (Hold)", value: "transplant_dig_hold" },
          { label: "Vegetation — Herbicide (Cut & Treat)", value: "herbicide_cut_treat" },
          { label: "Vegetation — Strip Sod", value: "strip_sod" },
          { label: "Vegetation — Landscape Edging", value: "landscape_edging" },
          { label: "Vegetation — Stone Mulch", value: "stone_mulch" },
          { label: "Vegetation — Weed Fabric", value: "weed_fabric" },
          { label: "Vegetation — Wood Mulch", value: "wood_mulch" },
          { label: "Vegetation — Misc Items", value: "misc_items" },
        ],
      },
    ],
    resolve: (op, answers) => ({
      ...op,
      demo_sub_type: answers.demo_sub_type,
      demo_group: demoGroupFromSub(answers.demo_sub_type),
    }),
  },

  "Drainage": {
    trigger: (op) => !op.drain_type,
    questions: [
      {
        id: "drain_type",
        question: "What type of drainage system?",
        options: [
          { label: "Buried Downspout", value: "Buried Downspout" },
          { label: "Buried Drain", value: "Buried Drain" },
          { label: "Buried Sump Line", value: "Buried Sump Line" },
          { label: "Curtain Drain", value: "Curtain Drain" },
          { label: "French Drain", value: "French Drain" },
          { label: "Dry Stream Bed", value: "Dry Stream Bed" },
          { label: "Impervious Membrane", value: "Impervious Membrane" },
        ],
      },
    ],
    resolve: (op, answers) => ({ ...op, drain_type: answers.drain_type }),
  },
};

/**
 * Check if an operation needs clarification and has rules defined.
 */
export function needsClarification(op) {
  if (!op || !op.operation_type) return false;
  const rules = CLARIFICATION_RULES[op.operation_type];
  if (!rules) return false;
  const hasMissingData = Array.isArray(op.missing_critical_data) && op.missing_critical_data.length > 0;
  return hasMissingData || rules.trigger(op);
}

/**
 * Get the applicable questions for an operation, filtering by skipIf/showIf.
 */
export function getApplicableQuestions(op) {
  const rules = CLARIFICATION_RULES[op.operation_type];
  if (!rules) return [];

  const answers = {};
  for (const q of rules.questions) {
    if (q.defaultValue) {
      const dv = q.defaultValue(op);
      if (dv) answers[q.id] = dv;
    }
  }

  return rules.questions.filter(q => {
    if (q.skipIf && q.skipIf(op)) return false;
    if (q.showIf && !q.showIf(answers, op)) return false;
    return true;
  });
}