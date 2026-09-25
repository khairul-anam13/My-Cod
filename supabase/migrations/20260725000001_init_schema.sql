-- My COD — initial schema
-- Mirrors PRD section 6 (Database Schema), adapted for Supabase Auth + PostGIS.
--
-- Identity: auth.users holds the phone number + OTP verification (Supabase Auth
-- handles this natively). public.profiles is a 1:1 extension row created by the
-- app right after first login, once the user has picked a city/area.

create extension if not exists postgis with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- Make PostGIS types (geography, geometry, etc.) resolvable without schema prefix.
-- Required on Supabase Cloud where extensions live in the "extensions" schema.
set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone_number text not null unique,
  name text not null,
  profile_photo_url text,
  city text not null,
  -- lat/lng are always an approximate/area point, never a precise address
  -- (PRD 7.2 — trust & safety: never expose an exact home address).
  lat double precision not null,
  lng double precision not null,
  location geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  ) stored,
  is_verified boolean not null default false,
  rating_avg numeric(3, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index profiles_location_gix on public.profiles using gist (location);
create index profiles_city_idx on public.profiles (city);

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  icon text
);

-- ---------------------------------------------------------------------------
-- listings
-- ---------------------------------------------------------------------------
create type listing_status as enum ('available', 'reserved', 'sold');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  category_id uuid not null references public.categories (id),
  photos jsonb not null default '[]'::jsonb,
  lat double precision not null,
  lng double precision not null,
  location geography(point, 4326) generated always as (
    st_setsrid(st_makepoint(lng, lat), 4326)::geography
  ) stored,
  status listing_status not null default 'available',
  created_at timestamptz not null default now()
);

create index listings_location_gix on public.listings using gist (location);
create index listings_seller_idx on public.listings (seller_id);
create index listings_category_idx on public.listings (category_id);
create index listings_status_idx on public.listings (status);

-- ---------------------------------------------------------------------------
-- conversations & messages
-- ---------------------------------------------------------------------------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

create index conversations_buyer_idx on public.conversations (buyer_id);
create index conversations_seller_idx on public.conversations (seller_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  sent_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, sent_at);

-- ---------------------------------------------------------------------------
-- cod_meetups
-- ---------------------------------------------------------------------------
create type cod_meetup_status as enum ('scheduled', 'completed', 'cancelled');

create table public.cod_meetups (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  meetup_location text not null,
  meetup_time timestamptz not null,
  status cod_meetup_status not null default 'scheduled'
);

create index cod_meetups_conversation_idx on public.cod_meetups (conversation_id);

-- ---------------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  reviewer_id uuid not null references public.profiles (id) on delete cascade,
  reviewed_user_id uuid not null references public.profiles (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (listing_id, reviewer_id)
);

create index reviews_reviewed_user_idx on public.reviews (reviewed_user_id);

-- Keep profiles.rating_avg in sync whenever reviews change.
create function public.recompute_rating_avg() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  target_user uuid := coalesce(new.reviewed_user_id, old.reviewed_user_id);
begin
  update public.profiles
  set rating_avg = coalesce(
    (select round(avg(rating)::numeric, 2) from public.reviews where reviewed_user_id = target_user),
    0
  )
  where id = target_user;
  return null;
end;
$$;

create trigger reviews_after_change
after insert or update or delete on public.reviews
for each row execute function public.recompute_rating_avg();

-- ---------------------------------------------------------------------------
-- reports
-- ---------------------------------------------------------------------------
create type report_reason as enum ('penipuan', 'barang_tidak_sesuai', 'no_show', 'lainnya');
create type report_status as enum ('pending', 'reviewed', 'resolved');

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_user_id uuid references public.profiles (id) on delete cascade,
  reported_listing_id uuid references public.listings (id) on delete cascade,
  reason report_reason not null,
  status report_status not null default 'pending',
  created_at timestamptz not null default now(),
  constraint reports_target_check check (
    reported_user_id is not null or reported_listing_id is not null
  )
);

create index reports_reporter_idx on public.reports (reporter_id);
create index reports_status_idx on public.reports (status);

-- Apply permissions to all tables for API access
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;

