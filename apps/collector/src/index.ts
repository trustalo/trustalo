import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authenticate, extractTenantContext } from "@trustalo/auth";
import { prisma } from "./db/prisma.js";
import { errorHandler } from "./middleware/error-handler.js";
import { globalRateLimiter } from "./middleware/rate-limit.js";
import { csrfProtection } from "./middleware/csrf.js";
import { providersRouter } from "./routes/providers.js";
import { connectionsRouter } from "./routes/connections.js";
import { jobsRouter } from "./routes/jobs.js";
import { syncLogsRouter } from "./routes/sync-logs.js";
import { startScheduler, stopScheduler } from "./scheduler/index.js";
import { startReconcileScheduler, stopReconcileScheduler } from "./scheduler/reconciler.js";
import { startOverdueDetector, stopOverdueDetector } from "./scheduler/overdue-detector.js";
import { startGapEscalator, stopGapEscalator } from "./scheduler/gap-escalator.js";
import { startRunner, stopRunner } from "./runner/index.js";
import { startResearchScheduler, stopResearchScheduler } from "./research/scheduler.js";
import {
  researchRouter,
  startResearchSubscriber,
  stopResearchSubscriber,
} from "./routes/research.js";
import { internalRouter } from "./routes/internal.js";
import { registerAllProviders } from "./integrations/register.js";
import { providerRegistry } from "./integrations/core/registry.js";
import { getEncryptionKey } from "./integrations/core/encryption.js";
import { getCorsOptions, getJwtSecret } from "./config/security.js";

getEncryptionKey();
registerAllProviders();

const app: express.Express = express();
const PORT = parseInt(process.env["COLLECTOR_PORT"] ?? "4001", 10);
const JWT_SECRET = getJwtSecret();

app.use(helmet());
app.use(cors(getCorsOptions()));
app.use(
  express.json({
    limit: "2mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);
// Baseline rate limit + CSRF protection. CSRF is no-op'd for safe
// methods, Bearer-token requests, and the public catalog/health/research
// paths (see middleware/csrf.ts for the full rationale).
app.use(globalRateLimiter);
app.use(csrfProtection);

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "collector",
    timestamp: new Date().toISOString(),
    providers: providerRegistry.size,
  });
});

// Provider catalog is public (like Vanta/Drata) — no auth needed to browse available integrations
app.use("/providers", providersRouter);

// Research health-check (research requests come via SQS queue, not HTTP)
app.use("/research", researchRouter);

// Service-to-service routes (used by the API for evidence-agent ops).
// Mounted before JWT `authenticate` because callers use a shared
// internal key + `X-Organization-Id` header instead of user tokens.
app.use("/internal", internalRouter);

app.use(authenticate(JWT_SECRET, { allowCookie: false }));
app.use(extractTenantContext());

app.use("/connections", connectionsRouter);
app.use("/jobs", jobsRouter);
app.use("/sync-logs", syncLogsRouter);

app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`[collector] listening on :${PORT}`);
  startScheduler().catch((err) => console.error("[collector] scheduler failed to start:", err));
  startRunner().catch((err) => console.error("[collector] runner failed to start:", err));
  startReconcileScheduler().catch((err) =>
    console.error("[collector] binding-reconciler failed to start:", err),
  );
  startOverdueDetector().catch((err) =>
    console.error("[collector] overdue-detector failed to start:", err),
  );
  startGapEscalator().catch((err) =>
    console.error("[collector] gap-escalator failed to start:", err),
  );
  startResearchScheduler().catch((err) =>
    console.error("[collector] research scheduler failed to start:", err),
  );
  startResearchSubscriber().catch((err) =>
    console.error("[collector] research subscriber failed to start:", err),
  );
});

async function shutdown(signal: string) {
  console.log(`[collector] ${signal} received – shutting down`);
  stopScheduler();
  stopRunner();
  stopReconcileScheduler();
  stopOverdueDetector();
  stopGapEscalator();
  stopResearchScheduler();
  await stopResearchSubscriber();
  server.close(() => {
    prisma.$disconnect().then(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { app };
