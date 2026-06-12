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
const TIMEOUT_MS = 15000;
const BACKGROUND_TIMEOUT_MS = 20000;

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
    const cached = readCache();
    // Hide deleted records from all views immediately
    const filtered = cached.filter(r =>
      !r._deleted &&
      Object.entries(query || {}).every(([k, v]) => r[k] === v)
    );

    // Background: merge server records — never reinsert locally-deleted ones
    withTimeout(base44.entities.VoiceNote.filter(query), BACKGROUND_TIMEOUT_MS)
      .then(records => {
        const all = readCache();
        const localById = new Map(all.map(r => [r.id, r]));
        const merged = [...all];
        for (const serverRec of records) {
          const local = localById.get(serverRec.id);
          if (!local) {
            merged.push(serverRec); // net-new from server
          } else if (local._deleted || local._pending) {
            // local state is source of truth — skip server version
          } else {
            const idx = merged.findIndex(r => r.id === serverRec.id);
            if (idx >= 0) merged[idx] = serverRec;
          }
        }
        writeCache(merged);
        notify();
      })
      .catch(() => {});

    return filtered;
  },

  // Synchronous read from cache (for event-driven refreshes)
  getCached(query) {
    return readCache().filter(r =>
      !r._deleted &&
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

    // Do NOT auto-sync — user must press the sync button
    return record;
  },

  async delete(id) {
    const all = readCache();
    const record = all.find(r => r.id === id);

    if (record?._pending || id.startsWith('PENDING_') || id.startsWith('_local_')) {
      // Never synced — purge permanently and clean up blob
      writeCache(all.filter(r => r.id !== id));
      await deleteBlob(id).catch(() => {});
    } else {
      // Synced — mark as deleted, queue server delete
      writeCache(all.map(r =>
        r.id === id
          ? { ...r, _deleted: true, _syncPending: true, _syncAction: "delete" }
          : r
      ));
      withTimeout(base44.entities.VoiceNote.delete(id), BACKGROUND_TIMEOUT_MS).catch(() => {});
    }
    notify();
  },

  retry(id) {
    const record = readCache().find(r => r.id === id);
    if (record) _syncRecord(record);
  },
};

// Manual sync — called by the sync button in VoiceNotes UI
export function syncAllPendingVoiceNotes() {
  readCache()
    .filter(r => r._pending && !r._deleted && r._syncStatus !== 'uploading')
    .forEach(r => _syncRecord(r));
}

// Called by offlineStore.js after an Area syncs, to unblock waiting voice notes
export function syncPendingVoiceNotes() {
  syncAllPendingVoiceNotes();
}