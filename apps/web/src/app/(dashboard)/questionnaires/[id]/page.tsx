/**
 * Phase 6 (AI accelerators): questionnaire detail / review page.
 *
 * The reviewer's working surface. The page now adapts to the document
 * structure produced by the import-time structure agent:
 *
 *   • Tabs across the top — one per sheet/page in the original file.
 *     Cover/Instructions tabs surface their facts as a small card;
 *     question_table and matrix tabs render the questions.
 *   • Inside each tab, questions are grouped by Domain → Sub-Domain
 *     using the agent-extracted `contextLabels`. Sub-questions are
 *     nested visually under their parent (matching the layout in the
 *     customer's original workbook).
 *   • Each question card shows its full context (control id, evidence
 *     requirement, matrix column) so the reviewer doesn't have to
 *     cross-reference the source file.
 *
 * Bulk "AI answer all" and round-trip export controls remain in the
 * top header.
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  apiClient,
  type AnswerStatus,
  type QuestionnaireDetail,
  type QuestionnaireExportFormat,
  type QuestionnaireExportInclude,
  type QuestionnaireQuestion,
  type QuestionnaireSheet,
  type QuestionnaireSourceFormat,
} from "@/lib/api-client";
import {
  isEnterpriseLicenseError,
  useEnterpriseGated,
  useEnterpriseToast,
} from "@/lib/enterprise-license";
import { EnterpriseRequiredBanner } from "@/components/ai/enterprise-required-banner";

const STATUS_TINT: Record<AnswerStatus, string> = {
  pending: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  draft: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const STATUS_LABEL: Record<AnswerStatus, string> = {
  pending: "Pending",
  draft: "AI draft",
  approved: "Approved",
  rejected: "Rejected",
};

const SHEET_KIND_LABEL: Record<QuestionnaireSheet["kind"], string> = {
  metadata: "Cover",
  instructions: "Instructions",
  question_table: "Questions",
  matrix: "Matrix",
  csv: "Questions",
};

export default function QuestionnaireDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [data, setData] = useState<QuestionnaireDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    answered: number;
    total: number;
    failures: number;
  } | null>(null);
  const [perRowBusy, setPerRowBusy] = useState<Record<string, "regen" | "review" | null>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [exporting, setExporting] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const aiGated = useEnterpriseGated();
  const enterpriseToast = useEnterpriseToast();

  const refresh = useCallback(async () => {
    try {
      const res = await apiClient.getQuestionnaire(id);
      setData(res.data);
      const seeded: Record<string, string> = {};
      for (const q of res.data.questions) {
        seeded[q.id] = q.answers[0]?.content ?? "";
      }
      setDrafts(seeded);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questionnaire");
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Default to the first sheet that has questions; fall back to the
  // first sheet in document order so cover/instructions can still be
  // viewed.
  useEffect(() => {
    if (!data || activeSheet) return;
    const firstWithQuestions = data.sheets.find((s) => s.questionCount > 0);
    setActiveSheet((firstWithQuestions ?? data.sheets[0])?.sheetName ?? null);
  }, [data, activeSheet]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, approved: 0, draft: 0, pending: 0, rejected: 0 };
    let approved = 0,
      draft = 0,
      pending = 0,
      rejected = 0;
    for (const q of data.questions) {
      const a = q.answers[0];
      if (!a || a.status === "pending") pending++;
      else if (a.status === "draft") draft++;
      else if (a.status === "approved") approved++;
      else if (a.status === "rejected") rejected++;
    }
    return { total: data.questions.length, approved, draft, pending, rejected };
  }, [data]);

  async function handleAnswerAll() {
    if (aiGated) {
      enterpriseToast.show("AI questionnaire answering");
      return;
    }
    setBulkRunning(true);
    setBulkResult(null);
    try {
      const res = await apiClient.answerAllQuestionnaire(id);
      setBulkResult({
        answered: res.data.answered,
        total: res.data.total,
        failures: res.data.failures.length,
      });
      await refresh();
    } catch (err) {
      if (isEnterpriseLicenseError(err)) {
        enterpriseToast.show("AI questionnaire answering");
      } else {
        setError(err instanceof Error ? err.message : "Bulk answer failed");
      }
    } finally {
      setBulkRunning(false);
    }
  }

  async function handleRegenerate(qid: string) {
    if (aiGated) {
      enterpriseToast.show("AI questionnaire answering");
      return;
    }
    setPerRowBusy((s) => ({ ...s, [qid]: "regen" }));
    try {
      const res = await apiClient.generateAnswer(id, qid);
      setDrafts((s) => ({ ...s, [qid]: res.data.content }));
      await refresh();
    } catch (err) {
      if (isEnterpriseLicenseError(err)) {
        enterpriseToast.show("AI questionnaire answering");
      } else {
        setError(err instanceof Error ? err.message : "Failed to regenerate");
      }
    } finally {
      setPerRowBusy((s) => ({ ...s, [qid]: null }));
    }
  }

  async function handleReview(qid: string, status: "approved" | "rejected" | "draft") {
    setPerRowBusy((s) => ({ ...s, [qid]: "review" }));
    try {
      await apiClient.reviewAnswer(id, qid, {
        content: drafts[qid] ?? "",
        status,
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update answer");
    } finally {
      setPerRowBusy((s) => ({ ...s, [qid]: null }));
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <div className="p-6 text-sm text-neutral-500">{error ?? "Not found"}</div>;
  }

  // Always-rendered sheet list. Synthesize a single fallback sheet
  // for legacy questionnaires that pre-date the structure agent.
  const sheets: QuestionnaireSheet[] =
    data.sheets && data.sheets.length > 0
      ? data.sheets
      : [
          {
            sheetName: "Sheet 1",
            kind: "csv",
            questionCount: data.questions.length,
            facts: [],
          },
        ];

  const currentSheetName = activeSheet ?? sheets[0]?.sheetName ?? null;
  const currentSheet = sheets.find((s) => s.sheetName === currentSheetName) ?? sheets[0] ?? null;

  // Filter the question set down to the active sheet, then
  // build a parent → children tree for nested rendering.
  const sheetQuestions = currentSheet
    ? data.questions.filter((q) =>
        q.sourceSheetName
          ? q.sourceSheetName === currentSheet.sheetName
          : currentSheet.kind === "csv",
      )
    : [];

  const tree = buildQuestionTree(sheetQuestions);

  // Within a sheet, group ROOTS by Domain → Sub-Domain context for
  // visual hierarchy. Sub-questions stay nested under their parents.
  const groupedRoots = groupByDomain(tree.roots);

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/questionnaires"
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            ← Back to Questionnaires
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
            {data.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {data.requester ?? "—"} · {data.sourceFormat.toUpperCase()} · imported by{" "}
            {data.importedBy?.name ?? "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAnswerAll}
            disabled={bulkRunning}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bulkRunning ? "Generating…" : "AI answer unanswered"}
          </button>
          <ExportButtons
            disabled={exporting}
            sourceFormat={data.sourceFormat}
            roundTrippable={Boolean(data.roundTrippable)}
            onExport={async (format, include) => {
              setExporting(true);
              try {
                await apiClient.downloadQuestionnaire(id, data.name, format, include);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Export failed");
              } finally {
                setExporting(false);
              }
            }}
          />
        </div>
      </header>

      <EnterpriseRequiredBanner
        open={enterpriseToast.open}
        feature={enterpriseToast.feature}
        onClose={enterpriseToast.dismiss}
      />

      {bulkResult && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200">
          AI drafted {bulkResult.answered} of {bulkResult.total} new answers
          {bulkResult.failures > 0 && ` (${bulkResult.failures} failed)`}.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Stats tiles */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Tile label="Total" value={stats.total} />
        <Tile label="Approved" value={stats.approved} tint="green" />
        <Tile label="AI drafts" value={stats.draft} tint="blue" />
        <Tile label="Pending" value={stats.pending} tint="neutral" />
      </div>

      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800">
          {sheets.map((s) => {
            const active = s.sheetName === currentSheetName;
            return (
              <button
                key={s.sheetName}
                type="button"
                onClick={() => setActiveSheet(s.sheetName)}
                className={`rounded-t-md border-b-2 px-3 py-2 text-sm font-medium ${
                  active
                    ? "border-blue-600 text-blue-700 dark:text-blue-300"
                    : "border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                }`}
              >
                <span>{s.sheetName}</span>
                <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {SHEET_KIND_LABEL[s.kind]}
                </span>
                {s.questionCount > 0 && (
                  <span className="ml-1 text-xs text-neutral-500">{s.questionCount}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Sheet body */}
      {currentSheet && (
        <SheetBody
          sheet={currentSheet}
          groupedRoots={groupedRoots}
          childrenByParent={tree.childrenByParent}
          drafts={drafts}
          setDrafts={setDrafts}
          perRowBusy={perRowBusy}
          handleRegenerate={handleRegenerate}
          handleReview={handleReview}
        />
      )}
    </div>
  );
}

// ─── Question tree + grouping ─────────────────────────────────────

interface QuestionTree {
  roots: QuestionnaireQuestion[];
  childrenByParent: Map<string, QuestionnaireQuestion[]>;
}

function buildQuestionTree(qs: QuestionnaireQuestion[]): QuestionTree {
  const ids = new Set(qs.map((q) => q.id));
  const childrenByParent = new Map<string, QuestionnaireQuestion[]>();
  const roots: QuestionnaireQuestion[] = [];

  for (const q of qs) {
    if (q.parentQuestionId && ids.has(q.parentQuestionId)) {
      const arr = childrenByParent.get(q.parentQuestionId) ?? [];
      arr.push(q);
      childrenByParent.set(q.parentQuestionId, arr);
    } else {
      roots.push(q);
    }
  }
  for (const arr of childrenByParent.values()) {
    arr.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  }
  roots.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  return { roots, childrenByParent };
}

interface DomainGroup {
  domain: string;
  subGroups: Array<{ subDomain: string | null; questions: QuestionnaireQuestion[] }>;
}

function groupByDomain(roots: QuestionnaireQuestion[]): DomainGroup[] {
  const order: string[] = [];
  const map = new Map<string, Map<string | null, QuestionnaireQuestion[]>>();

  for (const q of roots) {
    const ctx = q.contextLabels ?? {};
    const domain = ctx.domain ?? q.sectionTitle ?? "—";
    const sub = ctx.subDomain ?? null;

    if (!map.has(domain)) {
      map.set(domain, new Map());
      order.push(domain);
    }
    const inner = map.get(domain)!;
    if (!inner.has(sub)) inner.set(sub, []);
    inner.get(sub)!.push(q);
  }

  return order.map((domain) => {
    const inner = map.get(domain)!;
    return {
      domain,
      subGroups: Array.from(inner.entries()).map(([subDomain, questions]) => ({
        subDomain,
        questions,
      })),
    };
  });
}

// ─── Sheet body ───────────────────────────────────────────────────

function SheetBody(props: {
  sheet: QuestionnaireSheet;
  groupedRoots: DomainGroup[];
  childrenByParent: Map<string, QuestionnaireQuestion[]>;
  drafts: Record<string, string>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  perRowBusy: Record<string, "regen" | "review" | null>;
  handleRegenerate: (qid: string) => Promise<void>;
  handleReview: (qid: string, status: "approved" | "rejected" | "draft") => Promise<void>;
}) {
  const {
    sheet,
    groupedRoots,
    childrenByParent,
    drafts,
    setDrafts,
    perRowBusy,
    handleRegenerate,
    handleReview,
  } = props;

  if (sheet.kind === "instructions") {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
        This sheet contains instructions only — there are no questions to answer here.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cover-page facts */}
      {sheet.facts.length > 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Cover-page facts
          </div>
          <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {sheet.facts.map((f) => (
              <div key={f.answerCellA1} className="flex justify-between gap-3 text-sm">
                <dt className="text-neutral-600 dark:text-neutral-400">{f.label}</dt>
                <dd className="text-right text-neutral-900 dark:text-neutral-100">
                  {f.value ? f.value : <span className="italic text-neutral-400">(blank)</span>}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {groupedRoots.length === 0 && sheet.kind !== "metadata" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900">
          No questions parsed for this sheet.
        </div>
      )}

      {groupedRoots.map((group) => (
        <section
          key={group.domain}
          className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
        >
          <header className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-700 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-300">
            {group.domain}
          </header>
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {group.subGroups.map((sg, i) => (
              <div key={i} className="px-4 py-3">
                {sg.subDomain && (
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    {sg.subDomain}
                  </div>
                )}
                <ul className="space-y-3">
                  {sg.questions.map((q) => (
                    <QuestionItem
                      key={q.id}
                      question={q}
                      childrenQs={childrenByParent.get(q.id) ?? []}
                      drafts={drafts}
                      setDrafts={setDrafts}
                      perRowBusy={perRowBusy}
                      handleRegenerate={handleRegenerate}
                      handleReview={handleReview}
                      depth={0}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// ─── Question item (recursive for nested sub-questions) ──────────

function QuestionItem(props: {
  question: QuestionnaireQuestion;
  childrenQs: QuestionnaireQuestion[];
  drafts: Record<string, string>;
  setDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  perRowBusy: Record<string, "regen" | "review" | null>;
  handleRegenerate: (qid: string) => Promise<void>;
  handleReview: (qid: string, status: "approved" | "rejected" | "draft") => Promise<void>;
  depth: number;
}) {
  const {
    question: q,
    childrenQs,
    drafts,
    setDrafts,
    perRowBusy,
    handleRegenerate,
    handleReview,
    depth,
  } = props;
  const a = q.answers[0];
  const draftValue = drafts[q.id] ?? "";
  const busy = perRowBusy[q.id];
  const ctx = q.contextLabels ?? {};
  const sideChips: Array<{ label: string; value: string }> = [];
  if (ctx.controlId) sideChips.push({ label: "Control", value: ctx.controlId });
  if (ctx.column) sideChips.push({ label: "Column", value: ctx.column });

  return (
    <li className={depth > 0 ? "border-l-2 border-neutral-200 pl-4 dark:border-neutral-700" : ""}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="font-mono">#{q.sequenceNumber}</span>
              {sideChips.map((c) => (
                <span
                  key={c.label}
                  className="rounded bg-neutral-100 px-1.5 py-0.5 text-[11px] text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                >
                  {c.label}: {c.value}
                </span>
              ))}
              {a && <StatusChip status={a.status} />}
              {a?.aiConfidence != null && <ConfidenceChip value={a.aiConfidence} />}
            </div>
            <p className="mt-1 text-sm text-neutral-900 dark:text-neutral-100">{q.questionText}</p>
            {ctx.evidence && (
              <p className="mt-1 text-xs italic text-neutral-500 dark:text-neutral-400">
                Evidence: {ctx.evidence}
              </p>
            )}
          </div>
        </div>

        <textarea
          value={draftValue}
          onChange={(e) => setDrafts((s) => ({ ...s, [q.id]: e.target.value }))}
          rows={Math.min(8, Math.max(2, Math.ceil(draftValue.length / 90) || 2))}
          placeholder={
            a?.generatedByAi
              ? "AI draft is empty — write the answer manually"
              : "Write an answer or click 'AI answer'…"
          }
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        />

        {a?.aiSources && a.aiSources.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300">
              Cited sources ({a.aiSources.length})
            </summary>
            <ul className="mt-1 space-y-1">
              {a.aiSources.map((s, i) => (
                <li key={i} className="text-neutral-600 dark:text-neutral-400">
                  <span className="rounded bg-neutral-100 px-1 font-mono text-[10px] uppercase dark:bg-neutral-800">
                    {s.kind}
                  </span>{" "}
                  {s.ref}
                  {s.snippet && <span className="text-neutral-500"> — {s.snippet}</span>}
                </li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleRegenerate(q.id)}
            disabled={!!busy}
            className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            {busy === "regen" ? "Regenerating…" : a ? "Regenerate" : "AI answer"}
          </button>
          <button
            type="button"
            onClick={() => handleReview(q.id, "rejected")}
            disabled={!!busy || !a}
            className="rounded-md border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800 dark:bg-neutral-900 dark:text-red-300 dark:hover:bg-neutral-800"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => handleReview(q.id, "draft")}
            disabled={!!busy || draftValue === (a?.content ?? "")}
            className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-800 dark:bg-neutral-900 dark:text-blue-300 dark:hover:bg-neutral-800"
          >
            Save draft
          </button>
          <button
            type="button"
            onClick={() => handleReview(q.id, "approved")}
            disabled={!!busy || draftValue.trim().length === 0}
            className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white shadow hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Approve
          </button>
        </div>

        {childrenQs.length > 0 && (
          <ul className="mt-3 space-y-3">
            {childrenQs.map((child) => (
              <QuestionItem
                key={child.id}
                question={child}
                childrenQs={[]}
                drafts={drafts}
                setDrafts={setDrafts}
                perRowBusy={perRowBusy}
                handleRegenerate={handleRegenerate}
                handleReview={handleReview}
                depth={depth + 1}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

// ─── Misc presentational components ──────────────────────────────

function Tile({
  label,
  value,
  tint = "neutral",
}: {
  label: string;
  value: number;
  tint?: "neutral" | "green" | "blue";
}) {
  const tints = {
    neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  } as const;
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
      <div
        className={`mt-1 inline-block rounded-md px-2 py-0.5 text-xl font-semibold ${tints[tint]}`}
      >
        {value}
      </div>
    </div>
  );
}

function StatusChip({ status }: { status: AnswerStatus }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_TINT[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function ConfidenceChip({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const tint =
    value >= 0.75
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      : value >= 0.5
        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        : "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200";
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tint}`}
    >
      {pct}% conf
    </span>
  );
}

/**
 * Export controls for the questionnaire detail header.
 *
 * Behaviour:
 *   • Primary button matches the original file format (xlsx → "Export
 *     Excel", docx → "Export Word") so the customer gets back the
 *     same shape they sent. Disabled with a tooltip when round-trip
 *     metadata is missing (e.g. CSV imports, paragraph-mode docx).
 *   • A "CSV" secondary button is always available as a fallback.
 *   • Include drafts toggle controls whether un-approved answers are
 *     written; defaults to approved-only.
 */
function ExportButtons(props: {
  disabled: boolean;
  sourceFormat: QuestionnaireSourceFormat;
  roundTrippable: boolean;
  onExport: (
    format: QuestionnaireExportFormat,
    include: QuestionnaireExportInclude,
  ) => Promise<void>;
}) {
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const include: QuestionnaireExportInclude = includeDrafts ? "all" : "approved";

  const isXlsx = props.sourceFormat === "xlsx";
  const isDocx = props.sourceFormat === "docx";
  const primaryFormat: QuestionnaireExportFormat | null = isXlsx ? "xlsx" : isDocx ? "docx" : null;
  const primaryLabel = isXlsx ? "Export Excel" : isDocx ? "Export Word" : null;
  const primaryDisabled = props.disabled || !props.roundTrippable;

  return (
    <div className="flex items-center gap-2">
      <label className="flex cursor-pointer items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
        <input
          type="checkbox"
          checked={includeDrafts}
          onChange={(e) => setIncludeDrafts(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-neutral-300"
        />
        Include drafts
      </label>
      {primaryFormat && primaryLabel && (
        <button
          type="button"
          onClick={() => props.onExport(primaryFormat, include)}
          disabled={primaryDisabled}
          title={
            !props.roundTrippable
              ? "Original file isn't available for round-trip; use CSV instead."
              : undefined
          }
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white"
        >
          {props.disabled ? "Exporting…" : primaryLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => props.onExport("csv", include)}
        disabled={props.disabled}
        className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {props.disabled && !primaryFormat ? "Exporting…" : "Export CSV"}
      </button>
    </div>
  );
}
