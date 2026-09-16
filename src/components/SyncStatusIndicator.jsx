import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SyncStatusIndicator() {
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  useEffect(() => {
    const onOnline = () => {
      setOnline(true);
      setSyncing(true);
      setTimeout(() => {
        setSyncing(false);
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2000);
      }, 1500);
    };
    const onOffline = () => setOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (online && !syncing && !justSynced) return null;

  return (
    <div className="flex justify-center py-1.5 bg-muted/50 border-b border-border text-xs">
      {!online && (
        <span className="flex items-center gap-1.5 text-amber-600 font-medium">
          <WifiOff className="h-3.5 w-3.5" /> Offline — changes saved locally
        </span>
      )}
      {syncing && (
        <span className="flex items-center gap-1.5 text-blue-600 font-medium">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Syncing…
        </span>
      )}
      {justSynced && (
        <span className="flex items-center gap-1.5 text-green-600 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" /> All synced
        </span>
      )}
    </div>
  );
}