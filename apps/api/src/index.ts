import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { connectMongo, disconnectMongo } from "./db/mongoose.js";
import { prisma } from "./db/prisma.js";
import { requestLogger } from "./middleware/request-logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import { authenticate } from "./middleware/authenticate.js";
import { frameworksRouter } from "./modules/frameworks/router.js";
import { authRouter } from "./modules/auth/router.js";
import { organizationsRouter } from "./modules/organizations/router.js";
import { controlsRouter } from "./modules/controls/router.js";
import { policiesRouter } from "./modules/policies/router.js";
import { risksRouter } from "./modules/risks/router.js";
import { evidenceRouter } from "./modules/evidence/router.js";
import { vendorsRouter } from "./modules/vendors/router.js";
import { assetsRouter } from "./modules/assets/router.js";
import { incidentsRouter } from "./modules/incidents/router.js";
import { auditsRouter } from "./modules/audits/router.js";
import { bcpRouter } from "./modules/bcp/router.js";
import { aiGovernanceRouter } from "./modules/ai-governance/router.js";
import { privacyRouter } from "./modules/privacy/router.js";
import { trainingRouter } from "./modules/training/router.js";
import { tasksRouter } from "./modules/tasks/router.js";
import { trustCenterRouter, trustCenterPublicRouter } from "./modules/trust-center/router.js";
import { dashboardsRouter } from "./modules/dashboards/router.js";
import { vulnerabilitiesRouter } from "./modules/vulnerabilities/router.js";
import { aiConfigRouter } from "./modules/ai-config/router.js";
import { organizationContextRouter } from "./modules/organization-context/router.js";
import { chatRouter } from "./modules/chat/router.js";
import { integrationsRouter } from "./modules/integrations/router.js";
import { questionnairesRouter } from "./modules/questionnaires/router.js";
import { internalRouter } from "./modules/internal/router.js";
import {
  startResearchResultsWorker,
  stopResearchResultsWorker,
} from "./workers/research-results.js";
// integration-check-results worker has been retired: integration check
// processing now lives entirely in the collector service (which also
// owns the IntegrationCheck/Result Prisma models).
import { getActiveAuthProvider } from "./modules/auth/provider-bootstrap.js";
import { getCorsOptions } from "./config/security.js";

const app = express();
const PORT = parseInt(process.env.API_PORT || "4000", 10);

app.use(helmet());
app.use(cors(getCorsOptions()));
app.use(cookieParser());
// Capture raw body so HMAC-signed service requests (internal cross-service
// traffic) can recompute the signature server-side.
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);
app.use(requestLogger);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/trust-center/public", trustCenterPublicRouter);

// Internal cross-service routes use a shared secret + tenant header
// instead of user JWTs, so they MUST be mounted before the JWT
// `authenticate` middleware below.
app.use("/internal", internalRouter);

app.use("/api/v1", authenticate);
app.use("/api/v1/organizations", organizationsRouter);
app.use("/api/v1/frameworks", frameworksRouter);
app.use("/api/v1/controls", controlsRouter);
app.use("/api/v1/policies", policiesRouter);
app.use("/api/v1/risks", risksRouter);
app.use("/api/v1/evidence", evidenceRouter);
app.use("/api/v1/vendors", vendorsRouter);
app.use("/api/v1/assets", assetsRouter);
app.use("/api/v1/incidents", incidentsRouter);
app.use("/api/v1/audits", auditsRouter);
app.use("/api/v1/bcp", bcpRouter);
app.use("/api/v1/ai-governance", aiGovernanceRouter);
app.use("/api/v1/privacy", privacyRouter);
app.use("/api/v1/training", trainingRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/trust-center", trustCenterRouter);
app.use("/api/v1/dashboards", dashboardsRouter);
app.use("/api/v1/vulnerabilities", vulnerabilitiesRouter);
app.use("/api/v1/ai-config", aiConfigRouter);
app.use("/api/v1/organization-context", organizationContextRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/integrations", integrationsRouter);
app.use("/api/v1/questionnaires", questionnairesRouter);

app.use(errorHandler);

async function start() {
  // Resolve the active auth provider before binding the HTTP listener so any
  // misconfiguration (missing Cognito env vars, broken external plugin, etc.)
  // surfaces immediately instead of failing the first login request.
  await getActiveAuthProvider();

  await connectMongo();
  console.log("[api] MongoDB connected");

  app.listen(PORT, () => {
    console.log(`[api] Listening on port ${PORT}`);
  });

  startResearchResultsWorker().catch((err) =>
    console.error("[api] research-results worker failed to start:", err),
  );
}

async function shutdown() {
  console.log("[api] Shutting down…");
  await stopResearchResultsWorker();
  await disconnectMongo();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start().catch((err) => {
  console.error("[api] Failed to start:", err);
  process.exit(1);
});
