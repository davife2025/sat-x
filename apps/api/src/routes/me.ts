import type { FastifyInstance } from "fastify";
import { getUserIdFromRequest } from "../lib/auth.js";
import { createAdminClient } from "../lib/supabase.js";
import type { ApiResult, Profile } from "@sat-x/shared";

export async function meRoutes(app: FastifyInstance) {
  app.get("/me", async (req, reply) => {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      const body: ApiResult<never> = {
        ok: false,
        error: { error: "unauthorized", message: "Missing or invalid token" },
      };
      return reply.status(401).send(body);
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, created_at")
      .eq("id", userId)
      .single();

    if (error || !data) {
      const body: ApiResult<never> = {
        ok: false,
        error: { error: "not_found", message: "Profile not found" },
      };
      return reply.status(404).send(body);
    }

    const profile: Profile = {
      id: data.id,
      displayName: data.display_name,
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
    };

    const body: ApiResult<Profile> = { ok: true, data: profile };
    return reply.send(body);
  });
}
