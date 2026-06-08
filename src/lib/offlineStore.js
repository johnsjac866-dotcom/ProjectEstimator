/**
 * offlineStore.js
 * Offline-first wrapper around the Base44 SDK entities.
 * - Always writes to localStorage cache immediately (optimistic).
 * - Tries to sync with the server in the background (fire-and-forget).
 * - Reads from cache when offline; reads from server + refreshes cache when online.
 */

import { base44 } from "@/api/base44Client";

const NETWORK_TIMEOUT_MS = 5000;

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
    // Storage full — ignore
  }
}

/** Wraps a promise with a timeout so we don't hang waiting for a dead network */
function withTimeout(promise, ms = NETWORK_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Network timeout")), ms)
    ),
  ]);
}

function isOnline() {
  return navigator.onLine;
}

function createStore(entityName, sdk) {
  return {
    async list(sort, limit) {
      if (!isOnline()) {
        return readCache(entityName) || [];
      }
      try {
        const records = await withTimeout(sdk.list(sort, limit));
        writeCache(entityName, records);
        return records;
      } catch {
        return readCache(entityName) || [];
      }
    },

    async filter(query, sort, limit) {
      const filterLocally = (cached) =>
        (cached || []).filter(r =>
          Object.entries(query || {}).every(([k, v]) => r[k] === v)
        );

      if (!isOnline()) {
        return filterLocally(readCache(entityName));
      }
      try {
        const records = await withTimeout(sdk.filter(query, sort, limit));
        // Merge into cache
        const cached = readCache(entityName) || [];
        const ids = new Set(records.map(r => r.id));
        const merged = [...cached.filter(r => !ids.has(r.id)), ...records];
        writeCache(entityName, merged);
        return records;
      } catch {
        return filterLocally(readCache(entityName));
      }
    },

    async get(id) {
      if (!isOnline()) {
        const cached = readCache(entityName) || [];
        return cached.find(r => r.id === id) || null;
      }
      try {
        const record = await withTimeout(sdk.get(id));
        const cached = readCache(entityName) || [];
        const idx = cached.findIndex(r => r.id === id);
        if (idx >= 0) cached[idx] = record; else cached.push(record);
        writeCache(entityName, cached);
        return record;
      } catch {
        const cached = readCache(entityName) || [];
        return cached.find(r => r.id === id) || null;
      }
    },

    /** Convenience: filter by project_id */
    async getByProjectId(projectId) {
      return this.filter({ project_id: projectId });
    },

    async create(data) {
      // Always write to cache immediately
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

      if (!isOnline()) {
        return tempRecord;
      }

      // Try to sync in the background, replace temp record with real one
      try {
        const record = await withTimeout(sdk.create(data));
        const latest = readCache(entityName) || [];
        // Replace the temp record with the real server record
        writeCache(entityName, latest.map(r => r.id === tempId ? record : r));
        return record;
      } catch {
        // Offline or failed — temp record stays in cache
        return tempRecord;
      }
    },

    async update(id, data) {
      // Optimistically update cache immediately
      const cached = readCache(entityName) || [];
      const idx = cached.findIndex(r => r.id === id);
      const updated = idx >= 0 ? { ...cached[idx], ...data } : { id, ...data };
      if (idx >= 0) cached[idx] = updated; else cached.push(updated);
      writeCache(entityName, cached);

      if (!isOnline() || id.startsWith("_local_")) {
        return updated;
      }

      try {
        const record = await withTimeout(sdk.update(id, data));
        const latest = readCache(entityName) || [];
        const i = latest.findIndex(r => r.id === id);
        if (i >= 0) { latest[i] = record; writeCache(entityName, latest); }
        return record;
      } catch {
        return updated;
      }
    },

    async delete(id) {
      // Optimistically remove from cache immediately
      const cached = readCache(entityName) || [];
      writeCache(entityName, cached.filter(r => r.id !== id));

      if (!isOnline() || id.startsWith("_local_")) return;

      try {
        await withTimeout(sdk.delete(id));
      } catch {
        // Fire-and-forget — cache is already updated
      }
    },
  };
}

export const Projects = createStore("Project", base44.entities.Project);
export const Areas = createStore("Area", base44.entities.Area);