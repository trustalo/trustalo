// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// EE FILE — governed by LICENSE_EE at the repo root. Production use of
// this router requires a valid Trustalo Enterprise License token in
// TRUSTALO_LICENSE_KEY that includes the "ai" feature.

/**
 * /api/v1/chat — general compliance assistant.
 *
 * Phase 2 of the "ongoing AI context" plan. Surfaces five capability
 * groups, all tenant-scoped via prismaWithTenant:
 *
 *   • Conversation CRUD
 *       GET    /conversations
 *       POST   /conversations
 *       PATCH  /conversations/:id          (rename / archive)
 *       DELETE /conversations/:id          (hard-delete a thread)
 *       GET    /conversations/:id/messages (paged transcript)
 *
 *   • Single-shot turn (non-streaming, easier to test)
 *       POST   /conversations/:id/turn
 *
 *   • SSE turn — streams the assistant reply token-bundle by
 *     token-bundle plus a "proposals" event when the parallel
 *     extraction pipeline finishes.
 *       POST   /conversations/:id/turn/stream
 *
 *   • SSE proposals — long-poll of pending TenantContextProposal
 *     rows for the active org. The chat UI subscribes once per session
 *     and updates the right-hand review panel without polling.
 *       GET    /proposals/stream
 *
 * Hard rules enforced in this file (and double-checked by the
 * ai-features.mdc rule):
 *   • All AI calls go through resolveOrgAI(orgId, "chat_assistant").
 *   • Every PII-sensitive user input is scrubPii'd before reaching the
 *     LLM (both for the chat turn and for the parallel extractor).
 *   • Every assistant turn writes a Message row with `groundingHash`
 *     and validated `citations`. Hallucinated citations are dropped,
 *     never persisted.
 *   • Every chat turn emits an audit log entry (create on the
 *     suggestion, separate update entries on user follow-ups).
 *   • Per-tenant rate limits: 30 chat turns/min and 30 extractions/min.
 *   • The assistant cannot mutate tenant data — context updates land in
 *     TenantContextProposal (status=pending) for human accept.
 */

import { Router } from "express";
import type { Response } from "express";
import { z } from "zod";
import { extractContextProposals, scrubPii, type ExistingContextRef } from "@trustalo/ai";
import { assertEnterpriseLicense } from "@trustalo/license";
import { prismaWithTenant } from "../../db/prisma.js";
import { notifyProposalChanged, subscribeProposalChanged } from "../../db/pg-listener.js";
import { authorizeResource } from "../../middleware/authorize.js";
import { audit } from "../../lib/audit.js";
import { consumeToken } from "../../lib/rate-limit.js";
import { resolveOrgAI } from "../../config/ai.js";
import {
  buildGroundingBundle,
  filterValidCitations,
  type Citation,
  type PageContext,
} from "./grounding.ee.js";
import { buildChatSystemPrompt, parseAssistantEnvelope } from "./system-prompt.ee.js";

export const chatRouter: Router = Router();
chatRouter.use(authorizeResource("settings:read", "settings:write"));

// All chat endpoints are EE — gate at router-mount time. A missing /
// invalid license fails fast with a 402 Payment Required (mapped by
// the global error handler) rather than letting the user navigate to
// an endpoint that would have failed downstream anyway.
chatRouter.use(async (_req, _res, next) => {
  try {
    await assertEnterpriseLicense("ai");
    next();
  } catch (err) {
    next(err);
  }
});

// ── Tunables ──────────────────────────────────────────────────────
//
// Bounded user input so a single turn can't blow the model context
// budget. We trim to the first MAX_USER_TURN_CHARS bytes before
// scrubbing — the scrubber is O(n) so this is mostly a safety belt.
const MAX_USER_TURN_CHARS = 4_000;

const RATE_LIMIT_TURNS = { capacity: 30, refillMs: 2_000 };
const RATE_LIMIT_EXTRACT = { capacity: 30, refillMs: 2_000 };

// SSE proposals stream tunables.
//
// The stream is push-driven via Postgres LISTEN/NOTIFY (see
// db/pg-listener.ts). The "safety refresh" is a low-frequency
// fallback that fires only if no NOTIFY has arrived in the last
// PROPOSAL_STREAM_SAFETY_REFRESH_MS — it heals the (rare) case
// where a notification was missed because the listener was
// disconnected at the exact instant of the COMMIT.
const PROPOSAL_STREAM_SAFETY_REFRESH_MS = 60_000;
const PROPOSAL_STREAM_MAX_AGE_MS = 60 * 60 * 1000;

// Zod schemas
const idParams = z.object({ id: z.string().min(1) });

// Recognised focus-record kinds for page-aware chat. Mirrors
// PageRecordKind in grounding.ts; keep both in sync when extending.
const pageRecordKindSchema = z.enum(["risk", "policy", "vendor", "control", "framework"]);

const pageContextSchema = z
  .object({
    path: z.string().min(1).max(500),
    title: z.string().min(1).max(300).nullish(),
    recordKind: pageRecordKindSchema.nullish(),
    recordId: z.string().min(1).max(200).nullish(),
  })
  .strict();

const turnBody = z.object({
  message: z.string().min(1).max(MAX_USER_TURN_CHARS),
  pageContext: pageContextSchema.optional(),
});
const conversationCreateBody = z.object({
  title: z.string().min(1).max(200).optional(),
});
const conversationUpdateBody = z.object({
  title: z.string().min(1).max(200).optional(),
  archive: z.boolean().optional(),
});

// ── GET /conversations ────────────────────────────────────────────
chatRouter.get("/conversations", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);

    const query = z.object({ includeArchived: z.coerce.boolean().optional() }).parse(req.query);

    const rows = await db.conversation.findMany({
      where: {
        ...(query.includeArchived ? {} : { archivedAt: null }),
        // Conversations are personal — only the creator sees them in
        // their list. Admins can still query the table for incident
        // review via the regular DB tooling.
        createdBy: userId,
      },
      orderBy: [{ updatedAt: "desc" }],
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /conversations ───────────────────────────────────────────
chatRouter.post("/conversations", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);

    const body = conversationCreateBody.parse(req.body);

    const created = await db.conversation.create({
      data: {
        // tenantId is also injected by prismaWithTenant; we list
        // it explicitly to satisfy Prisma's typed CreateInput.
        tenantId,
        title: body.title ?? null,
        createdBy: userId,
      },
    });

    await audit(req, "create", "ChatAIConversation", created.id, {
      title: body.title ?? null,
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
});

// ── PATCH /conversations/:id ──────────────────────────────────────
chatRouter.patch("/conversations/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const { id } = idParams.parse(req.params);
    const body = conversationUpdateBody.parse(req.body);

    const existing = await db.conversation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    const updated = await db.conversation.update({
      where: { id },
      data: {
        title: body.title ?? existing.title,
        archivedAt:
          body.archive === true ? new Date() : body.archive === false ? null : existing.archivedAt,
      },
    });

    await audit(req, "update", "ChatAIConversation", id, {
      title: body.title,
      archive: body.archive,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /conversations/:id ─────────────────────────────────────
chatRouter.delete("/conversations/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const { id } = idParams.parse(req.params);

    const existing = await db.conversation.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    // Cascade defined on the schema deletes Messages with the
    // conversation. We log first because the audit row references
    // an id that's about to disappear.
    await audit(req, "delete", "ChatAIConversation", id);
    await db.conversation.delete({ where: { id } });

    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

// ── GET /conversations/:id/messages ───────────────────────────────
chatRouter.get("/conversations/:id/messages", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const { id } = idParams.parse(req.params);

    const rows = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// ── POST /conversations/:id/turn — non-streaming ──────────────────
chatRouter.post("/conversations/:id/turn", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);
    const { id: conversationId } = idParams.parse(req.params);
    const body = turnBody.parse(req.body);

    if (!consumeToken(tenantId, "chat_assistant", RATE_LIMIT_TURNS)) {
      return res.status(429).json({
        success: false,
        error: "Too many chat turns. Please wait a moment and try again.",
      });
    }

    const existing = await db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    const result = await runChatTurn({
      tenantId,
      userId,
      conversationId,
      rawMessage: body.message,
      pageContext: body.pageContext ?? null,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ── POST /conversations/:id/turn/stream — SSE ─────────────────────
//
// Streams two SSE event types:
//   event: token        data: { delta }                   (best-effort token bundles)
//   event: complete     data: { messageId, citations, modelUsed, providerSource, groundingHash }
//   event: proposals    data: { messageId, proposals[] }  (when extraction finishes)
//   event: error        data: { error }
//
// We don't get true token streaming from every provider yet — the AIProvider
// chat() interface returns a complete result. So today we emit a single
// `token` event with the full delta and then `complete`. The contract is
// designed so a future incremental implementation requires no client
// changes.
chatRouter.post("/conversations/:id/turn/stream", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const db = prismaWithTenant(tenantId);
    const { id: conversationId } = idParams.parse(req.params);
    const body = turnBody.parse(req.body);

    if (!consumeToken(tenantId, "chat_assistant", RATE_LIMIT_TURNS)) {
      return res.status(429).json({
        success: false,
        error: "Too many chat turns. Please wait a moment and try again.",
      });
    }

    const existing = await db.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!existing) {
      return res.status(404).json({ success: false, error: "Conversation not found" });
    }

    openSSE(res);

    try {
      const result = await runChatTurn({
        tenantId,
        userId,
        conversationId,
        rawMessage: body.message,
        pageContext: body.pageContext ?? null,
      });

      sseEvent(res, "token", { delta: result.assistantMessage.content });
      sseEvent(res, "complete", {
        messageId: result.assistantMessage.id,
        citations: result.assistantMessage.citations,
        modelUsed: result.assistantMessage.modelUsed,
        providerSource: result.assistantMessage.providerSource,
        groundingHash: result.assistantMessage.groundingHash,
      });
      if (result.proposalIds.length > 0) {
        sseEvent(res, "proposals", {
          messageId: result.assistantMessage.id,
          proposalIds: result.proposalIds,
        });
      }
    } catch (err) {
      sseEvent(res, "error", {
        error: err instanceof Error ? err.message : "Chat turn failed",
      });
    } finally {
      res.end();
    }
  } catch (err) {
    next(err);
  }
});

// ── GET /proposals/stream — SSE ───────────────────────────────────
//
// Long-lived stream that pushes new pending proposals to the chat UI
// without it polling. We poll Postgres every PROPOSAL_STREAM_POLL_MS
// (cheap because of the (tenantId, status) index). Every event:
//
//   event: proposals    data: { proposals: TenantContextProposal[] }
//
// Replaces (rather than appends to) the client's pending list, so a
// missed event is naturally healed by the next tick.
chatRouter.get("/proposals/stream", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    openSSE(res);

    let closed = false;
    let inFlight = false;

    const fetchAndSend = async () => {
      if (closed) return;
      // Coalesce overlapping fetches — a burst of NOTIFYs shouldn't
      // turn into a burst of identical findMany queries.
      if (inFlight) return;
      inFlight = true;
      try {
        const proposals = await db.tenantContextProposal.findMany({
          where: {
            status: "pending",
            createdAt: { gte: new Date(Date.now() - PROPOSAL_STREAM_MAX_AGE_MS) },
          },
          orderBy: { createdAt: "desc" },
          take: 100,
        });
        if (!closed) sseEvent(res, "proposals", { proposals });
      } catch (err) {
        if (!closed) {
          sseEvent(res, "error", {
            error: err instanceof Error ? err.message : "Failed to fetch proposals",
          });
        }
      } finally {
        inFlight = false;
      }
    };

    // Push-driven update path: any create/accept/reject anywhere in
    // the cluster fires a NOTIFY, which lands here and triggers a
    // refresh for this org's open streams only.
    const unsubscribe = subscribeProposalChanged(tenantId, () => {
      void fetchAndSend();
    });

    // Backstop: if a NOTIFY was missed during a listener reconnect,
    // this catches up within a minute. Cheap compared to the
    // original 3-second poll.
    const safetyTimer = setInterval(() => {
      void fetchAndSend();
    }, PROPOSAL_STREAM_SAFETY_REFRESH_MS);

    req.on("close", () => {
      closed = true;
      unsubscribe();
      clearInterval(safetyTimer);
    });

    // Initial snapshot so the UI hydrates without waiting for the
    // first NOTIFY or safety tick.
    await fetchAndSend();
  } catch (err) {
    next(err);
  }
});

// ── runChatTurn ───────────────────────────────────────────────────
//
// The single entry point used by both the JSON `turn` endpoint and the
// SSE stream endpoint. Sequence:
//
//   1. Persist the user message (raw text) for transcript fidelity.
//   2. Build the grounding bundle from tenant data.
//   3. PII-scrub the user's text and call the chat LLM.
//   4. Validate the JSON envelope + drop hallucinated citations.
//   5. Persist the assistant message with groundingHash + citations.
//   6. Kick off the proposal extractor in parallel — never block the
//      assistant reply on extraction.
//   7. Audit both the suggestion and (later) the parallel extraction.
async function runChatTurn(params: {
  tenantId: string;
  userId: string;
  conversationId: string;
  rawMessage: string;
  pageContext: PageContext | null;
}): Promise<{
  userMessage: PersistedMessage;
  assistantMessage: PersistedMessage;
  proposalIds: string[];
}> {
  const { tenantId, userId, conversationId, rawMessage, pageContext } = params;
  const db = prismaWithTenant(tenantId);

  // Persist the user turn first — even if the LLM fails, the transcript
  // remains intact for the user to retry.
  const userMessage = await db.message.create({
    data: {
      tenantId,
      conversationId,
      role: "user",
      content: rawMessage,
    },
  });

  const bundle = await buildGroundingBundle({
    tenantId,
    conversationId,
    pageContext,
  });
  const scrubbed = scrubPii(rawMessage);
  const ai = await resolveOrgAI(tenantId, "chat_assistant");

  const systemPrompt = buildChatSystemPrompt({ bundle });

  // The LLM gets the scrubbed text only. Transcript persistence above
  // still has the original (the user's own input — they consented to
  // entering it; PII redaction is for outbound-to-third-party only).
  const completion = await ai.client.chat({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: scrubbed.text },
    ],
    temperature: 0.2,
    responseFormat: "json",
  });

  const envelope = parseAssistantEnvelope(completion.content);
  const answer = envelope?.answer ?? FALLBACK_ANSWER;
  const validCitations: Citation[] = envelope
    ? filterValidCitations(bundle, envelope.citations)
    : [];

  // Bump conversation.updatedAt so the list re-orders by recency, and
  // persist a derived title from the first user turn when the user
  // didn't set one.
  const conv = await db.conversation.findUnique({
    where: { id: conversationId },
    select: { title: true },
  });
  const derivedTitle = conv?.title ?? deriveTitleFromTurn(rawMessage);

  const assistantMessage = await db.message.create({
    data: {
      tenantId,
      conversationId,
      role: "assistant",
      content: answer,
      modelUsed: ai.model,
      providerSource: ai.source,
      groundingHash: bundle.groundingHash,
      citations: validCitations as unknown as object,
    },
  });

  if (derivedTitle && derivedTitle !== conv?.title) {
    await db.conversation.update({
      where: { id: conversationId },
      data: { title: derivedTitle },
    });
  } else {
    // No-op write to bump updatedAt for sort order.
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  await audit(
    { auth: { tenantId, userId } } as never,
    "create",
    "ChatAIAssistantTurn",
    assistantMessage.id,
    {
      conversationId,
      modelUsed: ai.model,
      providerSource: ai.source,
      groundingHash: bundle.groundingHash,
      citationCount: validCitations.length,
      droppedCitations: envelope
        ? Math.max(0, envelope.citations.length - validCitations.length)
        : 0,
      redactions: scrubbed.redactions,
      envelopeParsed: envelope !== null,
      pageContext: pageContext
        ? {
            path: pageContext.path,
            recordKind: pageContext.recordKind ?? null,
            recordId: pageContext.recordId ?? null,
          }
        : null,
    },
  );

  // Parallel extraction — fire and forget, but capture the proposal
  // ids so the SSE stream can push them and the assistant message can
  // store them for deep-linking.
  const proposalIds: string[] = [];
  if (consumeToken(tenantId, "context_extraction", RATE_LIMIT_EXTRACT)) {
    try {
      const extractAi = await resolveOrgAI(tenantId, "context_extraction");
      const existingContext: ExistingContextRef[] = bundle.contexts.map((c) => ({
        id: c.id,
        category: c.category as ExistingContextRef["category"],
        question: c.question,
      }));
      const result = await extractContextProposals(extractAi.client, {
        text: scrubbed.text,
        existingContext,
      });
      const created = await Promise.all(
        result.proposals.map((p) =>
          db.tenantContextProposal.create({
            data: {
              tenantId,
              kind: "chat",
              category: p.category,
              question: p.question,
              answer: p.answer,
              confidence: p.confidence,
              rationale: p.rationale ?? null,
              supersedesContextId: p.supersedesContextId ?? null,
              provenance: {
                kind: "chat",
                conversationId,
                userMessageId: userMessage.id,
                assistantMessageId: assistantMessage.id,
                modelUsed: extractAi.model,
                providerSource: extractAi.source,
                redactions: result.redactions,
                submittedBy: userId,
              },
            },
          }),
        ),
      );
      for (const p of created) proposalIds.push(p.id);

      if (proposalIds.length > 0) {
        await db.message.update({
          where: { id: assistantMessage.id },
          data: { proposalIds },
        });
        // Push the new proposals to any /proposals/stream SSE
        // subscribers across the cluster. Fire-and-forget: a notify
        // failure must never break the chat turn — the SSE safety
        // refresh will pick the change up within ~60s.
        void notifyProposalChanged(tenantId, "created");
        await audit(
          { auth: { tenantId, userId } } as never,
          "create",
          "OrganizationContextAIProposal",
          undefined,
          {
            kind: "chat",
            count: proposalIds.length,
            dropped: result.dropped,
            redactions: result.redactions,
            modelUsed: extractAi.model,
            providerSource: extractAi.source,
            conversationId,
            assistantMessageId: assistantMessage.id,
          },
        );
      }
    } catch (err) {
      // Extraction failure is non-fatal — the user still gets their
      // assistant reply. Log so ops can spot a regression.

      console.warn("[chat] parallel extraction failed", {
        conversationId,
        tenantId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return {
    userMessage,
    assistantMessage: { ...assistantMessage, proposalIds },
    proposalIds,
  };
}

// ── Helpers ───────────────────────────────────────────────────────

interface PersistedMessage {
  id: string;
  conversationId: string;
  tenantId: string;
  role: string;
  content: string;
  modelUsed: string | null;
  providerSource: string | null;
  groundingHash: string | null;
  citations: unknown;
  proposalIds: string[];
  createdAt: Date;
}

const FALLBACK_ANSWER =
  "I wasn't able to produce a structured answer this time. Please retry — if it keeps happening, an admin can check the AI provider configuration in Settings.";

function deriveTitleFromTurn(text: string): string {
  // First non-empty line, truncated to ~80 chars. Good enough for a
  // human-readable conversation list label without an extra LLM call.
  const firstLine = text.trim().split(/\r?\n/)[0]?.trim() ?? "";
  if (!firstLine) return "Untitled chat";
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}…` : firstLine;
}

function openSSE(res: Response): void {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
}

function sseEvent(res: Response, event: string, data: unknown): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
  // Best-effort flush — Express types don't expose .flush, but the
  // underlying socket has it when no compression middleware is in front.
  (res as unknown as { flush?: () => void }).flush?.();
}
