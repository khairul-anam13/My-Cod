/**
 * @deprecated Import from "@/utils/supabase/client" for new code.
 * This re-export keeps existing imports working without touching every file.
 */
import { createClient } from "@/utils/supabase/client";

export const supabase = createClient();

