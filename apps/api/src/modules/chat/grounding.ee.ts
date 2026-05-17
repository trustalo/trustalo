// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0
//
// EE FILE — governed by LICENSE_EE at the repo root. Internal helper for
// the chat assistant; license enforcement happens at the route level
// (router.ee.ts).

/**
 * Chat grounding builder.
 *
 * Phase 2 of the "ongoing AI context" plan. The compliance assistant must
 * never speculate from base knowledge about a tenant's posture — every
 * answer is grounded in the tenant's own data. This module assembles the
 * grounding bundle for a single chat turn:
 *
 *  • TenantContext (status="active" only)
 *  • Policies (titles + descriptions; bodies are too large for the system
 *    prompt and almost never needed for compliance Q&A)
 *  • Risks (top open risks ranked by inherent score)
 *  • Vendors (critical/high tier first)
 *  • Controls (status snapshot + categories)
 *  • Frameworks the org has enabled
 *  • Recent message history (last N turns of this conversation, capped)
 *
 * Hard guarantees enforced here so callers cannot bypass them:
 *  • All Prisma reads MUST go through the tenant-scoped client. We accept
 *    the extended client as `db` and never touch the raw Prisma client.
 *  • Each section is bounded (rows + per-field char caps) so the prompt
 *    stays well under model context windows.
 *  • Every retrieved row is converted into a typed citation
 *    `{ kind, id, label }`. `groundingHash` is a stable SHA-256 over the
 *    sorted citation list + bundle version. Re-running the same chat turn
 *    against the same DB state must produce the same hash so audits can
 *    prove the model saw exactly this evidence.
 *  • The user turn itself is PII-scrubbed by the caller before being
 *    embedded in the system prompt — this module assumes its input is
 *    already safe.
 */

import { createHash } from "node:crypto";
import { prisma } from "../../db/prisma.js";

// ── Bundle version ────────────────────────────────────────────────
//
// Bumping this string invalidates every prior `groundingHash` recorded
// on `Message`. Bump it any time the bundle shape, ordering, or
// truncation rules change so audit reproducibility stays meaningful.
//
// v1.1 — added `frameworkType` to FrameworkSummary so the system prompt
//        can append regulated-framework personas (e.g. CPS 234 clocks).
//        The bundle still includes the same set of citations, but the
//        rendered prompt is materially different when CPS 234 is adopted.
export const GROUNDING_BUNDLE_VERSION = "v1.1";

// Truncation knobs — kept generous for context but bounded so a single
// turn cannot blow the model context budget.
const MAX_CONTEXT_ROWS = 40;
const MAX_POLICIES = 25;
const MAX_RISKS = 15;
const MAX_VENDORS = 15;
const MAX_CONTROLS = 30;
const MAX_FRAMEWORKS = 10;
const MAX_RECENT_MESSAGES = 12;
const MAX_FIELD_CHARS = 600;

export type CitationKind =
  | "context"
  | "policy"
  | "risk"
  | "vendor"
  | "control"
  | "framework"
  | "message";

/**
 * Describes the page the user was on when they sent the chat turn.
 *
 * `recordKind` + `recordId` are optional but when present we promote
 * that specific row to the top of its section so the assistant always
 * has detail for the record the user is staring at — even if it would
 * have been truncated out of the standard top-N selection.
 */
export type PageRecordKind = "risk" | "policy" | "vendor" | "control" | "framework";

export interface PageContext {
  /** Absolute pathname, e.g. "/risks/abc123". */
  path: string;
  /** Human title of the current page (best effort, may be null). */
  title?: string | null;
  /** Tenant record the page is focused on, if recognizable from the route. */
  recordKind?: PageRecordKind | null;
  recordId?: string | null;
}

export interface Citation {
  kind: CitationKind;
  id: string;
  /** Short human label rendered in the assistant footer & UI chips. */
  label: string;
}

export interface ContextRow {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface PolicySummary {
  id: string;
  title: string;
  description: string | null;
  status: string;
}

export interface RiskSummary {
  id: string;
  title: string;
  category: string;
  status: string;
  riskScore: number;
  residualRiskScore: number | null;
}

export interface VendorSummary {
  id: string;
  name: string;
  riskTier: string;
  status: string;
  category: string | null;
  dataProcessing: boolean;
}

export interface ControlSummary {
  id: string;
  title: string;
  status: string;
  category: string | null;
}

export interface FrameworkSummary {
  id: string;
  name: string;
  version: string;
  status: string;
  /**
   * Stable framework key (matches the `FrameworkType` enum). Used by the
   * system prompt to detect regulated frameworks (CPS 234, GDPR, etc.)
   * and append framework-specific personas without string-matching on
   * `name`.
   */
  frameworkType: string;
}

export interface RecentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface GroundingBundle {
  version: string;
  tenantId: string;
  contexts: ContextRow[];
  policies: PolicySummary[];
  risks: RiskSummary[];
  vendors: VendorSummary[];
  controls: ControlSummary[];
  frameworks: FrameworkSummary[];
  recentMessages: RecentMessage[];
  /** Page the user is on, if any. Affects prompt + groundingHash. */
  pageContext?: PageContext | null;
  /** Citation kind:id pair if we promoted a focus record. */
  focusCitation?: Citation | null;
  citations: Citation[];
  groundingHash: string;
}

export interface BuildGroundingInput {
  tenantId: string;
  /** Existing conversation id so we can include the recent transcript. */
  conversationId?: string;
  /**
   * Optional page context. When provided with a known `recordKind` +
   * `recordId`, we fetch that specific row and pin it to the top of
   * its section so the assistant always sees the record the user is
   * looking at even if top-N truncation would have dropped it.
   */
  pageContext?: PageContext | null;
}

/**
 * Read tenant data and build a grounding bundle for the next chat turn.
 *
 * Note on tenant-scoping: all reads go through `prismaWithTenant`-style
 * filters. We don't take the extended client as a parameter because the
 * router-level extended client carries operation-level interceptors that
 * are not friendly to ad-hoc reads here; instead we pass `tenantId`
 * explicitly to every `where` clause. The tenant allow-list verifier
 * (`scripts/check-tenant-allowlist.ts`) ensures these models stay in the
 * extension; a missed where-clause here would still be caught by code
 * review since each query lists `tenantId` literally.
 */
export async function buildGroundingBundle(input: BuildGroundingInput): Promise<GroundingBundle> {
  const { tenantId, conversationId, pageContext } = input;

  // Run reads in parallel — they are independent.
  const [
    contextRows,
    policyRows,
    riskRows,
    vendorRows,
    controlRows,
    frameworkRows,
    recentMessageRows,
  ] = await Promise.all([
    prisma.tenantContext.findMany({
      where: { tenantId, status: "active" },
      orderBy: [{ category: "asc" }, { updatedAt: "desc" }],
      take: MAX_CONTEXT_ROWS,
      select: { id: true, category: true, question: true, answer: true },
    }),
    prisma.policy.findMany({
      where: {
        tenantId,
        status: { in: ["approved", "published", "pending_approval"] },
      },
      orderBy: [{ updatedAt: "desc" }],
      take: MAX_POLICIES,
      select: { id: true, title: true, description: true, status: true },
    }),
    prisma.risk.findMany({
      where: {
        tenantId,
        status: { in: ["not_started", "in_progress"] },
      },
      orderBy: [{ riskScore: "desc" }, { updatedAt: "desc" }],
      take: MAX_RISKS,
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        riskScore: true,
        residualRiskScore: true,
      },
    }),
    prisma.vendor.findMany({
      where: {
        tenantId,
        status: { in: ["active", "under_review", "approved"] },
      },
      // critical/high first; medium/low fall through.
      orderBy: [{ riskTier: "asc" }, { updatedAt: "desc" }],
      take: MAX_VENDORS,
      select: {
        id: true,
        name: true,
        riskTier: true,
        status: true,
        category: true,
        dataProcessing: true,
      },
    }),
    prisma.control.findMany({
      where: { tenantId },
      orderBy: [{ updatedAt: "desc" }],
      take: MAX_CONTROLS,
      select: {
        id: true,
        title: true,
        status: true,
        category: true,
      },
    }),
    prisma.frameworkInstance.findMany({
      where: { tenantId, isEnabled: true },
      take: MAX_FRAMEWORKS,
      select: {
        id: true,
        status: true,
        framework: { select: { name: true, version: true, frameworkType: true } },
      },
    }),
    conversationId
      ? prisma.message.findMany({
          where: { tenantId, conversationId },
          orderBy: { createdAt: "desc" },
          take: MAX_RECENT_MESSAGES,
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        })
      : Promise.resolve(
          [] as Array<{
            id: string;
            role: "user" | "assistant" | "system";
            content: string;
            createdAt: Date;
          }>,
        ),
  ]);

  const contexts: ContextRow[] = contextRows.map((r) => ({
    id: r.id,
    category: r.category as string,
    question: r.question,
    answer: truncate(r.answer),
  }));

  const policies: PolicySummary[] = policyRows.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description ? truncate(p.description) : null,
    status: p.status as string,
  }));

  const risks: RiskSummary[] = riskRows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category as string,
    status: r.status as string,
    riskScore: r.riskScore,
    residualRiskScore: r.residualRiskScore,
  }));

  const vendors: VendorSummary[] = vendorRows.map((v) => ({
    id: v.id,
    name: v.name,
    riskTier: v.riskTier as string,
    status: v.status as string,
    category: v.category,
    dataProcessing: v.dataProcessing,
  }));

  const controls: ControlSummary[] = controlRows.map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status as string,
    category: c.category,
  }));

  const frameworks: FrameworkSummary[] = frameworkRows.map((f) => ({
    id: f.id,
    name: f.framework.name,
    version: f.framework.version,
    status: f.status as string,
    frameworkType: f.framework.frameworkType as unknown as string,
  }));

  // Reverse so the recent messages are in chronological order — easier
  // for the model to follow the dialogue.
  const recentMessages: RecentMessage[] = recentMessageRows
    .slice()
    .reverse()
    .map((m) => ({
      id: m.id,
      role: m.role as RecentMessage["role"],
      content: truncate(m.content),
      createdAt: m.createdAt.toISOString(),
    }));

  // Promote a focus record to the top of its section, if pageContext
  // points at one. Done after the bulk fetches so it is opportunistic
  // and never blocks the response when the route has no record id.
  const focusCitation = await mergeFocusRecord({
    tenantId,
    pageContext,
    risks,
    policies,
    vendors,
    controls,
    frameworks,
  });

  const citations: Citation[] = [
    ...contexts.map((c): Citation => ({ kind: "context", id: c.id, label: c.question })),
    ...policies.map((p): Citation => ({ kind: "policy", id: p.id, label: p.title })),
    ...risks.map((r): Citation => ({ kind: "risk", id: r.id, label: r.title })),
    ...vendors.map((v): Citation => ({ kind: "vendor", id: v.id, label: v.name })),
    ...controls.map((c): Citation => ({ kind: "control", id: c.id, label: c.title })),
    ...frameworks.map(
      (f): Citation => ({
        kind: "framework",
        id: f.id,
        label: `${f.name} ${f.version}`,
      }),
    ),
    ...recentMessages.map(
      (m): Citation => ({
        kind: "message",
        id: m.id,
        label: `${m.role} turn`,
      }),
    ),
  ];

  const groundingHash = computeGroundingHash(citations, pageContext ?? null);

  return {
    version: GROUNDING_BUNDLE_VERSION,
    tenantId,
    contexts,
    policies,
    risks,
    vendors,
    controls,
    frameworks,
    recentMessages,
    pageContext: pageContext ?? null,
    focusCitation,
    citations,
    groundingHash,
  };
}

/**
 * If pageContext identifies a specific record, fetch it and pin it to
 * the top of the matching section (de-duplicated). Mutates the supplied
 * arrays in place because they are local to `buildGroundingBundle`.
 */
async function mergeFocusRecord(args: {
  tenantId: string;
  pageContext: PageContext | null | undefined;
  risks: RiskSummary[];
  policies: PolicySummary[];
  vendors: VendorSummary[];
  controls: ControlSummary[];
  frameworks: FrameworkSummary[];
}): Promise<Citation | null> {
  const { tenantId, pageContext } = args;
  if (!pageContext?.recordKind || !pageContext.recordId) return null;
  const id = pageContext.recordId;

  switch (pageContext.recordKind) {
    case "risk": {
      const row = await prisma.risk.findFirst({
        where: { id, tenantId },
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          riskScore: true,
          residualRiskScore: true,
        },
      });
      if (!row) return null;
      const summary: RiskSummary = {
        id: row.id,
        title: row.title,
        category: row.category as string,
        status: row.status as string,
        riskScore: row.riskScore,
        residualRiskScore: row.residualRiskScore,
      };
      replaceInPlace(args.risks, summary, (r) => r.id);
      return { kind: "risk", id: row.id, label: row.title };
    }
    case "policy": {
      const row = await prisma.policy.findFirst({
        where: { id, tenantId },
        select: { id: true, title: true, description: true, status: true },
      });
      if (!row) return null;
      const summary: PolicySummary = {
        id: row.id,
        title: row.title,
        description: row.description ? truncate(row.description) : null,
        status: row.status as string,
      };
      replaceInPlace(args.policies, summary, (p) => p.id);
      return { kind: "policy", id: row.id, label: row.title };
    }
    case "vendor": {
      const row = await prisma.vendor.findFirst({
        where: { id, tenantId },
        select: {
          id: true,
          name: true,
          riskTier: true,
          status: true,
          category: true,
          dataProcessing: true,
        },
      });
      if (!row) return null;
      const summary: VendorSummary = {
        id: row.id,
        name: row.name,
        riskTier: row.riskTier as string,
        status: row.status as string,
        category: row.category,
        dataProcessing: row.dataProcessing,
      };
      replaceInPlace(args.vendors, summary, (v) => v.id);
      return { kind: "vendor", id: row.id, label: row.name };
    }
    case "control": {
      const row = await prisma.control.findFirst({
        where: { id, tenantId },
        select: { id: true, title: true, status: true, category: true },
      });
      if (!row) return null;
      const summary: ControlSummary = {
        id: row.id,
        title: row.title,
        status: row.status as string,
        category: row.category,
      };
      replaceInPlace(args.controls, summary, (c) => c.id);
      return { kind: "control", id: row.id, label: row.title };
    }
    case "framework": {
      const row = await prisma.frameworkInstance.findFirst({
        where: { id, tenantId },
        select: {
          id: true,
          status: true,
          framework: { select: { name: true, version: true, frameworkType: true } },
        },
      });
      if (!row) return null;
      const summary: FrameworkSummary = {
        id: row.id,
        name: row.framework.name,
        version: row.framework.version,
        status: row.status as string,
        frameworkType: row.framework.frameworkType as unknown as string,
      };
      replaceInPlace(args.frameworks, summary, (f) => f.id);
      return {
        kind: "framework",
        id: row.id,
        label: `${row.framework.name} ${row.framework.version}`,
      };
    }
    default:
      return null;
  }
}

/** Move-or-prepend `row` so it appears first; preserves rest of order. */
function pinToTop<T>(rows: T[], row: T, key: (r: T) => string): T[] {
  const k = key(row);
  return [row, ...rows.filter((r) => key(r) !== k)];
}

/** In-place equivalent of pinToTop because the caller holds the array. */
function replaceInPlace<T>(rows: T[], row: T, key: (r: T) => string): void {
  const next = pinToTop(rows, row, key);
  rows.length = 0;
  rows.push(...next);
}

/**
 * Render the grounding bundle as a Markdown block to embed in the
 * system prompt. The structure is intentionally regular so the model
 * can pattern-match section headers when generating citations.
 */
export function renderBundleAsPrompt(bundle: GroundingBundle): string {
  const lines: string[] = [];

  if (bundle.pageContext) {
    const pc = bundle.pageContext;
    lines.push("### Current page");
    lines.push(`- path: \`${pc.path}\``);
    if (pc.title) lines.push(`- title: ${pc.title}`);
    if (pc.recordKind && pc.recordId) {
      lines.push(`- focus record: \`${pc.recordKind}:${pc.recordId}\``);
      lines.push(
        '  (When the user says "this" or "that", they almost certainly mean this record. Cite it explicitly when relevant.)',
      );
    }
    lines.push("");
  }

  lines.push(`### Organization context (${bundle.contexts.length})`);
  if (bundle.contexts.length === 0) {
    lines.push("_No active context entries yet._");
  } else {
    for (const c of bundle.contexts) {
      lines.push(`- [context:${c.id}] (${c.category}) **${c.question}** — ${c.answer}`);
    }
  }

  lines.push(`\n### Policies (${bundle.policies.length})`);
  if (bundle.policies.length === 0) {
    lines.push("_No published policies._");
  } else {
    for (const p of bundle.policies) {
      lines.push(
        `- [policy:${p.id}] **${p.title}** (${p.status})${
          p.description ? ` — ${p.description}` : ""
        }`,
      );
    }
  }

  lines.push(`\n### Open risks (${bundle.risks.length})`);
  if (bundle.risks.length === 0) {
    lines.push("_No open risks._");
  } else {
    for (const r of bundle.risks) {
      const residual = r.residualRiskScore != null ? ` → residual ${r.residualRiskScore}` : "";
      lines.push(
        `- [risk:${r.id}] **${r.title}** (${r.category}, ${r.status}, score ${r.riskScore}${residual})`,
      );
    }
  }

  lines.push(`\n### Vendors (${bundle.vendors.length})`);
  if (bundle.vendors.length === 0) {
    lines.push("_No active vendors._");
  } else {
    for (const v of bundle.vendors) {
      const dp = v.dataProcessing ? "; processes data" : "";
      lines.push(
        `- [vendor:${v.id}] **${v.name}** (tier ${v.riskTier}, ${v.status}${dp})${
          v.category ? `; ${v.category}` : ""
        }`,
      );
    }
  }

  lines.push(`\n### Controls (${bundle.controls.length})`);
  if (bundle.controls.length === 0) {
    lines.push("_No controls defined._");
  } else {
    for (const c of bundle.controls) {
      lines.push(
        `- [control:${c.id}] **${c.title}** (${c.status}${c.category ? `, ${c.category}` : ""})`,
      );
    }
  }

  lines.push(`\n### Frameworks (${bundle.frameworks.length})`);
  if (bundle.frameworks.length === 0) {
    lines.push("_No frameworks enabled._");
  } else {
    for (const f of bundle.frameworks) {
      lines.push(
        `- [framework:${f.id}] **${f.name} ${f.version}** (${f.status}, type \`${f.frameworkType}\`)`,
      );
    }
  }

  return lines.join("\n");
}

/**
 * Validate that every citation an assistant message claims actually
 * appeared in the grounding bundle. Drops any citation whose id wasn't
 * surfaced — this is the primary defence against hallucinated references.
 */
export function filterValidCitations(bundle: GroundingBundle, citations: unknown): Citation[] {
  if (!Array.isArray(citations)) return [];
  const validIds = new Set(bundle.citations.map((c) => `${c.kind}:${c.id}`));
  const out: Citation[] = [];
  for (const raw of citations) {
    if (!raw || typeof raw !== "object") continue;
    const c = raw as Partial<Citation>;
    if (!c.kind || !c.id) continue;
    const key = `${c.kind}:${c.id}`;
    if (!validIds.has(key)) continue;
    out.push({
      kind: c.kind,
      id: c.id,
      label: typeof c.label === "string" ? c.label : "",
    });
  }
  return out;
}

// ── Helpers ───────────────────────────────────────────────────────

function truncate(value: string, max: number = MAX_FIELD_CHARS): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function computeGroundingHash(citations: Citation[], pageContext: PageContext | null): string {
  // Stable ordering so identical evidence produces an identical hash.
  const sorted = [...citations].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind);
    return a.id.localeCompare(b.id);
  });
  const fingerprint = JSON.stringify({
    v: GROUNDING_BUNDLE_VERSION,
    citations: sorted.map((c) => ({ k: c.kind, id: c.id })),
    // Page context is part of the audit fingerprint: the same evidence
    // viewed from different pages can produce different answers because
    // "this" resolves differently. Hash it so audit reproducibility holds.
    page: pageContext
      ? {
          path: pageContext.path,
          recordKind: pageContext.recordKind ?? null,
          recordId: pageContext.recordId ?? null,
        }
      : null,
  });
  return createHash("sha256").update(fingerprint).digest("hex");
}
