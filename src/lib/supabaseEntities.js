/**
 * supabaseEntities.js
 *
 * Thin adapter that gives a Supabase table the exact same interface the
 * base44 SDK's entity objects used to expose:
 *   list(sort, limit) / filter(query, sort, limit) / get(id) /
 *   create(data) / update(id, data) / delete(id)
 *
 * This lets offlineStore.js (and any other consumer written against the
 * base44 shape) swap `sdk` without any other code changes.
 */
import { supabase } from '@/lib/supabaseClient';

// base44's sort convention: "-created_date" = descending, "created_date" = ascending.
function applySort(query, sort) {
  if (!sort) return query;
  const desc = sort.startsWith('-');
  const column = desc ? sort.slice(1) : sort;
  return query.order(column, { ascending: !desc });
}

export function supabaseEntity(tableName) {
  return {
    async list(sort, limit) {
      let query = supabase.from(tableName).select('*');
      query = applySort(query, sort);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async filter(match = {}, sort, limit) {
      let query = supabase.from(tableName).select('*').match(match);
      query = applySort(query, sort);
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },

    async get(id) {
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error(`${tableName} record not found: ${id}`);
      return data;
    },

    async create(data) {
      const { data: created, error } = await supabase.from(tableName).insert(data).select().single();
      if (error) throw error;
      return created;
    },

    async update(id, data) {
      const { data: updated, error } = await supabase.from(tableName).update(data).eq('id', id).select().single();
      if (error) throw error;
      return updated;
    },

    async delete(id) {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
      return true;
    },
  };
}
