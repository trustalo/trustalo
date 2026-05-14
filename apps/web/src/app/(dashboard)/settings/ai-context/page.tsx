/**
 * AI Context wizard — captures the long-form Q&A facts the AI features
 * (policy drafting, questionnaire answering, risk scoring) read from.
 *
 * Phase 1 of the AI accelerators plan. Each question maps 1:1 to a row
 * in `TenantContext` keyed by `category` + `question`, so the
 * user can re-edit at any time without breaking AI prompts that
 * reference earlier answers.
 *
 * UX:
 *  - Sectioned by category (6 sections).
 *  - Free-text "Add custom context" lets users teach the model anything
 *    not covered by the default questionnaire.
 *  - Save persists everything in one bulk-upsert call (no per-keystroke
 *    network chatter).
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  apiClient,
  type OrganizationContextEntry,
  type OrganizationContextCategory,
  type TenantContextProposal,
  type ContextExtractionResult,
} from "@/lib/api-client";

interface QuestionDef {
  category: OrganizationContextCategory;
  question: string;
  hint?: string;
  placeholder?: string;
}

// Curated 18-question interview keyed to the 6 TenantContext
// categories. Wording aimed at a non-security founder/IC who needs
// help articulating their own controls.
const DEFAULT_QUESTIONS: QuestionDef[] = [
  // company
  {
    category: "company",
    question: "What is your company's primary product or service?",
    hint: "Used in the introduction of every policy and questionnaire response.",
    placeholder: "e.g. We provide a HIPAA-compliant telemedicine platform for mid-market clinics.",
  },
  {
    category: "company",
    question: "Where do you operate (countries / regions)?",
    placeholder: "e.g. United States, EU (Ireland and Frankfurt), Australia.",
  },
  {
    category: "company",
    question: "How many employees and contractors access production systems?",
    placeholder:
      "e.g. 28 employees and 4 contractors; only the 6-person platform team has prod access.",
  },

  // tech_stack
  {
    category: "tech_stack",
    question: "Which cloud providers and core platforms do you use?",
    placeholder:
      "e.g. Primary: AWS (us-east-1, eu-west-1). Identity: Okta. Source control: GitHub.",
  },
  {
    category: "tech_stack",
    question: "What languages and frameworks make up your application?",
    placeholder: "e.g. TypeScript (Next.js, Express), PostgreSQL, Redis, deployed via ECS Fargate.",
  },
  {
    category: "tech_stack",
    question: "Which third-party services process customer data?",
    placeholder:
      "e.g. Stripe (payments), Sendgrid (email), Mixpanel (product analytics, anonymised).",
  },

  // processes
  {
    category: "processes",
    question: "Describe your software development lifecycle.",
    hint: "Branch protection, code review policy, CI/CD, environments.",
    placeholder:
      "e.g. Trunk-based on main with required reviewers. CI gates: typecheck, tests, scan. Deploys via GitHub Actions to dev → staging → prod.",
  },
  {
    category: "processes",
    question: "How do you provision and revoke access to production?",
    placeholder:
      "e.g. Just-in-time IAM via AWS SSO; access reviewed quarterly; revocation within 24h of departure via SCIM from Okta.",
  },
  {
    category: "processes",
    question: "How do you handle security incidents?",
    placeholder:
      "e.g. PagerDuty on-call rotation; severity defined by impact; postmortems within 5 business days for SEV-1/2.",
  },

  // data_handling
  {
    category: "data_handling",
    question: "What types of customer data do you collect?",
    placeholder:
      "e.g. Account details (name, email), billing info via Stripe, encrypted documents uploaded by users (≤ 10 MB).",
  },
  {
    category: "data_handling",
    question: "Where is customer data stored and how is it encrypted?",
    placeholder:
      "e.g. PostgreSQL on AWS RDS (us-east-1, AES-256 at rest, TLS 1.2 in transit). Backups encrypted with KMS, retained 30 days.",
  },
  {
    category: "data_handling",
    question: "What is your data retention and deletion policy?",
    placeholder:
      "e.g. Active customers: data retained for the life of the contract. After termination: 30-day grace then full deletion within 7 days.",
  },

  // risk_appetite
  {
    category: "risk_appetite",
    question: "What is your overall risk tolerance for security incidents?",
    placeholder:
      "e.g. Low — we serve regulated healthcare customers. Any data exposure is treated as critical regardless of count.",
  },
  {
    category: "risk_appetite",
    question: "Which compliance frameworks are you targeting?",
    placeholder: "e.g. SOC 2 Type II by Q3, ISO 27001:2022 by EOY, HIPAA-ready already.",
  },
  {
    category: "risk_appetite",
    question: "What service-level commitments do you make to customers?",
    placeholder: "e.g. 99.9% monthly uptime, 4h SEV-1 response, RTO 4h, RPO 1h.",
  },

  // team
  {
    category: "team",
    question: "Who owns information security at the organisation?",
    placeholder:
      "e.g. CTO is the executive sponsor; the Head of Platform is the day-to-day security owner; vCISO advisory monthly.",
  },
  {
    category: "team",
    question: "How do you train staff on security awareness?",
    placeholder:
      "e.g. Onboarding training within first week + annual refresher via Curricula; quarterly phishing simulations via KnowBe4.",
  },
  {
    category: "team",
    question: "Who can authorise material changes to security policy?",
    placeholder:
      "e.g. Joint sign-off by CTO and Compliance Manager; board-level for incidents impacting > 100 customers.",
  },
];

const CATEGORY_LABELS: Record<OrganizationContextCategory, { title: string; subtitle: string }> = {
  company: {
    title: "Company",
    subtitle: "What you do, where you operate, how big you are.",
  },
  tech_stack: {
    title: "Tech stack",
    subtitle: "Platforms, languages, third-party services.",
  },
  processes: {
    title: "Processes",
    subtitle: "How you build, deploy, and respond.",
  },
  data_handling: {
    title: "Data handling",
    subtitle: "What you collect, where it lives, how long you keep it.",
  },
  risk_appetite: {
    title: "Risk appetite",
    subtitle: "Tolerance, target frameworks, customer commitments.",
  },
  team: {
    title: "Team",
    subtitle: "Ownership, training, authorisation.",
  },
};

const CATEGORY_ORDER: OrganizationContextCategory[] = [
  "company",
  "tech_stack",
  "processes",
  "data_handling",
  "risk_appetite",
  "team",
];

interface CustomEntry {
  /** Stable key for React reconciliation while the row is unsaved. */
  localId: string;
  /** Server id once persisted; null until first save. */
  id: string | null;
  category: OrganizationContextCategory;
  question: string;
  answer: string;
}

export default function AIContextPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // answers map: keyed by (category|question) for the curated set; the
  // entry id is tracked so updates use PATCH and creates use POST.
  const [answers, setAnswers] = useState<Record<string, { id: string | null; value: string }>>({});
  const [customEntries, setCustomEntries] = useState<CustomEntry[]>([]);

  // Phase 1 of "ongoing AI context": paste-to-extract + proposal review.
  // Anything the LLM extracts lands in `proposals` (status=pending) and
  // is gated behind explicit user accept/reject — never auto-applied.
  const [pasteText, setPasteText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractSummary, setExtractSummary] = useState<ContextExtractionResult | null>(null);
  const [proposals, setProposals] = useState<TenantContextProposal[]>([]);
  const [proposalEdits, setProposalEdits] = useState<
    Record<
      string,
      {
        question: string;
        answer: string;
        category: OrganizationContextCategory;
        supersedesContextId: string | null;
      }
    >
  >({});
  const [proposalBusy, setProposalBusy] = useState<Record<string, boolean>>({});

  // History disclosure: superseded rows are loaded on demand so the
  // primary wizard stays focused on the current state.
  const [showHistory, setShowHistory] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<OrganizationContextEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const keyOf = (category: OrganizationContextCategory, question: string) =>
    `${category}::${question}`;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.listOrganizationContext();
      const map: Record<string, { id: string; value: string }> = {};
      const customs: CustomEntry[] = [];
      const knownKeys = new Set(DEFAULT_QUESTIONS.map((q) => keyOf(q.category, q.question)));
      for (const row of res.data) {
        const k = keyOf(row.category, row.question);
        if (knownKeys.has(k)) {
          map[k] = { id: row.id, value: row.answer };
        } else {
          customs.push({
            localId: row.id,
            id: row.id,
            category: row.category,
            question: row.question,
            answer: row.answer,
          });
        }
      }
      setAnswers(map);
      setCustomEntries(customs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load context");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProposals = useCallback(async () => {
    try {
      const res = await apiClient.listOrganizationContextProposals({
        status: "pending",
      });
      setProposals(res.data);
      // Seed/refresh the per-proposal edit buffers so the user can tweak
      // wording before accepting without losing earlier edits.
      setProposalEdits((prev) => {
        const next: typeof prev = {};
        for (const p of res.data) {
          next[p.id] = prev[p.id] ?? {
            question: p.question,
            answer: p.answer,
            category: p.category,
            supersedesContextId: p.supersedesContextId,
          };
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load proposals");
    }
  }, []);

  useEffect(() => {
    fetchAll();
    fetchProposals();
  }, [fetchAll, fetchProposals]);

  const handleExtract = useCallback(async () => {
    const text = pasteText.trim();
    if (!text) return;
    setExtracting(true);
    setError(null);
    setExtractSummary(null);
    try {
      const res = await apiClient.extractOrganizationContextFromText({ text });
      setExtractSummary(res.data);
      setPasteText("");
      await fetchProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }, [pasteText, fetchProposals]);

  const updateProposalEdit = (
    proposalId: string,
    patch: Partial<{
      question: string;
      answer: string;
      category: OrganizationContextCategory;
      supersedesContextId: string | null;
    }>,
  ) => {
    setProposalEdits((prev) => {
      const current = prev[proposalId];
      if (!current) return prev;
      return {
        ...prev,
        [proposalId]: { ...current, ...patch },
      };
    });
  };

  const handleAcceptProposal = useCallback(
    async (proposal: TenantContextProposal) => {
      const edits = proposalEdits[proposal.id];
      if (!edits || !edits.answer.trim() || !edits.question.trim()) return;
      setProposalBusy((prev) => ({ ...prev, [proposal.id]: true }));
      setError(null);
      try {
        await apiClient.acceptOrganizationContextProposal(proposal.id, {
          question: edits.question,
          answer: edits.answer,
          category: edits.category,
          supersedesContextId: edits.supersedesContextId,
        });
        await Promise.all([fetchAll(), fetchProposals()]);
        if (showHistory) await refreshHistory();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to accept proposal");
      } finally {
        setProposalBusy((prev) => ({ ...prev, [proposal.id]: false }));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [proposalEdits, fetchAll, fetchProposals, showHistory],
  );

  const handleRejectProposal = useCallback(
    async (proposalId: string) => {
      setProposalBusy((prev) => ({ ...prev, [proposalId]: true }));
      setError(null);
      try {
        await apiClient.rejectOrganizationContextProposal(proposalId);
        await fetchProposals();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to reject proposal");
      } finally {
        setProposalBusy((prev) => ({ ...prev, [proposalId]: false }));
      }
    },
    [fetchProposals],
  );

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await apiClient.listOrganizationContext({
        includeHistory: true,
      });
      setHistoryEntries(res.data.filter((row) => row.status !== "active"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const toggleHistory = useCallback(async () => {
    const next = !showHistory;
    setShowHistory(next);
    if (next && historyEntries.length === 0) {
      await refreshHistory();
    }
  }, [showHistory, historyEntries.length, refreshHistory]);

  const setAnswer = (category: OrganizationContextCategory, question: string, value: string) => {
    const k = keyOf(category, question);
    setAnswers((prev) => ({
      ...prev,
      [k]: { id: prev[k]?.id ?? null, value },
    }));
  };

  const addCustomEntry = () => {
    setCustomEntries((prev) => [
      ...prev,
      {
        localId: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        id: null,
        category: "company",
        question: "",
        answer: "",
      },
    ]);
  };

  const updateCustomEntry = (localId: string, patch: Partial<CustomEntry>) => {
    setCustomEntries((prev) => prev.map((c) => (c.localId === localId ? { ...c, ...patch } : c)));
  };

  const removeCustomEntry = async (entry: CustomEntry) => {
    if (entry.id) {
      try {
        await apiClient.deleteOrganizationContext(entry.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
        return;
      }
    }
    setCustomEntries((prev) => prev.filter((c) => c.localId !== entry.localId));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // Two paths in one save: existing rows go through PATCH so we
      // preserve `confidence`/`source`; brand-new rows are batched into
      // a single bulk POST to minimise round-trips.
      const newRows: { category: OrganizationContextCategory; question: string; answer: string }[] =
        [];

      for (const q of DEFAULT_QUESTIONS) {
        const k = keyOf(q.category, q.question);
        const a = answers[k];
        if (!a || !a.value.trim()) continue;
        if (a.id) {
          await apiClient.updateOrganizationContext(a.id, { answer: a.value });
        } else {
          newRows.push({ category: q.category, question: q.question, answer: a.value });
        }
      }

      for (const c of customEntries) {
        if (!c.question.trim() || !c.answer.trim()) continue;
        if (c.id) {
          await apiClient.updateOrganizationContext(c.id, {
            category: c.category,
            question: c.question,
            answer: c.answer,
          });
        } else {
          newRows.push({ category: c.category, question: c.question, answer: c.answer });
        }
      }

      if (newRows.length) {
        await apiClient.bulkUpsertOrganizationContext(
          newRows.map((r) => ({ ...r, source: "onboarding" })),
        );
      }

      setSavedAt(new Date());
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save context");
    } finally {
      setSaving(false);
    }
  }, [answers, customEntries, fetchAll]);

  const completion = useMemo(() => {
    const answered = DEFAULT_QUESTIONS.filter((q) => {
      const v = answers[keyOf(q.category, q.question)]?.value;
      return v && v.trim().length > 0;
    }).length;
    return { answered, total: DEFAULT_QUESTIONS.length };
  }, [answers]);

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-sm text-neutral-500">Loading AI context…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="space-y-2">
        <Link
          href="/settings"
          className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          ← Back to Settings
        </Link>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">AI context</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Teach Trustalo&apos;s AI about your organisation. These answers are used to draft
              policies, answer customer questionnaires, and score risks against your real
              environment.
            </p>
          </div>
          <Badge variant={completion.answered === completion.total ? "success" : "info"}>
            {completion.answered} / {completion.total} answered
          </Badge>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Paste-to-extract: send unstructured text to the LLM and review the
          structured suggestions before they touch your live AI context. */}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Quick add via paste
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Drop in a meeting note, an architecture doc, or a Slack thread. Trustalo will suggest
              facts to add — nothing is saved until you accept it.
            </p>
          </div>
          <Badge variant="info">PII auto-redacted</Badge>
        </div>
        <Textarea
          id="paste-to-extract"
          label=""
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          rows={5}
          className="mt-3"
          placeholder="e.g. We moved customer data to AWS RDS in eu-west-1 last sprint, and Okta now handles SSO for prod access…"
        />
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">
            {pasteText.trim().length.toLocaleString()} characters · max 8,000 sent to the model
          </p>
          <Button
            onClick={handleExtract}
            loading={extracting}
            disabled={!pasteText.trim() || extracting}
          >
            {extracting ? "Extracting…" : "Suggest facts"}
          </Button>
        </div>
        {extractSummary && (
          <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            {extractSummary.proposals.length} suggestion
            {extractSummary.proposals.length === 1 ? "" : "s"} added below
            {extractSummary.dropped > 0
              ? ` · ${extractSummary.dropped} skipped (low confidence)`
              : ""}
            {" · model "}
            <code className="rounded bg-neutral-200 px-1 py-0.5 dark:bg-neutral-800">
              {extractSummary.modelUsed}
            </code>
          </div>
        )}
      </Card>

      {/* Pending proposals queue. Every row shown here is currently
          status=pending; accepting writes a new active TenantContext
          row (and supersedes the prior one if the LLM linked it). */}
      {proposals.length > 0 && (
        <Card>
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Pending suggestions
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Review what the AI extracted. You can edit wording before accepting.
              </p>
            </div>
            <Badge variant="warning">{proposals.length} pending</Badge>
          </div>
          <div className="mt-4 space-y-4">
            {proposals.map((p) => {
              const edit = proposalEdits[p.id] ?? {
                question: p.question,
                answer: p.answer,
                category: p.category,
                supersedesContextId: p.supersedesContextId,
              };
              const busy = proposalBusy[p.id] === true;
              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <Badge variant="neutral">{CATEGORY_LABELS[p.category].title}</Badge>
                    <span>
                      Confidence{" "}
                      <span className="font-medium text-neutral-700 dark:text-neutral-200">
                        {(p.confidence * 100).toFixed(0)}%
                      </span>
                    </span>
                    {p.supersedesContextId && <Badge variant="info">Replaces existing fact</Badge>}
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="sm:col-span-1">
                      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                        Category
                      </label>
                      <select
                        value={edit.category}
                        onChange={(e) =>
                          updateProposalEdit(p.id, {
                            category: e.target.value as OrganizationContextCategory,
                          })
                        }
                        className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                        disabled={busy}
                      >
                        {CATEGORY_ORDER.map((cat) => (
                          <option key={cat} value={cat}>
                            {CATEGORY_LABELS[cat].title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        id={`proposal-q-${p.id}`}
                        label="Question"
                        value={edit.question}
                        onChange={(e) => updateProposalEdit(p.id, { question: e.target.value })}
                        disabled={busy}
                      />
                    </div>
                  </div>
                  <Textarea
                    id={`proposal-a-${p.id}`}
                    label="Answer"
                    value={edit.answer}
                    onChange={(e) => updateProposalEdit(p.id, { answer: e.target.value })}
                    rows={3}
                    className="mt-2"
                    disabled={busy}
                  />
                  {p.rationale && (
                    <p className="mt-2 text-xs italic text-neutral-500 dark:text-neutral-400">
                      Why: {p.rationale}
                    </p>
                  )}
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRejectProposal(p.id)}
                      disabled={busy}
                    >
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptProposal(p)}
                      loading={busy}
                      disabled={busy || !edit.answer.trim() || !edit.question.trim()}
                    >
                      Accept
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Sections */}
      {CATEGORY_ORDER.map((cat) => {
        const meta = CATEGORY_LABELS[cat];
        const questions = DEFAULT_QUESTIONS.filter((q) => q.category === cat);
        return (
          <Card key={cat}>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                {meta.title}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{meta.subtitle}</p>
            </div>
            <div className="mt-4 space-y-5">
              {questions.map((q) => {
                const k = keyOf(q.category, q.question);
                const value = answers[k]?.value ?? "";
                return (
                  <div key={k}>
                    <label className="block text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {q.question}
                    </label>
                    {q.hint && (
                      <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                        {q.hint}
                      </p>
                    )}
                    <Textarea
                      id={k}
                      label=""
                      value={value}
                      placeholder={q.placeholder}
                      onChange={(e) => setAnswer(q.category, q.question, e.target.value)}
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}

      {/* Custom context entries */}
      <Card>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Custom context
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Anything not covered above. The AI will use these the same way.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addCustomEntry}>
            + Add entry
          </Button>
        </div>

        {customEntries.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-400">No custom context yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {customEntries.map((c) => (
              <div
                key={c.localId}
                className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-700"
              >
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div className="sm:col-span-1">
                    <label className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                      Category
                    </label>
                    <select
                      value={c.category}
                      onChange={(e) =>
                        updateCustomEntry(c.localId, {
                          category: e.target.value as OrganizationContextCategory,
                        })
                      }
                      className="mt-1 w-full rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                    >
                      {CATEGORY_ORDER.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat].title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      id={`q-${c.localId}`}
                      label="Question"
                      value={c.question}
                      onChange={(e) => updateCustomEntry(c.localId, { question: e.target.value })}
                      placeholder="e.g. How do you handle vendor offboarding?"
                    />
                  </div>
                </div>
                <Textarea
                  id={`a-${c.localId}`}
                  label="Answer"
                  value={c.answer}
                  onChange={(e) => updateCustomEntry(c.localId, { answer: e.target.value })}
                  rows={3}
                  className="mt-2"
                />
                <div className="mt-2 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => removeCustomEntry(c)}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* History disclosure: superseded rows are kept for audit & recall.
          Hidden by default to keep the wizard focused on the current state. */}
      <Card>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">History</h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Previous answers replaced by newer facts. Read-only.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleHistory}>
            {showHistory ? "Hide" : "Show history"}
          </Button>
        </div>
        {showHistory && (
          <div className="mt-4 space-y-3">
            {historyLoading && <p className="text-sm text-neutral-400">Loading history…</p>}
            {!historyLoading && historyEntries.length === 0 && (
              <p className="text-sm text-neutral-400">No superseded entries yet.</p>
            )}
            {historyEntries.map((row) => (
              <div
                key={row.id}
                className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900"
              >
                <div className="mb-1 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <Badge variant="neutral">{CATEGORY_LABELS[row.category].title}</Badge>
                  <Badge variant="info">{row.status}</Badge>
                  <span>Updated {new Date(row.updatedAt).toLocaleDateString()}</span>
                </div>
                <p className="font-medium text-neutral-800 dark:text-neutral-100">{row.question}</p>
                <p className="mt-1 whitespace-pre-wrap text-neutral-600 dark:text-neutral-300">
                  {row.answer}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
        <div className="text-xs text-neutral-500">
          {savedAt
            ? `Saved at ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Unsaved changes"}
        </div>
        <Button onClick={handleSave} loading={saving}>
          {saving ? "Saving…" : "Save context"}
        </Button>
      </div>
    </div>
  );
}

// Suppress unused-vars when consumers (tests/storybook) import the type.
export type { OrganizationContextEntry };
