// Free geocoding via OpenStreetMap's Nominatim — proxied through the API
// (not called from the browser) for two reasons: Nominatim's usage policy
// requires an identifying User-Agent, which a browser fetch can't set, and
// its 1 request/second limit is easier to enforce from one server process
// than from many browser tabs. Policy: https://operations.osmfoundation.org/policies/nominatim/

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = process.env.NOMINATIM_USER_AGENT || "MyCOD/1.0 (isi kontak asli di NOMINATIM_USER_AGENT)";
const MIN_INTERVAL_MS = 1100;

// Serializes calls with a fixed gap between them, so concurrent requests
// from different users still respect Nominatim's 1 req/s limit globally
// (ponytail: plain promise chain, no queue library needed for this volume).
let queue: Promise<unknown> = Promise.resolve();

function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    await new Promise((resolve) => setTimeout(resolve, MIN_INTERVAL_MS));
    return fn();
  });
  queue = run.catch(() => undefined);
  return run;
}

async function callNominatim(path: string, params: Record<string, string>) {
  const url = new URL(`${NOMINATIM_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("format", "jsonv2");

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim ${path} gagal (${res.status})`);
  return res.json();
}

export function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  return throttled(async () => {
    const data = await callNominatim("/reverse", { lat: String(lat), lon: String(lng) });
    return (data as { display_name?: string }).display_name ?? null;
  });
}

export interface GeocodeResult {
  display_name: string;
  lat: number;
  lng: number;
}

export function searchGeocode(query: string): Promise<GeocodeResult[]> {
  return throttled(async () => {
    const data = await callNominatim("/search", { q: query, limit: "5" });
    return (data as { display_name: string; lat: string; lon: string }[]).map((r) => ({
      display_name: r.display_name,
      lat: Number(r.lat),
      lng: Number(r.lon),
    }));
  });
}
