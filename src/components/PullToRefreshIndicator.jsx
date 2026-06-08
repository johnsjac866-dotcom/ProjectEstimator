import { RefreshCw } from "lucide-react";

export default function PullToRefreshIndicator({ pulling, refreshing }) {
  const visible = pulling || refreshing;
  return (
    <div className={`ptr-indicator ${visible ? "ptr-visible" : ""}`}>
      <div className="bg-card border border-border shadow-md rounded-full p-2">
        <RefreshCw className={`h-5 w-5 text-primary ${refreshing ? "animate-spin" : ""}`} />
      </div>
    </div>
  );
}