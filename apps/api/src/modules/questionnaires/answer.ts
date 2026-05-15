/**
 * Phase 6 (AI accelerators): AI questionnaire answering.
 *
 * Two surfaces:
 *   • `answerOne`  — generates a single answer for one question.
 *   • `answerAll`  — bulk variant that runs `answerOne` over every
 *                    pending question, with a small concurrency
 *                    bound so we don't fan out 200 LLM calls in
 *                    parallel against rate-limited providers.
 *
 * Grounding strategy: the prompt receives the org's published policies
 * (titles + first 1500 chars), its TenantContext rows, and the
 * names of frameworks the org has adopted. The model is told to cite
 * sources in a structured `sources` array; if it cannot ground the
 * answer it must return a low confidence and an empty draft so the
 * reviewer knows to write the answer manually.
 */

import { z } from "zod";
import { resolveOrgAI } from "../../config/ai.js";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { stripHtml } from "../../lib/html.js";

const SOURCES_PER_PROMPT = 12;
const POLICIES_PER_PROMPT = 25;
const POLICY_BODY_CHAR_CAP = 1500;
const ANSWER_BULK_CONCURRENCY = 4;
// How many implemented controls to include in the prompt. Controls
// give the strongest grounding when answering "do you do X?" style
// questions, so we lean into them.
const CONTROLS_PER_PROMPT = 40;
const CONTROL_DETAIL_CHAR_CAP = 600;
// Past approved questionnaire answers are the highest-quality
// grounding we have — they were reviewed by the org's CISO/ISO and
// reflect the real, current posture. We retrieve a generous slice and
// let the LLM pick the closest matches.
const PAST_ANSWERS_PER_PROMPT = 30;
const PAST_ANSWER_CHAR_CAP = 400;

const AnswerSchema = z.object({
  draft: z.string(),
  confidence: z.number().min(0).max(1),
  sources: z
    .array(
      z.object({
        kind: z.enum(["policy", "context", "framework", "control", "past_answer"]),
        ref: z.string(),
        snippet: z.string().optional(),
      }),
    )
    .default([]),
});

export interface AnsweredQuestion {
  questionId: string;
  draft: string;
  confidence: number;
  sources: Array<{
    kind: "policy" | "context" | "framework" | "control" | "past_answer";
    ref: string;
    snippet?: string;
  }>;
  modelUsed: string;
}

export class QuestionnaireNotFoundError extends Error {
  readonly code = "QUESTIONNAIRE_NOT_FOUND";
  constructor(id: string) {
    super(`Questionnaire ${id} not found`);
  }
}

export class QuestionNotFoundError extends Error {
  readonly code = "QUESTION_NOT_FOUND";
  constructor(id: string) {
    super(`Question ${id} not found`);
  }
}

interface GroundingBundle {
  policies: Array<{ id: string; title: string; body: string }>;
  context: Array<{ category: string; question: string; answer: string }>;
  frameworks: string[];
  /**
   * Implemented or partially-implemented controls. The LLM uses these
   * to substantiate "yes/no" claims and to cite real control IDs when
   * answering "how do you do X?" questions.
   */
  controls: Array<{ id: string; title: string; status: string; details: string }>;
  /**
   * Approved answers to questions in past questionnaires from the same
   * org. Highest-quality grounding because these were reviewed by the
   * org's CISO/ISO. We surface the question text + final answer so the
   * model can lean on or directly reuse the wording where appropriate.
   */
  pastAnswers: Array<{ question: string; answer: string; questionnaireName: string }>;
}

async function loadGrounding(tenantId: string): Promise<GroundingBundle> {
  const db = prismaWithTenant(tenantId);

  const policiesRaw = await db.policy.findMany({
    where: { status: "approved" },
    take: POLICIES_PER_PROMPT,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, currentVersionId: true },
  });
  const versionIds = policiesRaw.map((p) => p.currentVersionId).filter((v): v is string => !!v);
  const versions = versionIds.length
    ? await db.policyVersion.findMany({
        where: { id: { in: versionIds } },
        select: { id: true, content: true },
      })
    : [];
  const versionMap = new Map(versions.map((v) => [v.id, v.content]));
  const policies = policiesRaw.map((p) => ({
    id: p.id,
    title: p.title,
    body: stripHtml(p.currentVersionId ? (versionMap.get(p.currentVersionId) ?? "") : "").slice(
      0,
      POLICY_BODY_CHAR_CAP,
    ),
  }));

  const context = await db.tenantContext.findMany({
    // Skip superseded / archived rows so AI-drafted questionnaire
    // answers reflect the org's current posture only.
    where: { status: "active" },
    take: SOURCES_PER_PROMPT * 2,
    orderBy: { updatedAt: "desc" },
    select: { category: true, question: true, answer: true },
  });

  // Frameworks: pull the names from FrameworkInstance, which is the
  // org's adopted-frameworks junction.
  const frameworks = await db.frameworkInstance.findMany({
    select: { framework: { select: { name: true, frameworkType: true } } },
  });

  // Implemented / partially-implemented controls — the strongest
  // grounding for "do you do X?" questions. We exclude not_implemented
  // controls because they would lead the LLM to make false claims.
  const controlsRaw = await db.control.findMany({
    where: { status: { in: ["implemented", "partially_implemented"] } },
    take: CONTROLS_PER_PROMPT,
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, status: true, description: true, implementationDetails: true },
  });
  const controls = controlsRaw.map((c) => ({
    id: c.id,
    title: c.title,
    status: c.status,
    details: (c.implementationDetails || c.description || "").slice(0, CONTROL_DETAIL_CHAR_CAP),
  }));

  // Past approved answers across all questionnaires. We only include
  // answers that a human reviewed and approved — drafts shouldn't
  // bleed into future drafts.
  const pastAnswersRaw = await db.answer.findMany({
    where: { status: "approved" },
    take: PAST_ANSWERS_PER_PROMPT,
    orderBy: { reviewedAt: "desc" },
    select: {
      content: true,
      question: { select: { questionText: true } },
      questionnaire: { select: { name: true } },
    },
  });
  const pastAnswers = pastAnswersRaw
    .filter((a) => a.content && a.question?.questionText)
    .map((a) => ({
      question: a.question.questionText,
      answer: a.content.slice(0, PAST_ANSWER_CHAR_CAP),
      questionnaireName: a.questionnaire?.name ?? "previous questionnaire",
    }));

  return {
    policies,
    context: context.map((c) => ({ category: c.category, question: c.question, answer: c.answer })),
    frameworks: Array.from(new Set(frameworks.map((f) => f.framework.name))),
    controls,
    pastAnswers,
  };
}

export async function answerOne(args: {
  tenantId: string;
  questionId: string;
  grounding?: GroundingBundle;
}): Promise<AnsweredQuestion> {
  const db = prismaWithTenant(args.tenantId);

  const question = await db.question.findUnique({
    where: { id: args.questionId },
    select: {
      id: true,
      questionnaireId: true,
      sectionTitle: true,
      questionText: true,
      questionType: true,
      choices: true,
      contextLabels: true,
      parentQuestionId: true,
      parent: { select: { questionText: true } },
      questionnaire: {
        select: { metadataFacts: true },
      },
    },
  });
  if (!question) throw new QuestionNotFoundError(args.questionId);

  const grounding = args.grounding ?? (await loadGrounding(args.tenantId));

  // Per-question context: domain/sub-domain/control-id labels, the
  // parent question text (so a sub-question like "a) Has this policy
  // been communicated?" sees its parent "Does your org have a
  // documented Information Security Policy?"), and any cover-page
  // metadata facts the customer filled into the workbook.
  const contextLabels = (question.contextLabels as Record<string, string> | null) ?? {};
  const parentText = question.parent?.questionText ?? null;
  const metadataFacts =
    (question.questionnaire?.metadataFacts as Array<{ label: string; value?: string }> | null) ??
    [];

  const ai = await resolveOrgAI(args.tenantId, "questionnaire_answering");

  const systemPrompt = [
    "You are a security & compliance program lead drafting answers for a customer security questionnaire.",
    "Your only knowledge of this organisation is the supplied: approved policies, implemented controls, business-context Q&A, adopted frameworks, and approved answers from past questionnaires.",
    "Hard rules:",
    "1. Output ONLY a single JSON object — no markdown fences, no commentary.",
    "2. If you cannot ground the answer in the supplied material, return draft='' and confidence < 0.3 so the human knows to write the answer manually. NEVER fabricate.",
    "3. For yes/no questions, draft MUST start with 'Yes' or 'No' (or 'N/A' when truly inapplicable), followed by a 1-3 sentence justification.",
    "4. For short_text questions, keep the draft under 300 characters.",
    "5. For long_text questions, write 2-5 sentences citing the controls in plain English.",
    "6. Prefer reusing wording from approved past answers when the new question is materially the same — those answers were already reviewed and approved by the org's CISO/ISO. Cite them with kind='past_answer'.",
    "7. Always populate `sources` with the policy / control / context / framework / past_answer refs you actually relied on.",
    "8. When a parent question is supplied, treat it as essential context — the current question is a sub-bullet of that parent (e.g. 'a) Has this policy been communicated?' under 'Does your org have an IS Policy?'). Answer specifically about the sub-aspect, not the parent.",
    "9. When question context (Domain / Sub-Domain / Control ID / Evidence) is supplied, use it to disambiguate but DO NOT just restate it.",
    'Top-level JSON shape: { "draft": string, "confidence": number, "sources": [{ "kind": "policy"|"control"|"context"|"framework"|"past_answer", "ref": string, "snippet"?: string }] }',
  ].join("\n");

  const labelLines = Object.entries(contextLabels)
    .filter(([, v]) => typeof v === "string" && v.length > 0)
    .map(([k, v]) => `${k}: ${v}`);

  const factLines = metadataFacts
    .filter((f) => f && f.value && f.value.trim().length > 0)
    .map((f) => `${f.label}: ${f.value}`);

  const userPrompt = [
    `# Question (${question.questionType})\n${question.sectionTitle ? `[${question.sectionTitle}]\n` : ""}${question.questionText}`,
    parentText ? `# Parent question (this question is a sub-bullet of)\n${parentText}` : "",
    labelLines.length > 0 ? `# Question context\n${labelLines.join("\n")}` : "",
    factLines.length > 0
      ? `# Customer/workbook facts (from the cover page)\n${factLines.join("\n")}`
      : "",
    Array.isArray(question.choices) && question.choices.length > 0
      ? `# Allowed answers\n${(question.choices as unknown[]).join(", ")}`
      : "",
    `# Adopted compliance frameworks\n${grounding.frameworks.join(", ") || "(none)"}`,
    grounding.controls.length > 0
      ? `# Implemented controls (id — title — status — implementation)\n${grounding.controls
          .map((c) => `- ${c.id} — ${c.title} — ${c.status}\n  ${c.details}`)
          .join("\n\n")}`
      : "",
    `# Approved policies (id — title — extract)\n${grounding.policies
      .map((p) => `- ${p.id} — ${p.title}\n  ${p.body}`)
      .join("\n\n")}`,
    grounding.pastAnswers.length > 0
      ? `# Approved answers from previous questionnaires (Q → A — questionnaire)\n${grounding.pastAnswers
          .map((p) => `- Q: ${p.question}\n  A: ${p.answer}  [${p.questionnaireName}]`)
          .join("\n\n")}`
      : "",
    `# Organisation context Q&A\n${JSON.stringify(grounding.context, null, 2)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const completion = await ai.client.chat({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    maxTokens: 700,
    temperature: 0.2,
    responseFormat: "json",
  });

  const cleaned = completion.content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const parsed = AnswerSchema.parse(JSON.parse(cleaned));

  return {
    questionId: question.id,
    draft: parsed.draft,
    confidence: parsed.confidence,
    sources: parsed.sources,
    modelUsed: ai.model,
  };
}

export interface BulkAnswerResult {
  total: number;
  answered: number;
  skipped: number;
  failures: Array<{ questionId: string; error: string }>;
}

export async function answerAll(args: {
  tenantId: string;
  questionnaireId: string;
}): Promise<BulkAnswerResult> {
  const db = prismaWithTenant(args.tenantId);

  const questionnaire = await db.questionnaire.findUnique({
    where: { id: args.questionnaireId },
    select: { id: true },
  });
  if (!questionnaire) throw new QuestionnaireNotFoundError(args.questionnaireId);

  // Only answer questions that don't already have an approved/draft answer
  // — re-runs are explicit, via per-question regenerate.
  const questions = await db.question.findMany({
    where: {
      questionnaireId: args.questionnaireId,
      answers: { none: {} },
    },
    orderBy: { sequenceNumber: "asc" },
    select: { id: true },
  });

  const grounding = await loadGrounding(args.tenantId);

  const failures: BulkAnswerResult["failures"] = [];
  let answered = 0;

  await runBounded(questions, ANSWER_BULK_CONCURRENCY, async ({ id }) => {
    try {
      const result = await answerOne({
        tenantId: args.tenantId,
        questionId: id,
        grounding,
      });
      // Persist as a draft answer — the reviewer must explicitly approve.
      await db.answer.upsert({
        where: { questionId: id },
        update: {
          content: result.draft,
          status: result.draft ? "draft" : "pending",
          generatedByAi: true,
          aiConfidence: result.confidence,
          aiSources: result.sources,
          aiModel: result.modelUsed,
        },
        create: {
          tenantId: args.tenantId,
          questionnaireId: args.questionnaireId,
          questionId: id,
          content: result.draft,
          status: result.draft ? "draft" : "pending",
          generatedByAi: true,
          aiConfidence: result.confidence,
          aiSources: result.sources,
          aiModel: result.modelUsed,
        },
      });
      answered++;
    } catch (err) {
      failures.push({ questionId: id, error: err instanceof Error ? err.message : String(err) });
    }
  });

  // Promote the parent questionnaire from `draft` → `in_progress`
  // so the workspace tile reflects that AI work is in progress.
  await prisma.questionnaire.update({
    where: { id: args.questionnaireId },
    data: { status: "in_progress" },
  });

  return {
    total: questions.length,
    answered,
    skipped: questions.length - answered - failures.length,
    failures,
  };
}

async function runBounded<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (item === undefined) return;
          await fn(item);
        }
      })(),
    );
  }
  await Promise.all(workers);
}
