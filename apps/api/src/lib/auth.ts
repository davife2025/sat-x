import type { FastifyRequest } from "fastify";
import { createAdminClient } from "./supabase.js";

/**
 * Verifies the Supabase access token sent as `Authorization: Bearer <jwt>`
 * from apps/web, and returns the authenticated user's id — or null if the
 * request isn't authenticated.
 */
export async function getUserIdFromRequest(
  req: FastifyRequest
): Promise<string | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  const token = header.slice("Bearer ".length);
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user.id;
}
