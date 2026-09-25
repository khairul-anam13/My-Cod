const API_URL = process.env.NEXT_PUBLIC_API_URL!;

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
