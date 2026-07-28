import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import { CLARIFICATION_RULES, getApplicableQuestions } from "@/lib/clarificationRules";

/**
 * ClarificationDialog — pops up after voice analysis when an operation
 * has missing critical data (e.g., sub_type is null for Rough Grading).
 *
 * Props:
 *   open       - boolean controlling dialog visibility
 *   operation  - the operation object needing clarification
 *   onResolve  - (resolvedOperation) => void  called with the updated operation
 *   onClose    - () => void  called when user skips or closes
 *   index      - current operation index (for "Question X of Y" display)
 *   total      - total operations needing clarification
 */
export default function ClarificationDialog({ open, operation, onResolve, onClose, index = 0, total = 1 }) {
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");

  const rules = operation ? CLARIFICATION_RULES[operation.operation_type] : null;
  const questions = operation ? getApplicableQuestions(operation) : [];

  // Reset answers when operation changes, pre-filling defaults
  useEffect(() => {
    if (!operation || !rules) return;
    const initial = {};
    for (const q of rules.questions) {
      if (q.defaultValue) {
        const dv = q.defaultValue(operation);
        if (dv) initial[q.id] = dv;
      }
    }
    setAnswers(initial);
    setError("");
  }, [operation]);

  if (!operation || !rules) return null;

  function selectAnswer(questionId, value) {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
    setError("");
  }

  function handleSubmit() {
    // Validate all visible questions have answers
    const unanswered = questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      setError("Please answer all questions to continue.");
      return;
    }
    const resolved = rules.resolve(operation, answers);
    onResolve(resolved);
  }

  function handleSkip() {
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSkip(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">Clarification Needed</DialogTitle>
              {total > 1 && (
                <p className="text-sm text-muted-foreground">Operation {index + 1} of {total}</p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            <span className="font-medium text-foreground">{operation.operation_type}</span> — {operation.description || "No description"}
          </p>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {questions.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-medium mb-2">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.options.map((opt) => {
                  const isSelected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectAnswer(q.id, opt.value)}
                      className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}