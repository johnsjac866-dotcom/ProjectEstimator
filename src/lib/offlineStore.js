/**
 * offlineStore.js
 * Offline-first wrapper around the Base44 SDK entities.
 * Strategy: ALWAYS read/write cache first. Network is best-effort in background.
 */

import { base44 } from "@/api/base44Client";

const NETWORK_TIMEOUT_MS = 4000;

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
    /** List all — returns cache immediately, refreshes cache from server in background */
    async list(sort, limit) {
      const cached = readCache(entityName) || [];
      // Refresh cache in background
      withTimeout(sdk.list(sort, limit))
        .then(records => writeCache(entityName, records))
        .catch(() => {});
      return cached;
    },

    /** Filter — returns from cache immediately, refreshes in background */
    async filter(query, sort, limit) {
      const cached = readCache(entityName) || [];
      const local = cached.filter(r =>
        Object.entries(query || {}).every(([k, v]) => r[k] === v)
      );
      // Background refresh
      withTimeout(sdk.filter(query, sort, limit))
        .then(records => {
          const all = readCache(entityName) || [];
          const ids = new Set(records.map(r => r.id));
          writeCache(entityName, [...all.filter(r => !ids.has(r.id)), ...records]);
        })
        .catch(() => {});
      return local;
    },

    async getByProjectId(projectId) {
      return this.filter({ project_id: projectId });
    },

    /** Get by id — returns from cache immediately */
    async get(id) {
      const cached = readCache(entityName) || [];
      const local = cached.find(r => r.id === id) || null;
      // Background refresh
      withTimeout(sdk.get(id))
        .then(record => {
          const all = readCache(entityName) || [];
          const idx = all.findIndex(r => r.id === id);
          if (idx >= 0) all[idx] = record; else all.push(record);
          writeCache(entityName, all);
        })
        .catch(() => {});
      return local;
    },

    /** Create — writes to cache instantly, syncs to server in background */
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

      // Background sync — replace temp record with real one when it succeeds
      withTimeout(sdk.create(data))
        .then(record => {
          const all = readCache(entityName) || [];
          writeCache(entityName, all.map(r => r.id === tempId ? record : r));
        })
        .catch(() => {});

      return tempRecord;
    },

    /** Update — writes to cache instantly, syncs in background */
    async update(id, data) {
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

    /** Delete — removes from cache instantly, syncs in background */
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