-- Enable Supabase Realtime for chat. Access control is unchanged — Realtime's
-- postgres_changes feed respects each table's existing SELECT RLS policy
-- (participants-only, see 20260725000002_rls_policies.sql) as long as the
-- client subscribes using an authenticated session, which the web app's
-- Supabase browser client already carries. No new policies needed.

alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.cod_meetups;

-- UPDATE events on cod_meetups need the full old row (to compare old/new
-- status) — default replica identity only includes the primary key.
alter table public.cod_meetups replica identity full;
