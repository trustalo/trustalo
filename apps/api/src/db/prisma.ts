import { PrismaClient } from "../../generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.API_DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function prismaWithTenant(tenantId: string) {
  return prisma.$extends({
    query: {
      $allOperations({ model, operation, args, query }) {
        const tenantScoped = [
          "Control",
          "Policy",
          "PolicyAcknowledgment",
          "PolicyControl",
          "PolicyComment",
          "Risk",
          "RiskAssessment",
          "RiskTreatment",
          "RiskMatrixChange",
          // RiskRegisterConfig was missed in the original whitelist —
          // it carries per-org field-visibility settings that must
          // never leak across tenants.
          "RiskRegisterConfig",
          "Vendor",
          "VendorAssessment",
          "VendorResearch",
          "VendorDocument",
          "Asset",
          "Incident",
          "IncidentTimeline",
          "Audit",
          "AuditFinding",
          // AuditDocument was missed in the original whitelist. Caught
          // by scripts/check-tenant-allowlist.ts; adding so uploaded
          // audit evidence is properly tenant-isolated.
          "AuditDocument",
          "FrameworkInstance",
          "ControlRequirementAssignment",
          "BusinessContinuityPlan",
          "BusinessImpactAnalysis",
          "BCPExercise",
          "AISystem",
          "AIRiskAssessment",
          "AIImpactAssessment",
          // AIIncident was missed in the original whitelist — without it the
          // tenant-scoping extension does not inject tenantId on
          // create/findMany, so multi-tenant isolation relies on routers
          // remembering to pass it manually. Adding here makes it consistent
          // with the rest of AI Governance.
          "AIIncident",
          "ProcessingActivity",
          "DPIA",
          "DataBreach",
          "DSARRequest",
          "Task",
          "TaskEvidence",
          "Evidence",
          "TrainingProgram",
          "TrainingCompletion",
          "TrainingQuiz",
          "QuizAttempt",
          "AIProviderConfig",
          "AIFeatureConfig",
          "TenantContext",
          // Phase 0 of "ongoing AI context": staging table for AI-extracted
          // fact proposals that live separately from active context until
          // a human accepts them. Must be tenant-scoped — leaking proposals
          // across orgs would be a confidentiality bug.
          "TenantContextProposal",
          // Phase 2 of "ongoing AI context": general compliance assistant
          // chat. Conversations and per-turn messages are strictly
          // per-tenant — chat transcripts often contain sensitive customer
          // data and MUST NOT leak across organizations.
          "Conversation",
          "Message",
          "TrustCenterConfig",
          "TrustResource",
          "TrustCenterAccessRequest",
          "TrustCenterSnapshot",
          "TrustCenterEvent",
          // Integration, IntegrationCheck, IntegrationCheckControl and
          // IntegrationCheckResult have been moved to the collector
          // service — they are no longer in this Prisma datasource.
          "TenantSettings",
          "Vulnerability",
          "Questionnaire",
          "Question",
          "Answer",
          // Async questionnaire-import job rows. Each carries the
          // uploaded blob's S3 key + per-sheet progress; leaking
          // across orgs would expose another tenant's questionnaire
          // contents and import errors.
          "QuestionnaireImportJob",
          // Per-control evidence-collection mode picker (manual vs agent)
          // and the agent's natural-language instructions + tool selection.
          // Strictly per-tenant: leaking another org's instructions or tool
          // wiring would be a confidentiality and security bug.
          "ControlEvidenceCollectionConfig",
          // CPS 234 Para 35 control-weakness register. Carries the
          // 10-business-day notification clock and remediability decision.
          // Strictly per-tenant — leaking another entity's weakness
          // disclosures would be a confidentiality bug and a regulator-
          // reportable incident in its own right.
          "ControlWeakness",
        ];

        if (!model || !tenantScoped.includes(model)) {
          return query(args);
        }

        if (["create", "createMany"].includes(operation)) {
          if ("data" in args) {
            if (Array.isArray(args.data)) {
              args.data = args.data.map((d: Record<string, unknown>) => ({
                ...d,
                tenantId,
              }));
            } else {
              (args.data as Record<string, unknown>).tenantId = tenantId;
            }
          }
        }

        if (
          [
            "findMany",
            "findFirst",
            "findUnique",
            "update",
            "updateMany",
            "delete",
            "deleteMany",
            "count",
            "aggregate",
          ].includes(operation)
        ) {
          if ("where" in args) {
            (args.where as Record<string, unknown>).tenantId = tenantId;
          } else {
            (args as Record<string, unknown>).where = { tenantId };
          }
        }

        return query(args);
      },
    },
  });
}
