import type { SupabaseClient } from "@supabase/supabase-js";

// Advisory GPS-trust heuristics. Web Geolocation has no equivalent of
// Android's isFromMockProvider() — this can only flag *suspicious* signals
// for a human reviewer, never prove or block fake GPS on its own. Both
// checks are soft (IP geolocation is coarse on cellular/VPN; a real user can
// legitimately travel) so a flag is a hint, not a verdict.
const MAX_IP_MISMATCH_KM = Number(process.env.LOCATION_TRUST_MAX_IP_MISMATCH_KM ?? 150);
const MAX_IMPLIED_SPEED_KMH = Number(process.env.LOCATION_TRUST_MAX_SPEED_KMH ?? 300);

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function lookupIpGeo(ip: string): Promise<{ lat: number; lng: number } | null> {
  // Private/local addresses (dev, or behind a misconfigured proxy) can't be geolocated.
  if (!ip || ip.startsWith("127.") || ip === "::1" || ip.startsWith("10.") || ip.startsWith("192.168.")) {
    return null;
  }
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as { latitude?: number; longitude?: number };
    if (typeof data.latitude !== "number" || typeof data.longitude !== "number") return null;
    return { lat: data.latitude, lng: data.longitude };
  } catch {
    return null;
  }
}

export interface LocationTrustInput {
  userId: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  ip: string;
  source: string;
  supabase: SupabaseClient;
}

/**
 * Fire-and-forget: logs a location_events row with a `flagged` advisory
 * signal. Never throws — a flaky third-party geo lookup should never break
 * the address/listing save it's attached to.
 */
export async function evaluateAndLogLocation(input: LocationTrustInput): Promise<void> {
  try {
    const { userId, lat, lng, accuracy, ip, source, supabase } = input;

    let distanceFromIpKm: number | null = null;
    let impliedSpeedKmh: number | null = null;
    let flagged = false;

    const ipGeo = await lookupIpGeo(ip);
    if (ipGeo) {
      distanceFromIpKm = haversineKm(lat, lng, ipGeo.lat, ipGeo.lng);
      if (distanceFromIpKm > MAX_IP_MISMATCH_KM) flagged = true;
    }

    const { data: last } = await supabase
      .from("location_events")
      .select("lat, lng, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (last) {
      const hoursElapsed = (Date.now() - new Date(last.created_at).getTime()) / 3_600_000;
      if (hoursElapsed > 0) {
        const distanceKm = haversineKm(lat, lng, last.lat, last.lng);
        impliedSpeedKmh = distanceKm / hoursElapsed;
        if (impliedSpeedKmh > MAX_IMPLIED_SPEED_KMH) flagged = true;
      }
    }

    await supabase.from("location_events").insert({
      user_id: userId,
      lat,
      lng,
      accuracy,
      source,
      ip,
      distance_from_ip_km: distanceFromIpKm,
      implied_speed_kmh: impliedSpeedKmh,
      flagged,
    });
  } catch {
    // Advisory only — swallow any failure.
  }
}
