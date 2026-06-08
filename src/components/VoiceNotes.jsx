import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = (areaId) => `voice_notes_${areaId}`;

function loadNotes(areaId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(areaId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotes(areaId, notes) {
  try {
    localStorage.setItem(STORAGE_KEY(areaId), JSON.stringify(notes));
  } catch {}
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function NotePlayer({ note, onDelete }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

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
    if (!el) return;
    if (playing) { el.pause(); setPlaying(false); }
    else { el.play(); setPlaying(true); }
  }

  const progress = note.duration > 0 ? (currentTime / note.duration) * 100 : 0;

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch('/.netlify/functions/analyzeVoiceNote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: note.dataUrl })
      });
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 bg-background rounded-lg border px-3 py-2.5">
      <audio ref={audioRef} src={note.dataUrl} preload="metadata" />
      <button
        onClick={togglePlay}
        className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        {playing ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{formatTime(note.created_at)}</span>
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

      {analysis && (
        <div className="bg-primary/5 rounded-lg border border-primary/20 px-3 py-2.5 space-y-2">
          <div>
            <p className="text-xs font-semibold text-primary mb-1">Summary</p>
            <p className="text-sm text-foreground">{analysis.summary}</p>
          </div>
          {analysis.key_items?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-primary mb-1">Key Items</p>
              <ul className="text-sm text-foreground space-y-1">
                {analysis.key_items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {analysis.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {analysis.tags.map((tag, i) => (
                <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {!analysis && (
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="w-full text-sm text-primary hover:text-primary/80 disabled:opacity-50 py-2 transition-colors"
        >
          {analyzing ? 'Analyzing...' : 'Analyze with AI'}
        </button>
      )}
    </div>
  );
}

export default function VoiceNotes({ areaId }) {
  const [notes, setNotes] = useState(() => loadNotes(areaId));
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [permitted, setPermitted] = useState(true);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

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
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const reader = new FileReader();
      reader.onloadend = () => {
        const note = { id: Date.now().toString(), dataUrl: reader.result, duration, created_at: new Date().toISOString() };
        setNotes(prev => {
          const updated = [note, ...prev];
          saveNotes(areaId, updated);
          return updated;
        });
      };
      reader.readAsDataURL(blob);
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

  function deleteNote(id) {
    setNotes(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveNotes(areaId, updated);
      return updated;
    });
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Voice Notes</h3>
          {notes.length > 0 && <p className="text-sm text-muted-foreground">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>}
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

      {notes.length === 0 && !recording ? (
        <p className="text-sm text-muted-foreground text-center py-4">No voice notes yet. Tap Record to add one.</p>
      ) : (
        <div className="space-y-2">
          {notes.map(note => (
            <NotePlayer key={note.id} note={note} onDelete={() => deleteNote(note.id)} />
          ))}
        </div>
      )}
    </div>
  );
}