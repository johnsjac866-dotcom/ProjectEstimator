import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, Square, Play, Pause, Trash2, MicOff, RefreshCw, CloudOff, Cloud, Upload, CheckCircle } from "lucide-react";
import { VoiceNotes as OfflineVoiceNotes } from "@/lib/offlineVoiceNotes";
import { base44 } from "@/api/base44Client";

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function SyncBadge({ status, onRetry }) {
  if (!status || status === 'synced') return null;

  const configs = {
    pending:   { icon: CloudOff, label: "Saved locally",   className: "text-muted-foreground bg-muted/60" },
    uploading: { icon: Upload,   label: "Uploading…",       className: "text-blue-600 bg-blue-50", spin: false },
    failed:    { icon: RefreshCw, label: "Sync failed — retry", className: "text-destructive bg-destructive/10 cursor-pointer", onClick: onRetry },
  };

  const cfg = configs[status];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <button
      onClick={cfg.onClick}
      className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cfg.className}`}
    >
      <Icon className={`h-3 w-3 ${status === 'uploading' ? 'animate-spin' : ''}`} />
      {cfg.label}
    </button>
  );
}

function NotePlayer({ note, onDelete, onRetry }) {
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [blobReady, setBlobReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadAudio() {
      if (note._pending) {
        // Load from IndexedDB for pending notes
        const { getBlob } = await import("@/lib/voiceNoteBlobs");
        const blob = await getBlob(note.id).catch(() => null);
        if (blob && !cancelled) {
          blobUrlRef.current = URL.createObjectURL(blob);
          if (audioRef.current) audioRef.current.src = blobUrlRef.current;
          setBlobReady(true);
        }
      } else {
        if (audioRef.current) audioRef.current.src = note.audio_url;
        setBlobReady(true);
      }
    }
    loadAudio();
    return () => {
      cancelled = true;
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, [note.id, note._pending, note.audio_url]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onEnd = () => setPlaying(false);
    const onTime = () => setCurrentTime(el.currentTime);
    el.addEventListener("ended", onEnd);
    el.addEventListener("timeupdate", onTime);
    return () => { el.removeEventListener("ended", onEnd); el.removeEventListener("timeupdate", onTime); };
  }, []);

  function togglePlay() {
    const el = audioRef.current;
    if (!el || !blobReady) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  }

  const progress = note.duration > 0 ? (currentTime / note.duration) * 100 : 0;
  const isSynced = !note._pending;

  return (
    <div className={`flex flex-col gap-2 rounded-lg border px-3 py-2.5 ${note._pending ? 'border-dashed border-muted-foreground/30 bg-muted/20' : 'bg-background'}`}>
      <audio ref={audioRef} preload="auto" />
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          disabled={!blobReady}
          className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-40"
        >
          {playing ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">{formatTime(note.created_date)}</span>
            <span className="text-sm text-muted-foreground">{formatDuration(note.duration)}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <button
          onClick={onDelete}
          className="p-2 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {note._pending && (
        <div className="flex items-center justify-between">
          <SyncBadge status={note._syncStatus} onRetry={() => onRetry(note.id)} />
          {isSynced && <CheckCircle className="h-3 w-3 text-green-500" />}
        </div>
      )}
    </div>
  );
}

export default function VoiceNotes({ areaId, onCreateOperation, initialAnalysis }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [permitted, setPermitted] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [savedAnalysis, setSavedAnalysis] = useState(initialAnalysis ? JSON.parse(initialAnalysis) : null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  const loadNotes = useCallback(async () => {
    const records = await OfflineVoiceNotes.filter({ area_id: areaId });
    setNotes(records.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    setLoading(false);
  }, [areaId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Listen for real-time sync updates (e.g. blob uploaded, status changed)
  useEffect(() => {
    function onChanged() {
      const fresh = OfflineVoiceNotes.getCached({ area_id: areaId });
      setNotes(fresh.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
    }
    window.addEventListener('offlineVoiceNotesChanged', onChanged);
    return () => window.removeEventListener('offlineVoiceNotesChanged', onChanged);
  }, [areaId]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  async function startRecording() {
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPermitted(false);
      return;
    }

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4'
      : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/wav';
    const mr = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const duration = (Date.now() - startTimeRef.current) / 1000;
      // create() calls notify() which triggers onChanged, so no need to setNotes here
      await OfflineVoiceNotes.create(areaId, blob, duration);
    };

    mr.start();
    startTimeRef.current = Date.now();
    setElapsed(0);
    setRecording(true);
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
    setElapsed(0);
  }

  async function deleteNote(id) {
    await OfflineVoiceNotes.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  function retrySync(id) {
    OfflineVoiceNotes.retry(id);
  }

  async function handleAnalyzeAll() {
    const syncedNotes = notes.filter(n => !n._pending && n.audio_url);
    if (syncedNotes.length === 0) return;
    setAnalyzing(true);
    try {
      const res = await base44.functions.invoke('analyzeVoiceNote', {
        dataUrls: syncedNotes.map(n => n.audio_url)
      });
      if (res.data?.analysis) {
        setSavedAnalysis(res.data.analysis);
        const { Areas: OfflineAreasModule } = await import("@/lib/offlineStore");
        await OfflineAreasModule.update(areaId, { voice_notes_analysis: JSON.stringify(res.data.analysis) });
      } else if (res.data?.error) {
        const errorData = { error: res.data.error };
        setSavedAnalysis(errorData);
        const { Areas: OfflineAreasModule } = await import("@/lib/offlineStore");
        await OfflineAreasModule.update(areaId, { voice_notes_analysis: JSON.stringify(errorData) });
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setSavedAnalysis({ error: err.message || 'Failed to analyze notes' });
    } finally {
      setAnalyzing(false);
    }
  }

  const pendingCount = notes.filter(n => n._pending).length;
  const syncedNotes = notes.filter(n => !n._pending);

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Voice Notes</h3>
          {notes.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
              {pendingCount > 0 && <span className="ml-1 text-amber-600">· {pendingCount} pending sync</span>}
            </p>
          )}
        </div>
        {!permitted ? (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <MicOff className="h-4 w-4" /> Mic access denied
          </div>
        ) : recording ? (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-destructive text-destructive-foreground text-sm font-medium animate-pulse"
          >
            <Square className="h-4 w-4" fill="currentColor" />
            {formatDuration(elapsed)}
          </button>
        ) : (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Mic className="h-4 w-4" /> Record
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading notes...</p>
      ) : notes.length === 0 && !recording ? (
        <p className="text-sm text-muted-foreground text-center py-4">No voice notes yet. Tap Record to add one.</p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {notes.map(note => (
              <NotePlayer
                key={note.id}
                note={note}
                onDelete={() => deleteNote(note.id)}
                onRetry={retrySync}
              />
            ))}
          </div>

          {syncedNotes.length > 0 && (
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzing}
              className="w-full text-sm bg-primary text-primary-foreground px-3 py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
            >
              {analyzing ? 'Analyzing all notes...' : `Analyze All (${syncedNotes.length})`}
            </button>
          )}
          {pendingCount > 0 && syncedNotes.length === 0 && (
            <p className="text-xs text-center text-muted-foreground">Notes will be analyzed once they sync.</p>
          )}

          {savedAnalysis && (
            <div className={`rounded-lg border px-3 py-2.5 space-y-3 ${savedAnalysis.error ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
              {savedAnalysis.error ? (
                <p className="text-sm text-destructive">{savedAnalysis.error}</p>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-primary mb-1">Summary</p>
                      <p className="text-sm text-foreground">{savedAnalysis.summary}</p>
                    </div>
                    <button
                      onClick={() => setSavedAnalysis(null)}
                      className="flex-shrink-0 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  {savedAnalysis.key_items?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-primary mb-1">Key Items</p>
                      <ul className="text-sm text-foreground space-y-1">
                        {savedAnalysis.key_items.map((item, i) => (
                          <li key={i} className="flex gap-2"><span className="text-primary">•</span> {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {savedAnalysis.recommended_operations?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-primary mb-2">Recommended Operations</p>
                      <div className="space-y-2">
                        {savedAnalysis.recommended_operations.map((op, i) => (
                          <div key={i} className="bg-white rounded border border-primary/20 p-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{op.operation_type}</p>
                                {op.description && <p className="text-xs text-muted-foreground mt-0.5">{op.description}</p>}
                                {op.estimated_quantity && <p className="text-xs text-muted-foreground">Size: {op.estimated_quantity}</p>}
                                {op.materials?.length > 0 && (
                                  <p className="text-xs text-muted-foreground">Materials: {op.materials.join(', ')}</p>
                                )}
                              </div>
                              <button
                                onClick={() => onCreateOperation?.(op)}
                                className="flex-shrink-0 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {savedAnalysis.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {savedAnalysis.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}