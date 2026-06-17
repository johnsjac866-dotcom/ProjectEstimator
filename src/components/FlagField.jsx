import { Flag } from "lucide-react";

/**
 * Wraps a form field with a flag toggle button next to its label.
 *
 * Props:
 *   fieldKey    - unique key for the field (stored in _flags array)
 *   label       - display label string
 *   flags       - array of flagged keys (form._flags or data._flags)
 *   onToggle    - (key, label) => void
 *   children    - the actual input / control(s)
 *   className   - optional extra classes on the wrapper div
 */
export default function FlagField({ fieldKey, label, flags = [], onToggle, children, className = "" }) {
  const isFlagged = flags.includes(fieldKey);
  return (
    <div data-flagfield={fieldKey} className={`relative ${isFlagged ? "rounded-lg ring-1 ring-orange-300 bg-orange-50/30 p-2 -mx-2" : ""} ${className}`}>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-sm font-medium leading-none">{label}</span>
        <button
          type="button"
          title={isFlagged ? "Remove flag" : "Flag this question"}
          onClick={() => onToggle(fieldKey, label)}
          className={`inline-flex items-center justify-center h-5 w-5 rounded transition-colors ${
            isFlagged ? "text-orange-500" : "text-muted-foreground/30 hover:text-orange-400"
          }`}
        >
          <Flag className="h-3 w-3" fill={isFlagged ? "currentColor" : "none"} />
        </button>
      </div>
      {children}
    </div>
  );
}