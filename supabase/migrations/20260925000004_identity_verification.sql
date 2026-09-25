-- Fase 4: identity verification (WhatsApp-OTP phone check + KTP/selfie
-- upload, reviewed by an admin) and the minimal admin role needed to review
-- it. `profiles.is_verified` is untouched — it keeps meaning "completed
-- onboarding" (gates requireVerified as before). The new "identity verified"
-- badge is a separate concept, read from identity_verifications.status.

alter table public.profiles
  add column role text not null default 'user' check (role in ('user', 'admin'));

-- No self-serve promotion — the first admin is set manually:
--   update public.profiles set role = 'admin' where id = '<uuid>';

-- Public-safe derived flag for the "identitas terverifikasi" badge —
-- identity_verifications itself stays private (it holds KTP/selfie paths
-- and rejection reasons), so this is the only piece of it anyone but the
-- owner/admin gets to see. Kept in sync by the admin review route
-- (apps/api/src/routes/verification.routes.ts PATCH /:id), same pattern as
-- how reviews.routes.ts keeps profiles.rating_avg in sync via trigger — this
-- one's simple enough (a single boolean, only flips on an admin action) to
-- set directly from the route instead of adding another trigger.
alter table public.profiles
  add column identity_verified boolean not null default false;

-- ---------------------------------------------------------------------------
-- identity_verifications
-- ---------------------------------------------------------------------------
create type identity_verification_status as enum ('pending', 'verified', 'rejected');

create table public.identity_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  status identity_verification_status not null default 'pending',
  ktp_photo_path text,
  selfie_photo_path text,
  phone_verified_at timestamptz,
  rejection_reason text,
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  submitted_at timestamptz not null default now()
);

alter table public.identity_verifications enable row level security;

create policy "users can read their own verification"
on public.identity_verifications for select
to authenticated
using (user_id = (select auth.uid()));

create policy "admins can read all verifications"
on public.identity_verifications for select
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

create policy "users can submit their own verification"
on public.identity_verifications for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "users can resubmit their own pending verification"
on public.identity_verifications for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()) and status = 'pending');

create policy "admins can review verifications"
on public.identity_verifications for update
to authenticated
using (
  exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
);

-- ---------------------------------------------------------------------------
-- phone_otp_codes — short-lived WhatsApp OTP codes (sent via Baileys, see
-- apps/api/src/lib/whatsapp.ts). Only ever read/written by the API using the
-- caller's own session, hashed at rest, never selected back to the client.
-- ---------------------------------------------------------------------------
create table public.phone_otp_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  phone_number text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index phone_otp_codes_user_idx on public.phone_otp_codes (user_id, created_at desc);

alter table public.phone_otp_codes enable row level security;

create policy "users manage their own otp codes"
on public.phone_otp_codes for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- identity-documents bucket — private, unlike listing-photos/profile-photos.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('identity-documents', 'identity-documents', false, 5242880)
on conflict (id) do nothing;

create policy "users can upload their own identity documents"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'identity-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "owner or admin can read identity documents"
on storage.objects for select
to authenticated
using (
  bucket_id = 'identity-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'admin')
  )
);

-- ---------------------------------------------------------------------------
-- Point nearby_listings' "seller_is_verified" at the real signal. It used to
-- read profiles.is_verified (just "completed onboarding" — see the note on
-- PUT /profiles/me/profile), which made the "Terpercaya"/"COD Aman" badges
-- on listing cards just as misleading as the old profile badge was. Same
-- signature/columns as the original in 20260725000003_nearby_listings_rpc.sql,
-- only the seller_is_verified source column changes.
-- ---------------------------------------------------------------------------
create or replace function public.nearby_listings(
  p_lat double precision,
  p_lng double precision,
  p_radius_km double precision default 10,
  p_category_id uuid default null,
  p_min_price integer default null,
  p_max_price integer default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  seller_id uuid,
  title text,
  description text,
  price integer,
  category_id uuid,
  photos jsonb,
  lat double precision,
  lng double precision,
  status listing_status,
  created_at timestamptz,
  distance_m double precision,
  seller_name text,
  seller_rating_avg numeric,
  seller_is_verified boolean
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select
    l.id,
    l.seller_id,
    l.title,
    l.description,
    l.price,
    l.category_id,
    l.photos,
    l.lat,
    l.lng,
    l.status,
    l.created_at,
    st_distance(l.location, st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography) as distance_m,
    p.name as seller_name,
    p.rating_avg as seller_rating_avg,
    p.identity_verified as seller_is_verified
  from public.listings l
  join public.profiles p on p.id = l.seller_id
  where l.status = 'available'
    and st_dwithin(
      l.location,
      st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography,
      greatest(p_radius_km, 0) * 1000
    )
    and (p_category_id is null or l.category_id = p_category_id)
    and (p_min_price is null or l.price >= p_min_price)
    and (p_max_price is null or l.price <= p_max_price)
  order by distance_m asc
  limit least(greatest(p_limit, 1), 100)
  offset greatest(p_offset, 0);
$$;

grant execute on function public.nearby_listings to anon, authenticated;
