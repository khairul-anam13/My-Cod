-- Fase 3: advisory GPS-trust signal. Browser JS cannot detect OS-level mock
-- location the way a native Android app can (no isFromMockProvider()
-- equivalent) — this table stores heuristic cross-checks (IP-geo distance,
-- implied travel speed) computed server-side in apps/api/src/lib/locationTrust.ts.
-- `flagged` is advisory only; nothing reads it to block a user automatically.

create table public.location_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  accuracy double precision,
  source text not null default 'unknown',
  ip text,
  distance_from_ip_km numeric,
  implied_speed_kmh numeric,
  flagged boolean not null default false,
  created_at timestamptz not null default now()
);

create index location_events_user_created_idx on public.location_events (user_id, created_at desc);
create index location_events_flagged_idx on public.location_events (flagged) where flagged;

alter table public.location_events enable row level security;

-- Users can log their own location events (the API inserts using the
-- caller's own session, same pattern as every other table in this app).
create policy "users can log their own location events"
on public.location_events for insert
to authenticated
with check (user_id = (select auth.uid()));

-- No select policy for anon/authenticated on purpose — this is a trust
-- signal for review, not something a user should see about themselves or
-- others. It's read via the service-role client from an admin-gated API
-- route (see Fase 4's requireAdmin), which bypasses RLS.
