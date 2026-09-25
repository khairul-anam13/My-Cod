import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

/**
 * Per-request client, scoped to the caller's JWT (if any). Supabase Row Level
 * Security policies do the authorization work here, not this API — so a
 * user's own token always sees exactly what they're allowed to see.
 */
export function createSupabaseClientForRequest(accessToken?: string) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined,
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Service-role client that bypasses RLS. Use only for admin/moderation
 * tasks (e.g. reading the full reports queue) — never expose its result
 * set directly to a non-admin caller.
 */
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);
