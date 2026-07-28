/**
 * Clarification rules per operation type.
 *
 * Each rule defines:
 *   - trigger(op): returns true if this operation needs clarification
 *   - questions: array of { id, question, options: [{label, value}] }
 *   - resolve(op, answers): returns the updated operation with resolved fields
 *
 * When the AI analysis returns an operation with `missing_critical_data`,
 * the frontend checks if a clarification rule exists for that operation type
 * and triggers the ClarificationDialog.
 */

export const CLARIFICATION_RULES = {
  "Rough Grading & Hauling": {
    trigger: (op) => {
      // Trigger if sub_type is null/empty, or if machine sub-type but machine_type is null
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
        // Skip this question if sub_type already has the direction
        skipIf: (op) => op.sub_type && (op.sub_type.startsWith("excavation") || op.sub_type.startsWith("importation")),
        // Pre-fill from existing sub_type
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
        // Only show if access_method is "machine" (or sub_type ends with "machine")
        showIf: (answers, op) => {
          const isMachine = answers.access_method === "machine" || (op.sub_type && op.sub_type.endsWith("machine"));
          const hasMachineType = op.rg_fields?.machine_type || op.machine_type;
          return isMachine && !hasMachineType;
        },
      },
    ],
    resolve: (op, answers) => {
      // Determine direction
      let direction = answers.grading_direction;
      if (!direction && op.sub_type) {
        if (op.sub_type.startsWith("excavation")) direction = "excavation";
        if (op.sub_type.startsWith("importation")) direction = "importation";
      }

      // Determine access method
      let access = answers.access_method;
      if (!access && op.sub_type) {
        if (op.sub_type.endsWith("hand")) access = "hand";
        if (op.sub_type.endsWith("machine")) access = "machine";
      }

      // Combine into sub_type
      let subType = op.sub_type;
      if (direction && access) {
        subType = `${direction}_${access}`;
      }

      const updated = { ...op, sub_type: subType };

      // Set machine_type in rg_fields if answered
      if (answers.machine_type) {
        updated.rg_fields = { ...(op.rg_fields || {}), machine_type: answers.machine_type };
      }

      return updated;
    },
  },
};

/**
 * Check if an operation needs clarification and has rules defined.
 */
export function needsClarification(op) {
  if (!op || !op.operation_type) return false;
  const rules = CLARIFICATION_RULES[op.operation_type];
  if (!rules) return false;
  // Trigger if missing_critical_data is non-empty OR the rule's trigger function returns true
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
  // Pre-fill defaults
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