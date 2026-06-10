/**
 * offlineStore.js — Offline-first store with robust sync, deletion markers, and cascading deletes.
 *
 * Key guarantees:
 * - Cache-first: return local data immediately, refresh in background.
 * - Deleted records are marked _deleted:true and hidden from all views immediately.
 *   Background server lists never reinsert locally-deleted records.
 * - Pending (offline-created) records are marked _pending:true and synced in parent→child order.
 * - ID remapping is atomic: when a _local_ record gets a real server ID, all child caches are
 *   updated before any UI refresh.
 * - Duplicate prevention: server record replaces the local record on sync, not added alongside it.
 */

import { base44 } from "@/api/base44Client";

const NETWORK_TIMEOUT_MS = 15000;
const BACKGROUND_TIMEOUT_MS = 20000;

// ─── Utilities ───────────────────────────────────────────────────────────────

function generateId() {
  return "_local_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

function cacheKey(entityName) {
  return `offlineCache_${entityName}`;
}

function readCache(entityName) {
  try {
    const raw = localStorage.getItem(cacheKey(entityName));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(entityName, records) {
  try {
    localStorage.setItem(cacheKey(entityName), JSON.stringify(records));
  } catch {
    // Storage quota — trim large fields and retry
    try {
      const areas = readCache("Area");
      if (areas) {
        const trimmed = areas.map(({ voice_notes_analysis: _vna, ...rest }) => rest);
        localStorage.setItem(cacheKey("Area"), JSON.stringify(trimmed));
        localStorage.setItem(cacheKey(entityName), JSON.stringify(records));
      }
    } catch { /* silently fail */ }
  }
}

function withTimeout(promise, ms = NETWORK_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/** Filter out deleted records for all public-facing reads. */
function visible(records) {
  return (records || []).filter(r => !r._deleted);
}

// ─── ID Remapping ────────────────────────────────────────────────────────────

function storeIdRemap(tempId, realId) {
  try { localStorage.setItem(`_id_remap_${tempId}`, realId); } catch {}
}

export function resolveId(id) {
  if (!id) return id;
  try { return localStorage.getItem(`_id_remap_${id}`) || id; } catch { return id; }
}

/**
 * Atomically update all child caches that reference a renamed ID.
 * Called right after a parent record syncs and gets its real server ID.
 */
function propagateIdRemap(tempId, realId) {
  storeIdRemap(tempId, realId);

  // Update Area.project_id references
  const areaCache = readCache("Area");
  if (areaCache) {
    writeCache("Area", areaCache.map(a =>
      a.project_id === tempId ? { ...a, project_id: realId } : a
    ));
  }

  // Update VoiceNote.area_id references (handled in offlineVoiceNotes, but mirror here too)
  try {
    const vnRaw = localStorage.getItem('offlineCache_VoiceNote');
    if (vnRaw) {
      const vns = JSON.parse(vnRaw);
      localStorage.setItem('offlineCache_VoiceNote', JSON.stringify(
        vns.map(vn => vn.area_id === tempId ? { ...vn, area_id: realId } : vn)
      ));
    }
  } catch {}
}

// ─── Deletion Helpers ─────────────────────────────────────────────────────────

/**
 * Mark a record as deleted in a given entity cache.
 * - If it was never synced (_pending, _local_ id), remove it permanently.
 * - Otherwise, mark with _deleted/_syncPending/_syncAction so it queues a server delete.
 */
function markDeleted(entityName, id) {
  const cached = readCache(entityName) || [];
  const record = cached.find(r => r.id === id);
  if (!record) return;

  if (record._pending || id.startsWith('_local_')) {
    // Never made it to server — purge immediately
    writeCache(entityName, cached.filter(r => r.id !== id));
  } else {
    writeCache(entityName, cached.map(r =>
      r.id === id
        ? { ...r, _deleted: true, _syncPending: true, _syncAction: "delete" }
        : r
    ));
    // Fire server delete in background
    withTimeout(base44.entities[entityName]?.delete(id), BACKGROUND_TIMEOUT_MS).catch(() => {});
  }
}

/**
 * Cascade-mark all areas (and their descendants) belonging to a project as deleted.
 */
function cascadeDeleteProject(projectId) {
  const areas = readCache("Area") || [];
  areas.forEach(a => {
    if (a.project_id === projectId || a.project_id === resolveId(projectId)) {
      cascadeDeleteArea(a.id, /* skipServerDelete */ false);
    }
  });
}

/**
 * Cascade-mark all voice notes belonging to an area as deleted.
 */
function cascadeDeleteArea(areaId, triggerServerDelete = true) {
  // Mark voice notes
  try {
    const vnRaw = localStorage.getItem('offlineCache_VoiceNote');
    if (vnRaw) {
      const vns = JSON.parse(vnRaw);
      const updated = vns.map(vn => {
        if (vn.area_id !== areaId) return vn;
        if (vn._pending || vn.id.startsWith('_local_') || vn.id.startsWith('PENDING_')) return null; // purge
        return { ...vn, _deleted: true, _syncPending: true, _syncAction: "delete" };
      }).filter(Boolean);
      localStorage.setItem('offlineCache_VoiceNote', JSON.stringify(updated));
      // Queue server deletes for synced voice notes
      if (triggerServerDelete) {
        vns.forEach(vn => {
          if (!vn._deleted && !vn._pending && !vn.id.startsWith('_local_') && !vn.id.startsWith('PENDING_') && vn.area_id === areaId) {
            withTimeout(base44.entities.VoiceNote?.delete(vn.id), BACKGROUND_TIMEOUT_MS).catch(() => {});
          }
        });
      }
    }
  } catch {}

  // Mark the area itself
  if (triggerServerDelete) {
    markDeleted("Area", areaId);
  } else {
    // Called from project cascade — just mark, server delete handled separately
    const areas = readCache("Area") || [];
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    if (area._pending || areaId.startsWith('_local_')) {
      writeCache("Area", areas.filter(a => a.id !== areaId));
    } else {
      writeCache("Area", areas.map(a =>
        a.id === areaId
          ? { ...a, _deleted: true, _syncPending: true, _syncAction: "delete" }
          : a
      ));
      withTimeout(base44.entities.Area?.delete(areaId), BACKGROUND_TIMEOUT_MS).catch(() => {});
    }
  }
}

// ─── Pending Record Sync ──────────────────────────────────────────────────────

/** Prevent concurrent syncs of the same record */
const _syncingIds = new Set();

function retrySyncRecord(entityName, record, sdk, onAfterSync) {
  if (_syncingIds.has(record.id)) return;
  // Use the most current version of the record from cache (it may have been updated since queued)
  const currentCache = readCache(entityName) || [];
  const currentRecord = currentCache.find(r => r.id === record.id) || record;
  const { id: tempId, _pending, _deleted, created_date, updated_date, ...rawData } = currentRecord;

  // Don't sync deleted records
  if (_deleted) return;

  // Resolve any _local_ parent IDs — skip if parent not yet synced
  const data = {};
  for (const [k, v] of Object.entries(rawData)) {
    if (typeof v === 'string' && v.startsWith('_local_')) {
      const resolved = resolveId(v);
      if (resolved.startsWith('_local_')) return; // parent not yet synced
      data[k] = resolved;
    } else {
      data[k] = v;
    }
  }

  _syncingIds.add(tempId);
  sdk.create(data)
    .then(realRecord => {
      _syncingIds.delete(tempId);
      const all = readCache(entityName) || [];
      // Replace local record with real server record (no duplicates)
      writeCache(entityName, all.map(r => r.id === tempId ? realRecord : r));
      // Atomically propagate the ID change to all child caches
      propagateIdRemap(tempId, realRecord.id);
      if (onAfterSync) onAfterSync(tempId, realRecord.id);
    })
    .catch(() => { _syncingIds.delete(tempId); });
}

// ─── Merge Strategy ───────────────────────────────────────────────────────────

/**
 * Merge server records into the local cache without overwriting local pending/deleted state.
 * - Server records that exist locally as _deleted are skipped (don't reinsert).
 * - Server records that exist locally as _pending are skipped (local is source of truth).
 * - Server records that exist locally as normal are updated.
 * - New server records (not in cache) are appended.
 */
function mergeServerRecords(entityName, serverRecords) {
  const current = readCache(entityName) || [];
  const localById = new Map(current.map(r => [r.id, r]));

  const merged = [...current];

  for (const serverRec of serverRecords) {
    const local = localById.get(serverRec.id);
    if (!local) {
      // Net-new record from server — add it
      merged.push(serverRec);
    } else if (local._deleted) {
      // Locally deleted — skip server version, let pending delete finish
      // do nothing
    } else if (local._pending) {
      // Locally pending create/edit — local is source of truth
      // do nothing
    } else {
      // Normal record — server wins (fresher data)
      const idx = merged.findIndex(r => r.id === serverRec.id);
      if (idx >= 0) merged[idx] = serverRec;
    }
  }

  writeCache(entityName, merged);
}

// ─── Store Factory ────────────────────────────────────────────────────────────

function createStore(entityName, sdk, { onAfterSync } = {}) {
  const store = {
    async list(sort, limit) {
      const cached = readCache(entityName);
      if (cached !== null) {
        withTimeout(sdk.list(sort, limit), BACKGROUND_TIMEOUT_MS)
          .then(records => {
            mergeServerRecords(entityName, records);
            // Retry any still-pending records
            const current = readCache(entityName) || [];
            current.filter(r => r._pending && !r._deleted)
              .forEach(p => retrySyncRecord(entityName, p, sdk, onAfterSync));
          })
          .catch(() => {});
        return visible(cached);
      }
      // No cache — wait for network
      try {
        const records = await withTimeout(sdk.list(sort, limit));
        writeCache(entityName, records);
        return visible(records);
      } catch {
        return [];
      }
    },

    async filter(query, sort, limit) {
      const allCached = readCache(entityName);
      const filterLocal = (arr) =>
        visible(arr || []).filter(r =>
          Object.entries(query || {}).every(([k, v]) => r[k] === v)
        );

      if (allCached !== null) {
        withTimeout(sdk.filter(query, sort, limit), BACKGROUND_TIMEOUT_MS)
          .then(records => mergeServerRecords(entityName, records))
          .catch(() => {});
        return filterLocal(allCached);
      }
      try {
        const records = await withTimeout(sdk.filter(query, sort, limit));
        const all = readCache(entityName) || [];
        const ids = new Set(records.map(r => r.id));
        writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
        return visible(records);
      } catch {
        return [];
      }
    },

    async getByProjectId(projectId) {
      const resolvedProjectId = resolveId(projectId);
      const allCached = readCache(entityName);

      // Match on original id, resolved id, OR any _local_ id that resolves to the same project
      const filterFn = (arr) =>
        visible(arr || []).filter(r => {
          if (r.project_id === projectId) return true;
          if (resolvedProjectId !== projectId && r.project_id === resolvedProjectId) return true;
          // Also catch areas whose project_id is a temp ID that remaps to resolvedProjectId
          if (r.project_id?.startsWith('_local_') && resolveId(r.project_id) === resolvedProjectId) return true;
          return false;
        });

      const local = filterFn(allCached);

      if (allCached !== null && local.length > 0) {
        // Always background-refresh from server
        withTimeout(sdk.filter({ project_id: resolvedProjectId }), BACKGROUND_TIMEOUT_MS)
          .then(records => mergeServerRecords(entityName, records))
          .catch(() => {});
        return local;
      }

      if (allCached !== null && local.length === 0) {
        try {
          const records = await withTimeout(sdk.filter({ project_id: resolvedProjectId }), 4000);
          mergeServerRecords(entityName, records);
          // Re-read cache after merge — pending local areas may now appear
          const afterMerge = filterFn(readCache(entityName));
          return afterMerge;
        } catch {
          // Network failed — return anything in cache that could belong to this project
          return filterFn(readCache(entityName)) || [];
        }
      }

      // No cache at all — wait for network
      try {
        const records = await withTimeout(sdk.filter({ project_id: resolvedProjectId }));
        const all = readCache(entityName) || [];
        const ids = new Set(records.map(r => r.id));
        writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
        return visible(records);
      } catch {
        return [];
      }
    },

    async get(id) {
      if (!id) return null;
      const resolvedId = resolveId(id);
      if (resolvedId !== id) return store.get(resolvedId);

      const allCached = readCache(entityName);
      const local = allCached ? allCached.find(r => r.id === id) || null : null;

      // If locally deleted, return null (treat as gone)
      if (local?._deleted) return null;

      if (local !== null) {
        if (!id.startsWith('_local_')) {
          withTimeout(sdk.get(id), BACKGROUND_TIMEOUT_MS)
            .then(record => {
              const all = readCache(entityName) || [];
              const existing = all.find(r => r.id === id);
              // Don't overwrite local pending/deleted
              if (existing?._deleted || existing?._pending) return;
              const idx = all.findIndex(r => r.id === id);
              if (idx >= 0) all[idx] = record; else all.push(record);
              writeCache(entityName, all);
            })
            .catch(() => {});
        }
        return local;
      }

      try {
        const record = await withTimeout(sdk.get(id));
        const all = readCache(entityName) || [];
        const idx = all.findIndex(r => r.id === id);
        if (idx >= 0) all[idx] = record; else all.push(record);
        writeCache(entityName, all);
        return record;
      } catch {
        return null;
      }
    },

    async create(data) {
      const tempId = generateId();
      const tempRecord = {
        ...data,
        id: tempId,
        _pending: true,
        created_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
      };
      const cached = readCache(entityName) || [];
      writeCache(entityName, [...cached, tempRecord]);

      withTimeout(sdk.create(data))
        .then(record => {
          const all = readCache(entityName) || [];
          // Replace local record with server record (no duplicates)
          writeCache(entityName, all.map(r => r.id === tempId ? record : r));
          propagateIdRemap(tempId, record.id);
          if (onAfterSync) onAfterSync(tempId, record.id);
        })
        .catch(() => {});

      return tempRecord;
    },

    async update(id, data) {
      const resolvedId = resolveId(id);
      const cached = readCache(entityName) || [];
      // Try to find by resolvedId first, then by original id
      let idx = cached.findIndex(r => r.id === resolvedId);
      if (idx === -1 && resolvedId !== id) idx = cached.findIndex(r => r.id === id);

      // Don't update a deleted record
      if (idx >= 0 && cached[idx]?._deleted) return cached[idx];

      // Use whichever ID the record is actually stored under
      const storedId = idx >= 0 ? cached[idx].id : resolvedId;

      const updated = idx >= 0
        ? { ...cached[idx], ...data }
        : { id: storedId, ...data };
      if (idx >= 0) cached[idx] = updated; else cached.push(updated);
      writeCache(entityName, cached);

      if (!storedId.startsWith("_local_")) {
        withTimeout(sdk.update(storedId, data), BACKGROUND_TIMEOUT_MS)
          .then(record => {
            const all = readCache(entityName) || [];
            const i = all.findIndex(r => r.id === storedId);
            // Don't overwrite if now locally deleted or pending
            if (all[i]?._deleted || all[i]?._pending) return;
            if (i >= 0) { all[i] = record; writeCache(entityName, all); }
          })
          .catch(() => {});
      } else {
        // Record is still pending (local ID) — the data is already merged into cache.
        // When this record eventually syncs, retrySyncRecord will pick up all merged data.
      }

      return updated;
    },

    async delete(id) {
      const resolvedId = resolveId(id);
      markDeleted(entityName, resolvedId);
    },
  };

  return store;
}

// ─── Named Stores ─────────────────────────────────────────────────────────────

export const Projects = createStore("Project", base44.entities.Project, {
  onAfterSync: (tempId, realId) => {
    // propagateIdRemap already updated Area.project_id references atomically
    scheduleDependentSync();
  },
});

export const Areas = createStore("Area", base44.entities.Area, {
  onAfterSync: () => {
    import("@/lib/offlineVoiceNotes").then(({ syncPendingVoiceNotes }) => {
      syncPendingVoiceNotes();
    }).catch(() => {});
  },
  // Expose cascade for external use
  cascadeDelete: cascadeDeleteArea,
});

// Attach cascade helpers to the named exports for use in UI components
Projects.cascadeDelete = (projectId) => {
  cascadeDeleteProject(projectId);
  markDeleted("Project", projectId);
};

Areas.cascadeDelete = (areaId) => {
  cascadeDeleteArea(areaId, true);
};

// ─── Ordered Sync ─────────────────────────────────────────────────────────────

/** Retry pending Area records only after their parent project_id is a real ID. */
function scheduleDependentSync() {
  setTimeout(() => {
    const areaCache = readCache("Area") || [];
    areaCache
      .filter(r => r._pending && !r._deleted && !r.project_id?.startsWith('_local_'))
      .forEach(p => retrySyncRecord("Area", p, base44.entities.Area, Areas._onAfterSync));
  }, 500);
}