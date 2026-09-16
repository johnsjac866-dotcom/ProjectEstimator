-- Initial schema for ProjectEstimator, replacing base44's managed entities.
-- Run via `supabase db push` (or paste into the Supabase SQL editor) after
-- creating the project.

-- ── Helper: check admin role without recursive RLS evaluation ────────────────
-- SECURITY DEFINER runs as the function owner (bypassing RLS on the inner
-- select), which avoids the "infinite recursion in policy" error that a plain
-- subquery on profiles from within a profiles policy would otherwise cause.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = uid and role = 'admin'
  );
$$;

-- Generic "bump updated_date on write" trigger, reused by every table below.
create or replace function public.set_updated_date()
returns trigger
language plpgsql
as $$
begin
  new.updated_date = now();
  return new;
end;
$$;

-- ── profiles ──────────────────────────────────────────────────────────────
-- One row per app user, keyed to auth.users. Provisioned by an admin (SQL
-- editor / dashboard) rather than self-service signup — mirrors base44's
-- invite-only model (see AuthContext.jsx's user_not_registered state).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

-- Only admins manage profile rows directly (via SQL editor / service role);
-- no client-facing insert/update/delete policy is defined here on purpose.

create trigger set_profiles_updated_date
  before update on public.profiles
  for each row execute function public.set_updated_date();

-- ── projects ──────────────────────────────────────────────────────────────
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text,
  address text,
  status text not null default 'Active' check (status in ('Active', 'Completed', 'Inactive', 'Archived')),
  notes text,
  created_by_id uuid not null references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects_insert" on public.projects
  for insert with check (auth.uid() = created_by_id);

create policy "projects_select_owner_or_admin" on public.projects
  for select using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create policy "projects_update_owner_or_admin" on public.projects
  for update using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create policy "projects_delete_owner_or_admin" on public.projects
  for delete using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create trigger set_projects_updated_date
  before update on public.projects
  for each row execute function public.set_updated_date();

-- ── areas ─────────────────────────────────────────────────────────────────
-- One `*_data` text column per wizard, each holding a JSON-stringified blob
-- (matching how the client already reads/writes these fields) plus
-- voice_notes_analysis, which the app writes even though it was never in
-- base44's declared Area schema.
create table public.areas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  operation_type text check (operation_type in (
    'Walkway/Patio', 'Site Management & Daily Cleanup', 'Bed Preparation',
    'Rough Grading & Hauling', 'Demolition & Removals', 'Bed Edging',
    'Planting', 'Mulch', 'Drainage', 'Lawn Repair & Install',
    'Boulders/Accents & Structures', 'Hardscape - Repair Existing',
    'Maintenance', 'Pathway / Steps', 'Retaining Wall'
  )),
  status text default 'Not Started' check (status in ('Not Started', 'In Progress', 'Complete')),
  patio_data text,
  site_mgmt_data text,
  bed_prep_data text,
  rough_grading_data text,
  demolition_data text,
  bed_edging_data text,
  planting_data text,
  mulch_data text,
  drainage_data text,
  lawn_data text,
  boulders_data text,
  hardscape_repair_data text,
  maintenance_data text,
  stepping_stone_data text,
  retaining_wall_data text,
  voice_notes_analysis text,
  created_by_id uuid not null references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index areas_project_id_idx on public.areas(project_id);

alter table public.areas enable row level security;

create policy "areas_insert" on public.areas
  for insert with check (auth.uid() = created_by_id);

create policy "areas_select_owner_or_admin" on public.areas
  for select using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create policy "areas_update_owner_or_admin" on public.areas
  for update using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create policy "areas_delete_owner_or_admin" on public.areas
  for delete using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create trigger set_areas_updated_date
  before update on public.areas
  for each row execute function public.set_updated_date();

-- ── voice_notes ───────────────────────────────────────────────────────────
create table public.voice_notes (
  id uuid primary key default gen_random_uuid(),
  area_id uuid not null references public.areas(id) on delete cascade,
  audio_url text not null, -- storage PATH in the private "voice-notes" bucket, not a public URL
  duration numeric,
  created_by_id uuid not null references auth.users(id) default auth.uid(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now()
);

create index voice_notes_area_id_idx on public.voice_notes(area_id);

alter table public.voice_notes enable row level security;

create policy "voice_notes_insert" on public.voice_notes
  for insert with check (auth.uid() = created_by_id);

create policy "voice_notes_select_owner_or_admin" on public.voice_notes
  for select using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create policy "voice_notes_update_owner_or_admin" on public.voice_notes
  for update using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create policy "voice_notes_delete_owner_or_admin" on public.voice_notes
  for delete using (auth.uid() = created_by_id or public.is_admin(auth.uid()));

create trigger set_voice_notes_updated_date
  before update on public.voice_notes
  for each row execute function public.set_updated_date();

-- ── storage: voice-notes bucket ───────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('voice-notes', 'voice-notes', false)
on conflict (id) do nothing;

-- Path convention is "<area_id>/<filename>" (see offlineVoiceNotes.js), so the
-- first path segment doubles as an authorization check via the areas table.
create policy "voice_notes_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'voice-notes'
    and exists (
      select 1 from public.areas a
      where a.id::text = (storage.foldername(name))[1]
        and (a.created_by_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "voice_notes_storage_select" on storage.objects
  for select using (
    bucket_id = 'voice-notes'
    and exists (
      select 1 from public.areas a
      where a.id::text = (storage.foldername(name))[1]
        and (a.created_by_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );

create policy "voice_notes_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'voice-notes'
    and exists (
      select 1 from public.areas a
      where a.id::text = (storage.foldername(name))[1]
        and (a.created_by_id = auth.uid() or public.is_admin(auth.uid()))
    )
  );
