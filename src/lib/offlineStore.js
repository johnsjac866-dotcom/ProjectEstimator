/**
 * offlineStore.js
 * Offline-first store with ID remapping for pending sync operations.
 * - Cache-first: return cache immediately, refresh in background
 * - No cache: wait for network (first install)
 * - Network fail + no cache: return []
 * - ID remapping: when temp IDs sync to real server IDs, old URLs/refs still work
 */

import { base44 } from "@/api/base44Client";

const NETWORK_TIMEOUT_MS = 8000;

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
    // Storage quota exceeded — free space by stripping large voice_notes_analysis fields
    try {
      const areas = readCache("Area");
      if (areas) {
        const trimmed = areas.map(({ voice_notes_analysis: _vna, ...rest }) => rest);
        localStorage.setItem(cacheKey("Area"), JSON.stringify(trimmed));
        localStorage.setItem(cacheKey(entityName), JSON.stringify(records));
      }
    } catch {
      // Silently fail if still can't write
    }
  }
}

function withTimeout(promise, ms = NETWORK_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

// ---- ID Remapping ----
// Stores temp→real ID mapping so old URLs/references resolve after sync.

function storeIdRemap(tempId, realId) {
  try {
    localStorage.setItem(`_id_remap_${tempId}`, realId);
  } catch {}
}

export function resolveId(id) {
  if (!id) return id;
  try {
    return localStorage.getItem(`_id_remap_${id}`) || id;
  } catch {
    return id;
  }
}

// ---- Store Factory ----

function createStore(entityName, sdk, { onAfterSync } = {}) {
  const store = {
    async list(sort, limit) {
      const cached = readCache(entityName);
      if (cached !== null) {
        withTimeout(sdk.list(sort, limit))
          .then(records => writeCache(entityName, records))
          .catch(() => {});
        return cached;
      }
      try {
        const records = await withTimeout(sdk.list(sort, limit));
        writeCache(entityName, records);
        return records;
      } catch {
        return [];
      }
    },

    async filter(query, sort, limit) {
      const allCached = readCache(entityName);
      const filterLocal = (arr) =>
        (arr || []).filter(r =>
          Object.entries(query || {}).every(([k, v]) => r[k] === v)
        );

      if (allCached !== null) {
        withTimeout(sdk.filter(query, sort, limit))
          .then(records => {
            const all = readCache(entityName) || [];
            const ids = new Set(records.map(r => r.id));
            writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
          })
          .catch(() => {});
        return filterLocal(allCached);
      }
      try {
        const records = await withTimeout(sdk.filter(query, sort, limit));
        const all = readCache(entityName) || [];
        const ids = new Set(records.map(r => r.id));
        writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
        return records;
      } catch {
        return [];
      }
    },

    async getByProjectId(projectId) {
      const resolvedProjectId = resolveId(projectId);
      const allCached = readCache(entityName);

      // Match areas with either the original temp project_id OR the resolved real project_id
      const filterFn = (arr) =>
        (arr || []).filter(
          (r) =>
            r.project_id === projectId ||
            (resolvedProjectId !== projectId && r.project_id === resolvedProjectId)
        );

      const local = filterFn(allCached);

      if (allCached !== null && local.length > 0) {
        // Cache hit — return immediately, refresh in background
        withTimeout(sdk.filter({ project_id: resolvedProjectId }))
          .then(records => {
            const all = readCache(entityName) || [];
            const ids = new Set(records.map(r => r.id));
            writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
          })
          .catch(() => {});
        return local;
      }

      if (allCached !== null && local.length === 0) {
        // Cache exists but no areas for this project yet (e.g. newly created)
        // Use shorter timeout to avoid long waits when offline
        try {
          const records = await withTimeout(sdk.filter({ project_id: resolvedProjectId }), 4000);
          const all = readCache(entityName) || [];
          const ids = new Set(records.map(r => r.id));
          writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
          return records;
        } catch {
          return []; // offline — return empty quickly
        }
      }

      // No cache at all — wait for network (first load)
      try {
        const records = await withTimeout(sdk.filter({ project_id: resolvedProjectId }));
        const all = readCache(entityName) || [];
        const ids = new Set(records.map(r => r.id));
        writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
        return records;
      } catch {
        return local;
      }
    },

    async get(id) {
      if (!id) return null;

      // Resolve remapped ID (temp → real after sync)
      const resolvedId = resolveId(id);
      if (resolvedId !== id) {
        return store.get(resolvedId);
      }

      const allCached = readCache(entityName);
      const local = allCached ? allCached.find(r => r.id === id) || null : null;

      if (local !== null) {
        // Return cache immediately, refresh in background
        withTimeout(sdk.get(id))
          .then(record => {
            const all = readCache(entityName) || [];
            const idx = all.findIndex(r => r.id === id);
            if (idx >= 0) all[idx] = record; else all.push(record);
            writeCache(entityName, all);
          })
          .catch(() => {});
        return local;
      }

      // Not in cache — wait for network
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

      // Sync to server in background, replace temp with real record
      withTimeout(sdk.create(data))
        .then(record => {
          const all = readCache(entityName) || [];
          writeCache(entityName, all.map(r => r.id === tempId ? record : r));
          // Store remap so old temp-ID references (URLs, related fields) still work
          storeIdRemap(tempId, record.id);
          // Hook for cross-entity side effects (e.g. update area.project_id refs)
          if (onAfterSync) onAfterSync(tempId, record.id);
        })
        .catch(() => {});

      return tempRecord;
    },

    async update(id, data) {
      // Resolve to real ID if it was previously remapped
      const resolvedId = resolveId(id);

      const cached = readCache(entityName) || [];
      const idx = cached.findIndex(r => r.id === resolvedId);
      const updated = idx >= 0 ? { ...cached[idx], ...data } : { id: resolvedId, ...data };
      if (idx >= 0) cached[idx] = updated; else cached.push(updated);
      writeCache(entityName, cached);

      if (!resolvedId.startsWith("_local_")) {
        withTimeout(sdk.update(resolvedId, data))
          .then(record => {
            const all = readCache(entityName) || [];
            const i = all.findIndex(r => r.id === resolvedId);
            if (i >= 0) { all[i] = record; writeCache(entityName, all); }
          })
          .catch(() => {});
      }

      return updated;
    },

    async delete(id) {
      const resolvedId = resolveId(id);
      const cached = readCache(entityName) || [];
      writeCache(entityName, cached.filter(r => r.id !== resolvedId));
      if (!resolvedId.startsWith("_local_")) {
        withTimeout(sdk.delete(resolvedId)).catch(() => {});
      }
    },
  };

  return store;
}

export const Projects = createStore("Project", base44.entities.Project, {
  onAfterSync: (tempId, realId) => {
    // When a project syncs, update all areas in cache that referenced the old temp project_id
    const areaCache = readCache("Area");
    if (areaCache) {
      const updated = areaCache.map(a =>
        a.project_id === tempId ? { ...a, project_id: realId } : a
      );
      writeCache("Area", updated);
    }
  },
});

export const Areas = createStore("Area", base44.entities.Area);