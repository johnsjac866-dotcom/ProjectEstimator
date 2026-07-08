import { useState } from "react";
import { ChevronDown, ChevronRight, Flag } from "lucide-react";

const SKIP_KEYS = ["id", "_flags", "_flag_labels", "sub_type", "mulch_type", "lawn_type", "patio_type", "maintenance_type"];

function formatKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";
    if (typeof value[0] === "object") {
      return value.map((item, i) => (
        <div key={i} className="ml-3 border-l-2 border-muted pl-2 mb-1">
          {Object.entries(item).map(([k, v]) => (
            <div key={k} className="text-xs">
              <span className="text-muted-foreground">{formatKey(k)}:</span>{" "}
              <span className="font-medium">{formatValue(v)}</span>
            </div>
          ))}
        </div>
      ));
    }
    return value.join(", ");
  }
  if (typeof value === "object") {
    return (
      <div className="ml-3 border-l-2 border-muted pl-2">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="text-xs">
            <span className="text-muted-foreground">{formatKey(k)}:</span>{" "}
            <span className="font-medium">{formatValue(v)}</span>
          </div>
        ))}
      </div>
    );
  }
  return String(value);
}

export default function OperationEntryDetails({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const flagSet = new Set(entry._flags || []);

  const fields = Object.entries(entry).filter(([k]) => !SKIP_KEYS.includes(k));

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {expanded ? "Hide details" : "Show details"}
      </button>
      {expanded && (
        <div className="mt-1.5 space-y-0.5">
          {fields.map(([k, v]) => {
            const isFlagged = flagSet.has(k);
            return (
              <div key={k} className={`flex items-start gap-1.5 text-xs py-0.5 ${isFlagged ? "text-orange-700" : ""}`}>
                {isFlagged && <Flag className="h-2.5 w-2.5 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" />}
                {!isFlagged && <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30 flex-shrink-0 mt-1" />}
                <span className="text-muted-foreground min-w-0">{formatKey(k)}:</span>
                <span className={`font-medium ${isFlagged && (v === null || v === undefined || v === "") ? "italic text-orange-600" : ""}`}>
                  {formatValue(v)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}