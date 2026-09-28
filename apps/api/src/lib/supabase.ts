import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client. This bypasses Row Level Security, so it must only
 * ever run on the server (this app) and the key must never reach the
 * browser. apps/web uses the anon key + RLS instead — see
 * apps/web/src/lib/supabase.
 */
export function createAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — check apps/api/.env"
    );
  }

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
