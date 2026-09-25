import { createBrowserClient } from "@supabase/ssr";

// Falls back to an unreachable placeholder when unconfigured, instead of
// throwing, so the app stays usable (as "not logged in") while
// NEXT_PUBLIC_SUPABASE_URL/ANON_KEY aren't filled in yet.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
