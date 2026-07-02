/**
 * Custom-check routes (the collector side of the API's
 * `/api/v1/integrations/from-prompt/*` façade).
 *
 *   POST /checks/test             — validate + execute a spec once.
 *   POST /checks/from-prompt/save — persist a custom HTTP check.
 *
 * Generation itself (LLM call) stays in the API — it is EE-gated and
 * resolves providers through `resolveOrgAI`. The collector only ever
 * sees schema-validated specs.
 *
 * Browser specs are answered with the structured `not_supported`
 * payload (HTTP 200 for test, 422 for save) — never a bare 501/503 —
 * so clients can tell "roadmap" apart from an outage.
 */

import { Router } from "express";
import { z } from "zod";
import type { AuthenticatedRequest } from "@trustalo/auth";
import { HttpCheckSpecSchema } from "@trustalo/integration-manifests";
import { authorize } from "../middleware/authorize.js";
import {
  BROWSER_NOT_SUPPORTED,
  evaluateSpecForTest,
  isValidCronSchedule,
  saveCustomCheck,
} from "../integrations/custom/index.js";

export const checksRouter: Router = Router();

const testSpecSchema = z.object({
  runner: z.enum(["http", "browser"]),
  spec: z.unknown(),
  /**
   * Transient secrets for `{{secret:KEY}}` placeholders during a
   * test-before-save run. Never persisted by this route.
   */
  secrets: z.record(z.string(), z.string()).optional(),
});

checksRouter.post("/test", authorize("integrations:manage"), async (req, res, next) => {
  try {
    const body = testSpecSchema.parse(req.body ?? {});
    const outcome = await evaluateSpecForTest(body.runner, body.spec, {
      secrets: body.secrets ?? {},
    });

    if (outcome.kind === "not_supported") {
      // 200 on purpose: asking "can you run a browser spec?" is a
      // well-formed question with a well-formed answer ("not yet").
      res.json({ success: true, data: outcome.payload });
      return;
    }
    if (outcome.kind === "invalid_spec") {
      res.status(422).json({
        success: false,
        error: {
          code: "INVALID_SPEC",
          message: "Spec does not match the HTTP check contract",
          details: outcome.issues,
        },
      });
      return;
    }
    res.json({ success: true, data: outcome.result });
  } catch (err) {
    next(err);
  }
});

const saveCheckSchema = z.object({
  prompt: z.string().min(1).max(2_000),
  runner: z.enum(["http", "browser"]),
  spec: z.unknown(),
  title: z.string().min(3).max(120),
  description: z.string().min(1).max(600),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  schedule: z.string().min(9).max(100),
  modelUsed: z.string().max(200).optional(),
  controlIds: z.array(z.string().min(1)).max(50).optional(),
  frameworkRefs: z
    .array(
      z.object({
        framework: z.string().min(1),
        requirement: z.string().min(1),
        note: z.string().optional(),
      }),
    )
    .max(50)
    .optional(),
  secrets: z.record(z.string().regex(/^[a-zA-Z0-9_.-]+$/), z.string()).optional(),
});

checksRouter.post("/from-prompt/save", authorize("integrations:manage"), async (req, res, next) => {
  try {
    const auth = (req as AuthenticatedRequest).auth;
    const body = saveCheckSchema.parse(req.body ?? {});

    if (body.runner === "browser") {
      res.status(422).json({
        success: false,
        error: {
          code: BROWSER_NOT_SUPPORTED.code,
          message: BROWSER_NOT_SUPPORTED.message,
          data: BROWSER_NOT_SUPPORTED,
        },
      });
      return;
    }

    // Strict schema validation of the (possibly user-edited) spec is
    // the save-time guardrail: nothing lands in the DB unless it will
    // execute under the HTTP runner contract.
    const spec = HttpCheckSpecSchema.safeParse(body.spec);
    if (!spec.success) {
      res.status(422).json({
        success: false,
        error: {
          code: "INVALID_SPEC",
          message: "Spec does not match the HTTP check contract",
          details: spec.error.flatten(),
        },
      });
      return;
    }

    if (!isValidCronSchedule(body.schedule)) {
      res.status(422).json({
        success: false,
        error: {
          code: "INVALID_SCHEDULE",
          message: `"${body.schedule}" is not a valid 5-field cron expression`,
        },
      });
      return;
    }

    const saved = await saveCustomCheck({
      tenantId: auth.tenantId,
      prompt: body.prompt,
      spec: spec.data,
      title: body.title,
      description: body.description,
      severity: body.severity,
      schedule: body.schedule,
      modelUsed: body.modelUsed,
      controlIds: body.controlIds,
      frameworkRefs: body.frameworkRefs,
      secrets: body.secrets,
    });

    res.status(201).json({ success: true, data: saved });
  } catch (err) {
    next(err);
  }
});
