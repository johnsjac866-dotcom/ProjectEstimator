# ProjectEstimator — Technical Overview

*Prepared as background material for resume/portfolio writing. Written from direct knowledge of the codebase.*

## What it is

ProjectEstimator is a production job-estimation application built for **Aspen Garden and Landscape**, a residential landscaping company. Field crews use it on-site (often with no reliable internet connection) to build detailed cost estimates across 15 categories of landscaping work — patios, drainage, rough grading, planting, retaining walls, mulch, bed preparation, demolition, and more — each with its own multi-step configuration wizard capturing dozens of job-specific variables (materials, labor hours, machine access, disposal logistics, etc.).

The standout feature is an **AI voice-note pipeline**: a crew member can record a short verbal site walkthrough, and the app transcribes it, automatically detects which of the 15 operation types were discussed, and extracts structured, ready-to-review estimate data for each one — turning a 2–3 minute recording into pre-filled form fields instead of manual data entry.

The app started on **base44**, a no-code/AI app-builder platform, and was later fully migrated off that platform to a self-hosted, developer-owned stack (Supabase + OpenAI) — removing vendor lock-in, eliminating recurring platform fees, and giving the company full ownership of its data and infrastructure.

**Scale:** ~130 source files, ~19,000 lines of application code, 38 routes, 32 wizard/summary page pairs across 15 operation types, an 830-line AI processing pipeline.

---

## Architecture

### 1. Frontend — Offline-First Progressive Web App
- **React 18 + Vite 6**, client-side routed with **React Router v6** (38 routes), all non-critical pages **code-split via `React.lazy`** with an aggressive prefetch strategy so every page chunk is cached by the service worker before the user ever goes offline.
- **Custom Service Worker** (hand-written, not Workbox) implementing a network-first cache strategy for HTML/navigation requests and cache-first for static assets, explicitly bypassing cross-origin API/backend calls so stale data is never served for live requests.
- **Offline-first data layer** (`offlineStore.js`) — the core engineering piece of the app:
  - Cache-first reads: every list/get call returns cached data instantly while refreshing from the server in the background.
  - **Optimistic writes with temporary IDs**: creating a record offline generates a local ID immediately, queues the write, and — once synced — **atomically remaps every dependent record's foreign key** (e.g., an Area created offline under a not-yet-synced Project) across all local caches, so nested offline creation "just works" without orphaned references.
  - **Tombstone-based deletion**: deletes are marked locally and hidden from the UI immediately, with the actual server delete queued and retried in the background; background sync merges never resurrect a locally-deleted record.
  - **Cascading deletes** (Project → Areas → Voice Notes) implemented as an in-memory cascade that mirrors what a database `ON DELETE CASCADE` would do, but works entirely offline.
  - Dedicated **IndexedDB** store for large binary data (recorded audio blobs) and **localStorage** for JSON record caches, kept in sync via a custom event-notification system so UI components re-render the moment the cache changes.
- **UI layer**: Tailwind CSS + Radix UI primitives (shadcn/ui component pattern — Dialog, Tabs, Select, Dropdown, Accordion, Tooltip, etc.), Framer Motion for page-transition animations, Lucide icon set (~60 icons in active use), Sonner for toast notifications.
- **PDF export** (jsPDF) for generating client-facing estimate documents from the structured wizard data.

### 2. AI Voice-Note Pipeline (Supabase Edge Function, Deno)
An 830-line serverless function implementing a **router/worker LLM architecture** rather than a single monolithic prompt:
1. **Transcription stage** — each recorded audio clip is downloaded server-side and sent to **OpenAI Whisper**.
2. **Router stage** — a single LLM call classifies which of the 15 operation types are actually discussed in the combined transcript, extracting shared context (site conditions, general notes) once rather than repeating that extraction per operation.
3. **Worker stage** — operation types are grouped into logical batches (e.g., grading + bed prep + mulch + edging share one prompt; drainage gets its own dedicated prompt given its size/complexity), and only the worker groups with at least one detected operation are actually invoked — each producing **JSON-schema-constrained structured output** matching that operation's exact form fields (dozens of typed fields per operation, e.g. machine type, excavation depth, disposal fees, drainage fitting counts).
4. **Merge stage** — results across workers are deduplicated (via a custom text-similarity/word-overlap algorithm) and combined into a single analysis object that pre-fills the relevant wizard(s), flagging any fields the AI couldn't confidently determine for the user to clarify.

This design keeps prompts scoped and accurate (each worker only needs to reason about a handful of related operation types instead of all 15 at once) while minimizing redundant LLM calls.

### 3. Backend — Self-Hosted Supabase
- **PostgreSQL** schema (4 tables: `profiles`, `projects`, `areas`, `voice_notes`) with **Row-Level Security policies** enforcing that every user can only read/write their own records, with an admin-role override — implemented via a `SECURITY DEFINER` helper function to avoid Postgres's recursive-RLS-policy pitfall.
- **Supabase Auth** for session/JWT-based authentication.
- **Supabase Storage** (private bucket) for voice-note audio, with storage-level RLS policies that authorize access based on the parent record's ownership; the client resolves short-lived **signed URLs** on demand rather than ever exposing a public/permanent file link.
- **Supabase Edge Functions** (Deno runtime) hosting the AI pipeline described above, using a service-role client for server-side storage access and a user-scoped client to verify the caller's JWT before doing any work.

### 4. Platform Migration (base44 → Supabase)
Migrated the entire application off a third-party no-code platform to self-hosted infrastructure, including:
- Reverse-engineering the platform's entity/auth/storage/integration touchpoints across the whole codebase.
- Designing an **adapter layer** (`supabaseEntity()`) that replicates the exact interface the offline-sync layer already depended on — meaning the ~30+ pages consuming that layer required **zero code changes**, even though the entire backend underneath changed.
- Rebuilding authentication (there was no self-hosted equivalent to the platform's hosted login page, so a new sign-in flow was designed and built from scratch).
- Designing the full Postgres schema and RLS policy set from the platform's declarative entity/permission definitions.
- Porting the AI serverless function to a new runtime and swapping its AI provider integration for direct OpenAI API calls.
- Writing a one-off data-migration script (Node.js) to move existing production records — including re-uploading audio files into the new storage backend — while preserving referential integrity across the parent/child record relationships.
- Full build/lint verification pipeline to confirm zero regressions post-migration.

---

## Tech Stack (confirmed in active use)

**Frontend:** React 18, Vite 6, React Router v6, TanStack Query, Tailwind CSS, Radix UI / shadcn/ui, Framer Motion, Lucide, jsPDF, Sonner

**Offline/PWA:** Custom Service Worker, IndexedDB, localStorage, custom optimistic-sync engine with ID remapping

**Backend:** Supabase (PostgreSQL, Row-Level Security, Auth, Storage, Edge Functions), Deno

**AI/ML:** OpenAI Whisper (speech-to-text), OpenAI GPT-4o-mini (structured JSON extraction via schema-constrained prompting), custom multi-stage router/worker LLM orchestration

**Tooling:** ESLint, TypeScript (jsconfig/checkJs), Git

---

## Notable Engineering Problems Solved

- **Offline-first sync with referential integrity**: making nested record creation (Project → Area → Voice Note) work correctly when created fully offline, including atomic ID remapping once each level syncs.
- **Backend-agnostic data layer via the adapter pattern**: enabled a full backend platform migration touching the database, auth, and file storage without rewriting the ~30 pages that consume that data.
- **Scoped multi-stage LLM extraction**: architecting an AI pipeline that reliably extracts dozens of structured, differently-shaped fields per operation type from unstructured speech, without either a single overloaded prompt (poor accuracy) or one LLM call per operation type (excessive latency/cost) — via the router/worker split.
- **Postgres RLS without recursive policy errors**: using a `SECURITY DEFINER` role-check function so admin-override policies don't trigger Postgres's infinite-recursion protection.
- **Secure private media access**: signed-URL-on-demand pattern for voice-note audio instead of public storage links.
