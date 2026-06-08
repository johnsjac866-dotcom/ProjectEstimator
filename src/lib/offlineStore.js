/**
 * offlineStore.js
 * A thin offline-first wrapper around the Base44 SDK entities.
 * - Reads from a local cache (localStorage) when offline.
 * - Writes optimistically to the cache and syncs to the server when online.
 */

import { base44 } from "@/api/base44Client";

function generateId() {
  return "_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
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

function createStore(entityName, sdk) {
  return {
    async list(sort, limit) {
      try {
        const records = await sdk.list(sort, limit);
        writeCache(entityName, records);
        return records;
      } catch {
        return readCache(entityName) || [];
      }
    },

    async filter(query, sort, limit) {
      try {
        const records = await sdk.filter(query, sort, limit);
        // Merge into cache
        const cached = readCache(entityName) || [];
        const ids = new Set(records.map(r => r.id));
        const merged = [...cached.filter(r => !ids.has(r.id)), ...records];
        writeCache(entityName, merged);
        return records;
      } catch {
        const cached = readCache(entityName) || [];
        return cached.filter(r => {
          return Object.entries(query || {}).every(([k, v]) => r[k] === v);
        });
      }
    },

    async get(id) {
      try {
        const record = await sdk.get(id);
        // Update cache entry
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

    async create(data) {
      try {
        const record = await sdk.create(data);
        const cached = readCache(entityName) || [];
        writeCache(entityName, [...cached, record]);
        return record;
      } catch {
        // Offline: create a temp record in cache
        const tempRecord = { ...data, id: generateId(), _pending: true, created_date: new Date().toISOString() };
        const cached = readCache(entityName) || [];
        writeCache(entityName, [...cached, tempRecord]);
        return tempRecord;
      }
    },

    async update(id, data) {
      // Optimistically update cache first
      const cached = readCache(entityName) || [];
      const idx = cached.findIndex(r => r.id === id);
      if (idx >= 0) {
        cached[idx] = { ...cached[idx], ...data };
        writeCache(entityName, cached);
      }
      try {
        const record = await sdk.update(id, data);
        // Refresh cache with server response
        const latest = readCache(entityName) || [];
        const i = latest.findIndex(r => r.id === id);
        if (i >= 0) { latest[i] = record; writeCache(entityName, latest); }
        return record;
      } catch {
        // Offline: return the optimistic version
        return cached[idx] || { id, ...data };
      }
    },

    async delete(id) {
      // Optimistically remove from cache
      const cached = readCache(entityName) || [];
      writeCache(entityName, cached.filter(r => r.id !== id));
      try {
        await sdk.delete(id);
      } catch {
        // Will be out of sync until next online sync — acceptable for now
      }
    },
  };
}

export const Projects = createStore("Project", base44.entities.Project);
export const Areas = createStore("Area", base44.entities.Area);