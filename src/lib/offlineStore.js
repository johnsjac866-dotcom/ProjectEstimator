/**
 * offlineStore.js
 * Smart offline-first store:
 * - If cache exists: return cache immediately, refresh in background
 * - If no cache: wait for network (first load on fresh browser)
 * - If network fails and no cache: return []
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
  } catch {}
}

function withTimeout(promise, ms = NETWORK_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
}

function createStore(entityName, sdk) {
  return {
    async list(sort, limit) {
      const cached = readCache(entityName);
      if (cached !== null) {
        // Return cache immediately, refresh in background
        withTimeout(sdk.list(sort, limit))
          .then(records => writeCache(entityName, records))
          .catch(() => {});
        return cached;
      }
      // No cache — must wait for network
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
        // Return from cache immediately, refresh in background
        withTimeout(sdk.filter(query, sort, limit))
          .then(records => {
            const all = readCache(entityName) || [];
            const ids = new Set(records.map(r => r.id));
            writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
          })
          .catch(() => {});
        return filterLocal(allCached);
      }
      // No cache — must wait for network
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
      const allCached = readCache(entityName);
      const local = (allCached || []).filter(r => r.project_id === projectId);

      // If the project itself is still pending, just return local cache
      const allProjects = readCache("Project") || [];
      const parentProject = allProjects.find(r => r.id === projectId);
      if (parentProject?._pending) {
        return local;
      }

      if (allCached !== null && local.length > 0) {
        // Cache has areas for this project — return immediately, refresh in background
        withTimeout(sdk.filter({ project_id: projectId }))
          .then(records => {
            const all = readCache(entityName) || [];
            const ids = new Set(records.map(r => r.id));
            writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
          })
          .catch(() => {});
        return local;
      }

      // No cached areas for this project — wait for network
      try {
        const records = await withTimeout(sdk.filter({ project_id: projectId }));
        const all = readCache(entityName) || [];
        const ids = new Set(records.map(r => r.id));
        writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
        return records;
      } catch {
        return local; // fall back to whatever we have
      }
    },

    async get(id) {
      const allCached = readCache(entityName);
      const local = allCached ? allCached.find(r => r.id === id) || null : null;

      // If it's a temp/pending record, return it immediately — no network call
      if (local?._pending) {
        return local;
      }

      if (local !== null) {
        // Return from cache immediately, refresh in background
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
      // Write temp record to cache instantly for offline support
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

      // Sync to server, replace temp with real record and notify listeners
      withTimeout(sdk.create(data))
        .then(record => {
          const all = readCache(entityName) || [];
          writeCache(entityName, all.map(r => r.id === tempId ? record : r));
          // Dispatch event so pages can redirect from temp ID to real ID
          window.dispatchEvent(new CustomEvent("offlinestore:resolved", {
            detail: { tempId, realId: record.id, entityName }
          }));
        })
        .catch(() => {});

      return tempRecord;
    },

    async update(id, data) {
      // Optimistically update cache instantly
      const cached = readCache(entityName) || [];
      const idx = cached.findIndex(r => r.id === id);
      const updated = idx >= 0 ? { ...cached[idx], ...data } : { id, ...data };
      if (idx >= 0) cached[idx] = updated; else cached.push(updated);
      writeCache(entityName, cached);

      if (!id.startsWith("_local_")) {
        withTimeout(sdk.update(id, data))
          .then(record => {
            const all = readCache(entityName) || [];
            const i = all.findIndex(r => r.id === id);
            if (i >= 0) { all[i] = record; writeCache(entityName, all); }
          })
          .catch(() => {});
      }

      return updated;
    },

    async delete(id) {
      const cached = readCache(entityName) || [];
      writeCache(entityName, cached.filter(r => r.id !== id));
      if (!id.startsWith("_local_")) {
        withTimeout(sdk.delete(id)).catch(() => {});
      }
    },
  };
}

export const Projects = createStore("Project", base44.entities.Project);
export const Areas = createStore("Area", base44.entities.Area);