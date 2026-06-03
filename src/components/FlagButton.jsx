import { Flag } from "lucide-react";

/**
 * A small flag toggle button to place next to any field label.
 * flags: array of flagged field keys (data._flags)
 * fieldKey: the key for this field
 * onToggle: (fieldKey) => void
 */
export default function FlagButton({ flags = [], fieldKey, onToggle }) {
  const isFlagged = flags.includes(fieldKey);
  return (
    <button
      type="button"
      title={isFlagged ? "Remove flag" : "Flag this question"}
      onClick={() => onToggle(fieldKey)}
      className={`inline-flex items-center justify-center h-5 w-5 rounded transition-colors ml-1 align-middle ${
        isFlagged ? "text-orange-500" : "text-muted-foreground/40 hover:text-orange-400"
      }`}
    >
      <Flag className="h-3 w-3" fill={isFlagged ? "currentColor" : "none"} />
    </button>
  );
}