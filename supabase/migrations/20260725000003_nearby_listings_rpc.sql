-- My COD — nearby listings search
-- PRD 3.1 #1 (must-have): search/filter by distance, nearest first.
-- Uses the GiST index on listings.location via ST_DWithin for an efficient
-- radius query (PRD 7.4 — spatial indexing required from the start).

create function public.nearby_listings(
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
    p.is_verified as seller_is_verified
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
