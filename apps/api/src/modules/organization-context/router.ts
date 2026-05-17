/**
 * /api/v1/organization-context — CRUD for the long-form Q&A facts that
 * downstream AI features (policy drafting, questionnaire answering, risk
 * scoring, chat assistant) feed into prompts. Tenant-scoped via
 * prismaWithTenant.
 *
 * Phase 1 of the "ongoing AI context" plan adds the extraction surface:
 *
 *   POST /from-text                         → run the LLM extractor on
 *                                              pasted prose, persist the
 *                                              proposals as `pending`.
 *   GET  /proposals?status=pending          → list pending proposals for
 *                                              the review queue.
 *   POST /proposals/:id/accept              → transactional promotion to
 *                                              an active TenantContext
 *                                              row (with optional supersede).
 *   POST /proposals/:id/reject              → mark the proposal rejected.
 *
 * Constraint: AI features (policy drafting, etc.) NEVER read from
 * TenantContextProposal. Only this router reads it. The active
 * `TenantContext` table is the single source of truth for AI
 * grounding.
 */

import { Router } from "express";
import { z } from "zod";
import { extractContextProposals, type ExistingContextRef } from "@trustalo/ai";
import { assertEnterpriseLicense } from "@trustalo/license";
import { prismaWithTenant } from "../../db/prisma.js";
import { notifyProposalChanged } from "../../db/pg-listener.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import { consumeToken } from "../../lib/rate-limit.js";
import { resolveOrgAI } from "../../config/ai.js";

export const organizationContextRouter: Router = Router();
organizationContextRouter.use(authorizeResource("settings:read", "settings:write"));

const categoryEnum = z.enum([
  "company",
  "tech_stack",
  "processes",
  "data_handling",
  "risk_appetite",
  "team",
]);
const sourceEnum = z.enum(["onboarding", "inferred", "manual"]);
const statusEnum = z.enum(["active", "superseded", "archived"]);

const upsertBody = z.object({
  category: categoryEnum,
  question: z.string().min(1).max(500),
  answer: z.string().min(1).max(20000),
  source: sourceEnum.optional().default("manual"),
  confidence: z.number().min(0).max(1).optional().default(1),
});

const idParams = z.object({ id: z.string().min(1) });

// ── List with optional category + status filter ────────────────────
organizationContextRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const query = z
      .object({
        category: categoryEnum.optional(),
        // Defaults to `active` so the wizard UI never shows superseded
        // rows unless it explicitly opts in via the history disclosure.
        status: statusEnum.optional().default("active"),
        // Pass `?includeHistory=true` to also pull `superseded` rows.
        includeHistory: z.coerce.boolean().optional(),
      })
      .parse(req.query);

    const where: Record<string, unknown> = {};
    if (query.category) where.category = query.category;
    if (query.includeHistory) {
      where.status = { in: ["active", "superseded"] };
    } else {
      where.status = query.status;
    }

    const rows = await db.tenantContext.findMany({
      where,
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ── Bulk upsert (used by the onboarding wizard) ────────────────────
organizationContextRouter.post("/bulk", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);

    const body = z.object({ entries: z.array(upsertBody) }).parse(req.body);

    const created = await Promise.all(
      body.entries.map((entry) =>
        db.tenantContext.create({
          data: {
            ...entry,
            tenantId,
            // Wizard answers are user-authored; mark as confirmed at
            // creation so they're indistinguishable from accepted
            // proposals in the audit trail.
            confirmedAt: new Date(),
            confirmedBy: userId,
            provenance: { kind: "wizard" },
          },
        }),
      ),
    );

    await audit(req, "create", "TenantContext", undefined, {
      bulk: true,
      count: created.length,
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// ── Create single ──────────────────────────────────────────────────
organizationContextRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);
    const body = upsertBody.parse(req.body);

    const created = await db.tenantContext.create({
      data: {
        ...body,
        tenantId,
        confirmedAt: new Date(),
        confirmedBy: userId,
        provenance: { kind: "wizard" },
      },
    });
    await audit(req, "create", "TenantContext", created.id, {
      category: created.category,
      question: created.question,
    });
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// ── Update ─────────────────────────────────────────────────────────
organizationContextRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const { id } = idParams.parse(req.params);

    const body = upsertBody.partial().parse(req.body);

    const updated = await db.tenantContext.update({
      where: { id },
      data: body,
    });
    await audit(req, "update", "TenantContext", id, body);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ── Delete ─────────────────────────────────────────────────────────
organizationContextRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const { id } = idParams.parse(req.params);

    await db.tenantContext.delete({ where: { id } });
    await audit(req, "delete", "TenantContext", id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────
// Phase 1 — Extraction surface
// ─────────────────────────────────────────────────────────────────────

const fromTextBody = z.object({
  text: z.string().trim().min(20).max(20_000),
  /** Override the default proposal cap (1..20). */
  maxProposals: z.number().int().min(1).max(20).optional(),
});

// Generous bucket for review queue navigation; tight bucket for the
// extractor itself since each call burns LLM tokens.
const EXTRACTION_LIMIT = { capacity: 6, refillMs: 60_000 } as const;

// ── POST /from-text ────────────────────────────────────────────────
organizationContextRouter.post("/from-text", async (req, res, next) => {
  try {
    // EE — gated on the "ai" feature. The downstream
    // `extractContextProposals` is itself an EE export and self-gates,
    // but we check here too so the failure surfaces before any
    // rate-limit token is consumed.
    await assertEnterpriseLicense("ai");

    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;

    if (!consumeToken(tenantId, "context_extraction", EXTRACTION_LIMIT)) {
      return res.status(429).json({
        success: false,
        error: "Too many extraction requests. Try again in a minute.",
      });
    }

    const body = fromTextBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    // Compact summary for the supersedes hint — answers stay server-side.
    const existingRows = await db.tenantContext.findMany({
      where: { status: "active" },
      select: { id: true, category: true, question: true },
      orderBy: { createdAt: "asc" },
    });
    const existingContext: ExistingContextRef[] = existingRows.map((r) => ({
      id: r.id,
      category: r.category as ExistingContextRef["category"],
      question: r.question,
    }));

    const ai = await resolveOrgAI(tenantId, "context_extraction");

    const result = await extractContextProposals(ai.client, {
      text: body.text,
      existingContext,
      maxProposals: body.maxProposals,
    });

    // Persist as pending proposals — ALL go through the review queue.
    const created = await Promise.all(
      result.proposals.map((p) =>
        db.tenantContextProposal.create({
          data: {
            tenantId,
            kind: "paste",
            category: p.category,
            question: p.question,
            answer: p.answer,
            confidence: p.confidence,
            rationale: p.rationale,
            supersedesContextId: p.supersedesContextId,
            provenance: {
              kind: "paste",
              modelUsed: ai.model,
              providerSource: ai.source,
              redactions: result.redactions,
              submittedBy: userId,
            },
          },
        }),
      ),
    );

    await audit(req, "create", "OrganizationContextAIProposal", undefined, {
      kind: "paste",
      count: created.length,
      dropped: result.dropped,
      redactions: result.redactions,
      modelUsed: ai.model,
      providerSource: ai.source,
    });

    // Push to /chat/proposals/stream subscribers across the cluster.
    // Only notify if we actually persisted something — an extractor
    // run that produced zero proposals shouldn't trigger a refresh.
    if (created.length > 0) {
      void notifyProposalChanged(tenantId, "created");
    }

    res.status(201).json({
      success: true,
      data: {
        proposals: created,
        dropped: result.dropped,
        redactions: result.redactions,
        modelUsed: ai.model,
        providerSource: ai.source,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /proposals ─────────────────────────────────────────────────
organizationContextRouter.get("/proposals", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    const query = z
      .object({
        status: z.enum(["pending", "accepted", "rejected"]).optional().default("pending"),
        limit: z.coerce.number().int().min(1).max(200).optional().default(50),
      })
      .parse(req.query);

    const rows = await db.tenantContextProposal.findMany({
      where: { status: query.status },
      orderBy: { createdAt: "desc" },
      take: query.limit,
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /proposals/:id/accept ─────────────────────────────────────
// Transactional: mark proposal accepted, optionally supersede an
// existing row, create the new active TenantContext row.
organizationContextRouter.post("/proposals/:id/accept", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);
    const { id } = idParams.parse(req.params);

    // Optional editorial overrides — let the reviewer tweak the
    // category/question/answer at accept time without losing the
    // provenance trail.
    const body = z
      .object({
        category: categoryEnum.optional(),
        question: z.string().min(1).max(500).optional(),
        answer: z.string().min(1).max(20_000).optional(),
        /// Override the supersedes link (set to null to detach, omit to keep).
        supersedesContextId: z.string().min(1).nullable().optional(),
      })
      .parse(req.body ?? {});

    const proposal = await db.tenantContextProposal.findFirst({
      where: { id },
    });
    if (!proposal) {
      return res.status(404).json({ success: false, error: "Proposal not found" });
    }
    if (proposal.status !== "pending") {
      return res.status(409).json({
        success: false,
        error: `Proposal is already ${proposal.status}.`,
      });
    }

    const supersedesContextId =
      body.supersedesContextId === null
        ? null
        : (body.supersedesContextId ?? proposal.supersedesContextId ?? null);

    // Use the underlying client for $transaction since the tenant
    // extension preserves it. All writes inside still get tenant
    // scoping injected.
    const result = await db.$transaction(async (tx) => {
      let supersededRow = null as null | { id: string };
      if (supersedesContextId) {
        // Mark the existing row superseded. We don't delete it — the
        // history disclosure renders previous answers under each row.
        supersededRow = await tx.tenantContext.update({
          where: { id: supersedesContextId },
          data: { status: "superseded" },
          select: { id: true },
        });
      }

      const created = await tx.tenantContext.create({
        data: {
          tenantId,
          category: body.category ?? proposal.category,
          question: body.question ?? proposal.question,
          answer: body.answer ?? proposal.answer,
          source: "inferred",
          confidence: proposal.confidence,
          status: "active",
          supersedesId: supersededRow?.id ?? null,
          provenance: {
            ...((proposal.provenance as Record<string, unknown> | null) ?? {}),
            acceptedFromProposalId: proposal.id,
            acceptedBy: userId,
          },
          confirmedAt: new Date(),
          confirmedBy: userId,
        },
      });

      const updatedProposal = await tx.tenantContextProposal.update({
        where: { id: proposal.id },
        data: {
          status: "accepted",
          decidedAt: new Date(),
          decidedBy: userId,
        },
      });

      return {
        contextEntry: created,
        proposal: updatedProposal,
        supersededId: supersededRow?.id ?? null,
      };
    });

    await audit(req, "approve", "OrganizationContextAIConfirmation", proposal.id, {
      createdContextId: result.contextEntry.id,
      supersededContextId: result.supersededId,
      kind: proposal.kind,
    });

    // Wake up SSE consumers so the proposal disappears from the
    // pending list without waiting for the safety refresh tick.
    void notifyProposalChanged(tenantId, "accepted");

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── POST /proposals/:id/reject ─────────────────────────────────────
organizationContextRouter.post("/proposals/:id/reject", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);
    const { id } = idParams.parse(req.params);

    const proposal = await db.tenantContextProposal.findFirst({
      where: { id },
    });
    if (!proposal) {
      return res.status(404).json({ success: false, error: "Proposal not found" });
    }
    if (proposal.status !== "pending") {
      return res.status(409).json({
        success: false,
        error: `Proposal is already ${proposal.status}.`,
      });
    }

    const updated = await db.tenantContextProposal.update({
      where: { id },
      data: { status: "rejected", decidedAt: new Date(), decidedBy: userId },
    });

    await audit(req, "reject", "OrganizationContextAIConfirmation", id, {
      kind: proposal.kind,
    });

    void notifyProposalChanged(tenantId, "rejected");

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});
