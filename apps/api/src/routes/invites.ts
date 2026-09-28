import type { FastifyInstance } from "fastify";
import { createAdminClient } from "../lib/supabase.js";
import type { ApiResult } from "@sat-x/shared";

function fail(error: string, message: string): ApiResult<never> {
  return { ok: false, error: { error, message } };
}

export async function inviteRoutes(app: FastifyInstance) {
  // Redeeming a code creates the account with the CODE AS ITS PASSWORD.
  // The person changes it later from the Security page.
  app.post(
    "/invites/redeem",
    { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } },
    async (req, reply) => {
      const body = (req.body ?? {}) as { email?: string; code?: string };
      const email = body.email?.trim().toLowerCase();
      const code = body.code?.trim().toLowerCase();

      if (!email || !code) {
        return reply.status(400).send(fail("bad_request", "Email and invite code are required."));
      }

      const admin = createAdminClient();

      // Consume the code first (atomic check-and-consume in Postgres).
      const { data: valid, error: redeemError } = await admin.rpc("redeem_invite_code", {
        target_code: code,
      });
      if (redeemError || !valid) {
        return reply.status(400).send(fail("invalid_code", "That invite code is invalid or already used."));
      }

      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password: code,
        email_confirm: true,
      });

      if (createError) {
        // Nothing was created, so hand the code back rather than burn it.
        await admin.rpc("release_invite_code", { target_code: code });

        // An existing account must NEVER have its password overwritten by
        // a code — that would let anyone holding a code take over any
        // account whose email they know.
        const exists =
          (createError as { code?: string }).code === "email_exists" ||
          createError.message.toLowerCase().includes("already been registered");
        if (exists) {
          return reply.status(409).send(fail("account_exists", "That email already has an account."));
        }
        return reply.status(500).send(fail("create_failed", createError.message));
      }

      const res: ApiResult<{ created: true }> = { ok: true, data: { created: true } };
      return reply.send(res);
    }
  );

  // Someone without a code asks for one. An admin approves it from the
  // in-app Admin page and passes the code on themselves.
  app.post(
    "/invites/request",
    { config: { rateLimit: { max: 10, timeWindow: "1 hour" } } },
    async (req, reply) => {
      const body = (req.body ?? {}) as { email?: string; note?: string };
      const email = body.email?.trim().toLowerCase();
      const note = body.note?.trim().slice(0, 500) || null;

      if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return reply.status(400).send(fail("bad_request", "Enter a valid email address."));
      }

      const admin = createAdminClient();
      const { error } = await admin.from("invite_requests").insert({ email, note });

      // 23505 = there's already a pending request for this email. From
      // the requester's side that's the same outcome, so report success.
      if (error && error.code !== "23505") {
        return reply.status(500).send(fail("request_failed", "Could not record your request."));
      }

      const res: ApiResult<{ requested: true }> = { ok: true, data: { requested: true } };
      return reply.send(res);
    }
  );
}
