import { apiFetch } from "@/lib/api";
import type { NearbyListing } from "@my-cod/shared-types";

export interface NearbyQuery {
  lat: number;
  lng: number;
  radius_km?: number;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}

/** Wraps GET /listings/nearby, omitting empty params so the query stays short. */
export function fetchNearbyListings(q: NearbyQuery) {
  const query = new URLSearchParams({ lat: String(q.lat), lng: String(q.lng) });
  if (q.radius_km !== undefined) query.set("radius_km", String(q.radius_km));
  if (q.category_id) query.set("category_id", q.category_id);
  if (q.min_price !== undefined) query.set("min_price", String(q.min_price));
  if (q.max_price !== undefined) query.set("max_price", String(q.max_price));
  if (q.limit !== undefined) query.set("limit", String(q.limit));
  if (q.offset !== undefined) query.set("offset", String(q.offset));
  return apiFetch<NearbyListing[]>(`/listings/nearby?${query.toString()}`);
}

/**
 * Light diversification for the Explore feed: keeps the API's nearest-first
 * ordering broadly intact, but pushes back items whose category already
 * appeared in the previous two slots so the feed doesn't open with a wall of
 * one category. Pure client-side — no extra requests.
 */
export function diversifyFeed(listings: NearbyListing[]): NearbyListing[] {
  const remaining = [...listings];
  const out: NearbyListing[] = [];

  while (remaining.length > 0) {
    const recent = out.slice(-2).map((l) => l.category_id);
    const idx = remaining.findIndex((l) => !recent.includes(l.category_id));
    out.push(...remaining.splice(idx === -1 ? 0 : idx, 1));
  }

  return out;
}
