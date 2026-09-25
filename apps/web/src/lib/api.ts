import { mockCategories, mockListingDetail, mockNearbyListings } from "@/lib/mockData";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  cache?: RequestCache;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token, cache = "no-store" }: ApiFetchOptions = {},
): Promise<T> {
  if (USE_MOCK_DATA && method === "GET") {
    const mocked = mockResponseFor(path);
    if (mocked !== undefined) return mocked as T;
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => undefined);

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && String(data.error)) ||
      `Permintaan gagal (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

/** Read-only fixture responses — see src/lib/mockData.ts. `undefined` = not mocked, fall through to the real API. */
function mockResponseFor(path: string): unknown {
  const [pathname] = path.split("?");
  if (pathname === "/categories") return mockCategories();
  if (pathname === "/listings/nearby") return mockNearbyListings();

  const detail = pathname.match(/^\/listings\/([^/]+)$/);
  if (detail) return mockListingDetail(detail[1]);

  return undefined;
}
