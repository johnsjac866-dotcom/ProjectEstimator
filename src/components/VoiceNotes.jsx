import { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
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

function NotePlayer({ note, onDelete }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

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

  return (
    <div className="flex items-center gap-3 bg-background rounded-lg border px-3 py-2.5">
      <audio ref={audioRef} src={note.audio_url} preload="auto" crossOrigin="anonymous" />
      <button
        onClick={togglePlay}
        className="h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors"
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
  );
}

export default function VoiceNotes({ areaId }) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [permitted, setPermitted] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => {
    async function loadNotes() {
      try {
        const allNotes = await base44.entities.VoiceNote.filter({ area_id: areaId });
        setNotes(allNotes.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)));
      } catch {
        setNotes([]);
      } finally {
        setLoading(false);
      }
    }
    loadNotes();
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
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
      const duration = (Date.now() - startTimeRef.current) / 1000;
      const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' });
      
      try {
        const uploadRes = await base44.asServiceRole.integrations.Core.UploadFile({ file });
        const note = await base44.entities.VoiceNote.create({
          area_id: areaId,
          audio_url: uploadRes.file_url,
          duration
        });
        setNotes(prev => [note, ...prev]);
      } catch (err) {
        console.error('Failed to save voice note:', err);
      }
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
    try {
      await base44.entities.VoiceNote.delete(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete voice note:', err);
    }
  }

  async function handleAnalyzeAll() {
    if (notes.length === 0) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await base44.functions.invoke('analyzeVoiceNote', {
        dataUrls: notes.map(n => n.audio_url)
      });
      if (res.data?.analysis) {
        setAnalysis(res.data.analysis);
      } else if (res.data?.error) {
        setAnalysis({ error: res.data.error });
      }
    } catch (err) {
      console.error('Analysis error:', err);
      setAnalysis({ error: err.message || 'Failed to analyze notes' });
    } finally {
      setAnalyzing(false);
    }
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

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Loading notes...</p>
      ) : notes.length === 0 && !recording ? (
        <p className="text-sm text-muted-foreground text-center py-4">No voice notes yet. Tap Record to add one.</p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            {notes.map(note => (
              <NotePlayer key={note.id} note={note} onDelete={() => deleteNote(note.id)} />
            ))}
          </div>

          {notes.length > 0 && (
            <button
              onClick={handleAnalyzeAll}
              disabled={analyzing}
              className="w-full text-sm bg-primary text-primary-foreground px-3 py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
            >
              {analyzing ? 'Analyzing all notes...' : `Analyze All (${notes.length})`}
            </button>
          )}

          {analysis && (
            <div className={`rounded-lg border px-3 py-2.5 space-y-2 ${analysis.error ? 'bg-destructive/5 border-destructive/20' : 'bg-primary/5 border-primary/20'}`}>
              {analysis.error ? (
                <p className="text-sm text-destructive">{analysis.error}</p>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}