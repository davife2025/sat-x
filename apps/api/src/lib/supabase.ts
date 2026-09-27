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

/** Anon-key client, used only for the parts of the invite flow that are
 * ordinary auth calls (sending the magic-link email) rather than
 * privileged ones (creating the user, redeeming the code). */
export function createAuthClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY — check apps/api/.env");
  }

  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
