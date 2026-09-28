import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { healthRoutes } from "./routes/health.js";
import { meRoutes } from "./routes/me.js";
import { inviteRoutes } from "./routes/invites.js";

// trustProxy so rate limiting sees each visitor's real IP behind Render's
// proxy, rather than treating everyone as one client.
const app = Fastify({ logger: true, trustProxy: true });

await app.register(cors, {
  origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
});

// global: false — only routes that opt in via config.rateLimit are limited.
await app.register(rateLimit, { global: false });

await app.register(healthRoutes);
await app.register(meRoutes);
await app.register(inviteRoutes);

const port = Number(process.env.PORT ?? 4000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`sat-x api listening on :${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
