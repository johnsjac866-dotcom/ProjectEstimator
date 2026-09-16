**ProjectEstimator**

A landscaping/patio/drainage job-estimation tool. Originally built on base44; now a plain Vite/React app backed by Supabase (Postgres + Auth + Storage + Edge Functions) and OpenAI (transcription + LLM extraction for voice notes).

**Local setup**

1. `npm install`
2. Create a [Supabase](https://supabase.com) project.
3. Run the SQL in [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql) against it (SQL editor, or `supabase db push` if you're using the Supabase CLI).
4. Copy `.env.example` to `.env.local` and fill in your project's `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (Project Settings → API).
5. Deploy the Edge Function: `supabase functions deploy analyze-voice-note`, then set its secret: `supabase secrets set OPENAI_API_KEY=sk-...`.
6. Create your own user: add them in Supabase Auth (dashboard → Authentication → Users → Invite), then insert a matching row into `public.profiles` (SQL editor: `insert into profiles (id, role) values ('<their auth uuid>', 'admin');`) — there's no self-service signup, matching the app's original invite-only behavior.
7. `npm run dev`

**Migrating existing base44 data**

See [scripts/migrate-data.mjs](scripts/migrate-data.mjs) for a one-off script that imports a base44 entity export (Project/Area/VoiceNote JSON) into the new Supabase tables, including re-uploading voice-note audio into Supabase Storage.

**Scripts**

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` / `npm run lint:fix`
- `npm run typecheck`
