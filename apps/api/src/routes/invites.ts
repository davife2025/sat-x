import type { FastifyInstance } from "fastify";
import { createAdminClient, createAuthClient } from "../lib/supabase.js";
import type { ApiResult } from "@sat-x/shared";

export async function inviteRoutes(app: FastifyInstance) {
  app.post("/invites/redeem", async (req, reply) => {
    const body = req.body as { email?: string; code?: string };
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim().toLowerCase();

    if (!email || !code) {
      const res: ApiResult<never> = {
        ok: false,
        error: { error: "bad_request", message: "Email and invite code are required." },
      };
      return reply.status(400).send(res);
    }

    const admin = createAdminClient();

    const { data: valid, error: redeemError } = await admin.rpc("redeem_invite_code", {
      target_code: code,
    });
    if (redeemError || !valid) {
      const res: ApiResult<never> = {
        ok: false,
        error: { error: "invalid_code", message: "That invite code is invalid or already used up." },
      };
      return reply.status(400).send(res);
    }

    // Create the account if it doesn't exist. If it already does, that's
    // fine too — an existing member re-using someone's leftover code is
    // just "sign me in", not an error.
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (createError && !createError.message.toLowerCase().includes("already been registered")) {
      const res: ApiResult<never> = {
        ok: false,
        error: { error: "create_failed", message: createError.message },
      };
      return reply.status(500).send(res);
    }

    // Account definitely exists now — send the real sign-in link through
    // Supabase's normal (non-admin) auth flow.
    const authClient = createAuthClient();
    const { error: otpError } = await authClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (otpError) {
      const res: ApiResult<never> = {
        ok: false,
        error: { error: "email_failed", message: otpError.message },
      };
      return reply.status(500).send(res);
    }

    const res: ApiResult<{ sent: true }> = { ok: true, data: { sent: true } };
    return reply.send(res);
  });
}
