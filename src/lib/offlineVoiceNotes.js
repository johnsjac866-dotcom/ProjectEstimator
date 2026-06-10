/**
 * offlineVoiceNotes.js
 * Offline-first store for VoiceNote records.
 * Audio blobs → IndexedDB. Metadata → localStorage.
 * Syncs after parent Area is confirmed on server.
 */

import { base44 } from "@/api/base44Client";
import { resolveId } from "@/lib/offlineStore";
import { storeBlob, getBlob, deleteBlob } from "@/lib/voiceNoteBlobs";

const CACHE_KEY = 'offlineCache_VoiceNote';
const TIMEOUT_MS = 8000;

// Prevent concurrent syncs of the same record
const _syncingIds = new Set();

function generateLocalId() {
  return `PENDING_voiceNote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

function readCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]'); } catch { return []; }
}

function writeCache(records) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(records)); } catch {}
}

function withTimeout(p) {
  return Promise.race([
    p,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), TIMEOUT_MS))
  ]);
}

// Notify VoiceNotes components to re-read from cache
function notify() {
  window.dispatchEvent(new CustomEvent('offlineVoiceNotesChanged'));
}

function _setStatus(localId, syncStatus) {
  const all = readCache();
  writeCache(all.map(r => r.id === localId ? { ...r, _syncStatus: syncStatus } : r));
  notify();
}

async function _syncRecord(record) {
  if (_syncingIds.has(record.id)) return;

  // Resolve area_id — wait if parent area is still local
  const resolvedAreaId = resolveId(record.area_id);
  if (resolvedAreaId.startsWith('_local_') || resolvedAreaId.startsWith('PENDING_')) return;

  _syncingIds.add(record.id);
  _setStatus(record.id, 'uploading');

  try {
    const blob = await getBlob(record.id);
    if (!blob) throw new Error('Audio blob not found in local storage');

    const ext = (record._mimeType || 'audio/webm').split('/')[1] || 'webm';
    const file = new File([blob], `voice-note.${ext}`, { type: record._mimeType || 'audio/webm' });

    const { file_url } = await base44.integrations.Core.UploadFile({ file });

    const serverRecord = await base44.entities.VoiceNote.create({
      area_id: resolvedAreaId,
      audio_url: file_url,
      duration: record.duration,
    });

    // Replace pending record with real server record
    const all = readCache();
    writeCache(all.map(r => r.id === record.id ? { ...serverRecord, _syncStatus: 'synced' } : r));
    try { localStorage.setItem(`_id_remap_${record.id}`, serverRecord.id); } catch {}
    await deleteBlob(record.id).catch(() => {});
    notify();
  } catch (err) {
    console.error('VoiceNote sync failed:', err);
    _setStatus(record.id, 'failed');
  } finally {
    _syncingIds.delete(record.id);
  }
}

export const VoiceNotes = {
  async filter(query) {
    // Return cached immediately
    const cached = readCache();
    const filtered = cached.filter(r =>
      Object.entries(query || {}).every(([k, v]) => r[k] === v)
    );

    // Background: refresh from server, then retry pending
    withTimeout(base44.entities.VoiceNote.filter(query))
      .then(records => {
        const all = readCache();
        const serverIds = new Set(records.map(r => r.id));
        const stillPending = all.filter(r => r._pending && !serverIds.has(r.id));
        writeCache([...records, ...stillPending]);
        stillPending.forEach(r => _syncRecord(r));
        notify();
      })
      .catch(() => {
        // Offline — attempt syncing pending records (will no-op if still offline)
        readCache().filter(r => r._pending).forEach(r => _syncRecord(r));
      });

    return filtered;
  },

  // Synchronous read from cache (for event-driven refreshes)
  getCached(query) {
    return readCache().filter(r =>
      Object.entries(query || {}).every(([k, v]) => r[k] === v)
    );
  },

  async create(areaId, blob, duration) {
    const localId = generateLocalId();
    const mimeType = blob.type || 'audio/webm';

    await storeBlob(localId, blob);

    const record = {
      id: localId,
      area_id: areaId,
      duration,
      _pending: true,
      _mimeType: mimeType,
      _syncStatus: 'pending',
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    writeCache([...readCache(), record]);
    notify();

    // Try syncing immediately (succeeds online, no-ops if parent is still local)
    _syncRecord(record);

    return record;
  },

  async delete(id) {
    const all = readCache();
    const record = all.find(r => r.id === id);
    writeCache(all.filter(r => r.id !== id));

    if (record?._pending) {
      await deleteBlob(id).catch(() => {});
    }
    if (!id.startsWith('PENDING_') && !id.startsWith('_local_')) {
      withTimeout(base44.entities.VoiceNote.delete(id)).catch(() => {});
    }
    notify();
  },

  retry(id) {
    const record = readCache().find(r => r.id === id);
    if (record) _syncRecord(record);
  },
};

// Called by offlineStore.js after an Area syncs, to unblock waiting voice notes
export function syncPendingVoiceNotes() {
  readCache()
    .filter(r => r._pending && r._syncStatus !== 'uploading')
    .forEach(r => _syncRecord(r));
}