#!/usr/bin/env node
/**
 * One-off data migration: base44 entity export -> Supabase tables.
 *
 * WHAT THIS DOES NOT DO: create Supabase Auth users. Before running this,
 * create one Supabase Auth user per base44 user yourself (dashboard invite,
 * or `supabase.auth.admin.createUser`), then fill in `user-id-map.json` so
 * this script knows which new auth UUID each old base44 user maps to.
 *
 * Usage:
 *   1. Export Project.json / Area.json / VoiceNote.json / User.json from
 *      base44 (entity export) into ./base44-export/ (or pass --data-dir).
 *   2. Create ./scripts/user-id-map.json:
 *        { "<base44 user id or email>": "<supabase auth user uuid>", ... }
 *   3. Set env vars SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (service role
 *      key, NOT the anon key — this script needs to bypass RLS to backfill
 *      created_by_id/created_date for records it didn't create as that user).
 *   4. node scripts/migrate-data.mjs
 *
 * Safe to review/adjust before running — this only writes to Supabase, it
 * never touches base44, and does not delete anything anywhere.
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const DATA_DIR = process.argv.includes('--data-dir')
  ? process.argv[process.argv.indexOf('--data-dir') + 1]
  : './base44-export';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function loadJson(filename, { optional = false } = {}) {
  try {
    const raw = await readFile(path.join(DATA_DIR, filename), 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    if (optional && err.code === 'ENOENT') return [];
    throw new Error(`Failed to read ${filename} from ${DATA_DIR}: ${err.message}`);
  }
}

function resolveUserId(userIdMap, record) {
  const key = record.created_by_id ?? record.created_by;
  const mapped = userIdMap[key];
  if (!mapped) {
    throw new Error(
      `No mapping for base44 user "${key}" in user-id-map.json (record id=${record.id}). ` +
      `Add it and re-run.`
    );
  }
  return mapped;
}

async function migrateProjects(userIdMap) {
  const projects = await loadJson('Project.json');
  const idMap = new Map(); // base44 id -> new supabase uuid

  for (const p of projects) {
    const row = {
      name: p.name,
      client_name: p.client_name ?? null,
      address: p.address ?? null,
      status: p.status ?? 'Active',
      notes: p.notes ?? null,
      created_by_id: resolveUserId(userIdMap, p),
      created_date: p.created_date ?? new Date().toISOString(),
      updated_date: p.updated_date ?? new Date().toISOString(),
    };
    const { data, error } = await supabase.from('projects').insert(row).select('id').single();
    if (error) throw new Error(`Project ${p.id} failed: ${error.message}`);
    idMap.set(p.id, data.id);
    console.log(`project ${p.id} -> ${data.id}`);
  }
  return idMap;
}

async function migrateAreas(userIdMap, projectIdMap) {
  const areas = await loadJson('Area.json');
  const idMap = new Map();
  const AREA_DATA_FIELDS = [
    'patio_data', 'site_mgmt_data', 'bed_prep_data', 'rough_grading_data',
    'demolition_data', 'bed_edging_data', 'planting_data', 'mulch_data',
    'drainage_data', 'lawn_data', 'boulders_data', 'hardscape_repair_data',
    'maintenance_data', 'stepping_stone_data', 'retaining_wall_data',
    'voice_notes_analysis',
  ];

  for (const a of areas) {
    const newProjectId = projectIdMap.get(a.project_id);
    if (!newProjectId) {
      console.warn(`Skipping area ${a.id}: parent project ${a.project_id} was not migrated.`);
      continue;
    }
    const row = {
      project_id: newProjectId,
      name: a.name,
      operation_type: a.operation_type ?? null,
      status: a.status ?? 'Not Started',
      created_by_id: resolveUserId(userIdMap, a),
      created_date: a.created_date ?? new Date().toISOString(),
      updated_date: a.updated_date ?? new Date().toISOString(),
    };
    for (const field of AREA_DATA_FIELDS) {
      if (a[field] !== undefined) row[field] = a[field];
    }
    const { data, error } = await supabase.from('areas').insert(row).select('id').single();
    if (error) throw new Error(`Area ${a.id} failed: ${error.message}`);
    idMap.set(a.id, data.id);
    console.log(`area ${a.id} -> ${data.id}`);
  }
  return idMap;
}

/** Downloads the old base44-hosted audio file and re-uploads it into the new private bucket. */
async function migrateVoiceNoteAudio(oldAudioUrl, newAreaId) {
  const res = await fetch(oldAudioUrl);
  if (!res.ok) throw new Error(`Could not fetch original audio (${res.status})`);
  const contentType = res.headers.get('content-type') || 'audio/webm';
  const ext = contentType.split('/')[1]?.split(';')[0] || 'webm';
  const bytes = new Uint8Array(await res.arrayBuffer());
  const storagePath = `${newAreaId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('voice-notes').upload(storagePath, bytes, { contentType });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  return storagePath;
}

async function migrateVoiceNotes(userIdMap, areaIdMap) {
  const notes = await loadJson('VoiceNote.json', { optional: true });

  for (const vn of notes) {
    const newAreaId = areaIdMap.get(vn.area_id);
    if (!newAreaId) {
      console.warn(`Skipping voice note ${vn.id}: parent area ${vn.area_id} was not migrated.`);
      continue;
    }
    let storagePath;
    try {
      storagePath = await migrateVoiceNoteAudio(vn.audio_url, newAreaId);
    } catch (err) {
      console.warn(`Skipping voice note ${vn.id}: audio migration failed (${err.message}).`);
      continue;
    }
    const row = {
      area_id: newAreaId,
      audio_url: storagePath,
      duration: vn.duration ?? null,
      created_by_id: resolveUserId(userIdMap, vn),
      created_date: vn.created_date ?? new Date().toISOString(),
      updated_date: vn.updated_date ?? new Date().toISOString(),
    };
    const { data, error } = await supabase.from('voice_notes').insert(row).select('id').single();
    if (error) throw new Error(`VoiceNote ${vn.id} failed: ${error.message}`);
    console.log(`voice note ${vn.id} -> ${data.id}`);
  }
}

async function main() {
  const userIdMap = JSON.parse(await readFile(path.join('scripts', 'user-id-map.json'), 'utf-8'));

  console.log('Migrating projects...');
  const projectIdMap = await migrateProjects(userIdMap);

  console.log('Migrating areas...');
  const areaIdMap = await migrateAreas(userIdMap, projectIdMap);

  console.log('Migrating voice notes (re-uploading audio)...');
  await migrateVoiceNotes(userIdMap, areaIdMap);

  console.log('\nDone. Compare row counts against the base44 export before deleting anything from base44:');
  console.log(`  projects: ${projectIdMap.size} migrated`);
  console.log(`  areas: ${areaIdMap.size} migrated`);
}

main().catch(err => {
  console.error('\nMigration failed:', err.message);
  process.exit(1);
});
