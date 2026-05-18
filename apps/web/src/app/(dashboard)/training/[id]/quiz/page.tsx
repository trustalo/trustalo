"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  apiClient,
  type TrainingQuizDetail,
  type TrainingQuizListItem,
  type QuizQuestionType,
  type CreateQuizInput,
} from "@/lib/api-client";
import { isEnterpriseLicenseError, useAiGated, useEnterpriseToast } from "@/lib/enterprise-license";
import { EnterpriseRequiredBanner } from "@/components/ai/enterprise-required-banner";

interface QuestionDraft {
  text: string;
  type: QuizQuestionType;
  points: number;
  options: { text: string; isCorrect: boolean }[];
}

const EMPTY_OPTION = { text: "", isCorrect: false };

function newQuestion(): QuestionDraft {
  return {
    text: "",
    type: "multiple_choice",
    points: 1,
    options: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
  };
}

const QUESTION_TYPE_OPTIONS = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
  { value: "multi_select", label: "Multi-Select" },
];

export default function QuizBuilderPage() {
  const { id: programId } = useParams<{ id: string }>();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<TrainingQuizListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<TrainingQuizDetail | null>(null);

  const [title, setTitle] = useState("Cybersecurity Awareness Quiz");
  const [description, setDescription] = useState("");
  const [passingScore, setPassingScore] = useState(70);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [questions, setQuestions] = useState<QuestionDraft[]>([newQuestion()]);
  const [saving, setSaving] = useState(false);

  // AI generation
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("Cybersecurity Awareness");
  const [aiNumQuestions, setAiNumQuestions] = useState(10);
  const [aiDifficulty, setAiDifficulty] = useState<"beginner" | "intermediate" | "advanced">(
    "intermediate",
  );
  const [aiContext, setAiContext] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiGated = useAiGated();
  const enterpriseToast = useEnterpriseToast();

  function openAiModal() {
    if (aiGated) {
      enterpriseToast.show("AI quiz generation");
      return;
    }
    setAiModalOpen(true);
  }

  async function handleAIGenerate() {
    if (aiGated) {
      enterpriseToast.show("AI quiz generation");
      setAiModalOpen(false);
      return;
    }
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await apiClient.generateQuizWithAI({
        topic: aiTopic,
        numberOfQuestions: aiNumQuestions,
        difficulty: aiDifficulty,
        additionalContext: aiContext || undefined,
      });
      const generated = res.data;

      setTitle(generated.title);
      setDescription(generated.description);
      setQuestions(
        generated.questions.map((q) => ({
          text: q.text,
          type: q.type as QuizQuestionType,
          points: q.points,
          options: q.options.map((o) => ({
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
      );
      setEditingQuiz(null);
      setEditing(true);
      setAiModalOpen(false);
    } catch (err: any) {
      if (isEnterpriseLicenseError(err)) {
        enterpriseToast.show("AI quiz generation");
        setAiModalOpen(false);
      } else {
        setAiError(
          err?.message ||
            "Failed to generate quiz. Check Settings > AI to ensure quiz generation is configured.",
        );
      }
    } finally {
      setAiGenerating(false);
    }
  }

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.listQuizzes(programId);
      setQuizzes(res.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [programId]);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  function startCreate() {
    setEditingQuiz(null);
    setTitle("Cybersecurity Awareness Quiz");
    setDescription("");
    setPassingScore(70);
    setTimeLimitMinutes(null);
    setShuffleQuestions(false);
    setQuestions([newQuestion()]);
    setEditing(true);
  }

  async function startEdit(quizListItem: TrainingQuizListItem) {
    try {
      const res = await apiClient.getQuiz(programId, quizListItem.id);
      const q = res.data;
      setEditingQuiz(q);
      setTitle(q.title);
      setDescription(q.description ?? "");
      setPassingScore(q.passingScore);
      setTimeLimitMinutes(q.timeLimitMinutes);
      setShuffleQuestions(q.shuffleQuestions);
      setQuestions(
        q.questions.map((qn) => ({
          text: qn.text,
          type: qn.type,
          points: qn.points,
          options: qn.options.map((o) => ({
            text: o.text,
            isCorrect: o.isCorrect,
          })),
        })),
      );
      setEditing(true);
    } catch {
      // handle error
    }
  }

  function updateQuestion(idx: number, patch: Partial<QuestionDraft>) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)));
  }

  function updateOption(
    qIdx: number,
    oIdx: number,
    patch: Partial<{ text: string; isCorrect: boolean }>,
  ) {
    setQuestions((prev) =>
      prev.map((q, qi) => {
        if (qi !== qIdx) return q;
        const opts = q.options.map((o, oi) => {
          if (oi !== oIdx) return o;
          return { ...o, ...patch };
        });
        if (patch.isCorrect && (q.type === "multiple_choice" || q.type === "true_false")) {
          return {
            ...q,
            options: opts.map((o, oi) => ({
              ...o,
              isCorrect: oi === oIdx,
            })),
          };
        }
        return { ...q, options: opts };
      }),
    );
  }

  function addOption(qIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: [...q.options, { ...EMPTY_OPTION }] } : q)),
    );
  }

  function removeOption(qIdx: number, oIdx: number) {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, options: q.options.filter((_, oi) => oi !== oIdx) } : q,
      ),
    );
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function changeQuestionType(qIdx: number, type: QuizQuestionType) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (type === "true_false") {
          return {
            ...q,
            type,
            options: [
              { text: "True", isCorrect: true },
              { text: "False", isCorrect: false },
            ],
          };
        }
        return { ...q, type };
      }),
    );
  }

  async function handleSave() {
    const valid = questions.every(
      (q) =>
        q.text.trim() &&
        q.options.length >= 2 &&
        q.options.every((o) => o.text.trim()) &&
        q.options.some((o) => o.isCorrect),
    );
    if (!title.trim() || !valid) return;

    setSaving(true);
    try {
      if (editingQuiz) {
        await apiClient.updateQuiz(programId, editingQuiz.id, {
          title,
          description: description || null,
          passingScore,
          timeLimitMinutes,
          shuffleQuestions,
        });
        await apiClient.updateQuizQuestions(
          programId,
          editingQuiz.id,
          questions.map((q, i) => ({
            text: q.text,
            type: q.type,
            sortOrder: i,
            points: q.points,
            options: q.options.map((o, oi) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              sortOrder: oi,
            })),
          })),
        );
      } else {
        const payload: CreateQuizInput = {
          title,
          description: description || null,
          passingScore,
          timeLimitMinutes,
          shuffleQuestions,
          questions: questions.map((q, i) => ({
            text: q.text,
            type: q.type,
            sortOrder: i,
            points: q.points,
            options: q.options.map((o, oi) => ({
              text: o.text,
              isCorrect: o.isCorrect,
              sortOrder: oi,
            })),
          })),
        };
        await apiClient.createQuiz(programId, payload);
      }
      setEditing(false);
      fetchQuizzes();
    } catch {
      // handle error
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishToggle(quiz: TrainingQuizListItem) {
    try {
      await apiClient.updateQuiz(programId, quiz.id, {
        isPublished: !quiz.isPublished,
      });
      fetchQuizzes();
    } catch {
      // handle error
    }
  }

  async function handleDeleteQuiz(quizId: string) {
    try {
      await apiClient.deleteQuiz(programId, quizId);
      fetchQuizzes();
    } catch {
      // handle error
    }
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => setEditing(false)}
            className="mb-3 flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Quizzes
          </button>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {editingQuiz ? "Edit Quiz" : "Create Quiz"}
          </h1>
        </div>

        {/* Quiz settings */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Quiz Settings
          </h3>
          <div className="space-y-4">
            <Input
              id="quiz-title"
              label="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Cybersecurity Awareness Quiz"
            />
            <Textarea
              id="quiz-desc"
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions for the quiz taker..."
            />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Input
                id="passing-score"
                label="Passing Score (%)"
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(Number(e.target.value))}
              />
              <Input
                id="time-limit"
                label="Time Limit (minutes)"
                type="number"
                min={1}
                value={timeLimitMinutes ?? ""}
                onChange={(e) =>
                  setTimeLimitMinutes(e.target.value ? Number(e.target.value) : null)
                }
                placeholder="No limit"
              />
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={(e) => setShuffleQuestions(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  Shuffle questions
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Questions ({questions.length})
            </h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQuestions((p) => [...p, newQuestion()])}
            >
              + Add Question
            </Button>
          </div>

          {questions.map((q, qi) => (
            <Card key={qi}>
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Q{qi + 1}
                  </span>
                  {questions.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 dark:text-red-400"
                      onClick={() => removeQuestion(qi)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <Textarea
                  id={`q-${qi}`}
                  label="Question"
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                  placeholder="Enter the question..."
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    id={`q-type-${qi}`}
                    label="Type"
                    options={QUESTION_TYPE_OPTIONS}
                    value={q.type}
                    onChange={(e) => changeQuestionType(qi, e.target.value as QuizQuestionType)}
                  />
                  <Input
                    id={`q-pts-${qi}`}
                    label="Points"
                    type="number"
                    min={1}
                    value={q.points}
                    onChange={(e) =>
                      updateQuestion(qi, {
                        points: Number(e.target.value) || 1,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    Options — select the correct answer
                    {q.type === "multi_select" ? "(s)" : ""}
                  </p>
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input
                        type={q.type === "multi_select" ? "checkbox" : "radio"}
                        name={`q-${qi}-correct`}
                        checked={opt.isCorrect}
                        onChange={() => updateOption(qi, oi, { isCorrect: true })}
                        className="h-4 w-4 border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => updateOption(qi, oi, { text: e.target.value })}
                        placeholder={`Option ${oi + 1}`}
                        className="flex-1"
                      />
                      {q.options.length > 2 && (
                        <button
                          onClick={() => removeOption(qi, oi)}
                          className="rounded p-1 text-neutral-400 hover:text-red-500"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  {q.type !== "true_false" && (
                    <button
                      onClick={() => addOption(qi)}
                      className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                    >
                      + Add option
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Save */}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!title.trim()}>
            {editingQuiz ? "Save Changes" : "Create Quiz"}
          </Button>
        </div>
      </div>
    );
  }

  // --- Quiz list view ---
  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push(`/training/${programId}`)}
          className="mb-3 flex items-center gap-1 text-sm text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Back to Program
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Quizzes</h1>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Create and manage cybersecurity awareness quizzes for this program
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAiTopic("Cybersecurity Awareness");
                setAiNumQuestions(10);
                setAiDifficulty("intermediate");
                setAiContext("");
                setAiError(null);
                openAiModal();
              }}
            >
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                Generate with AI
              </span>
            </Button>
            <Button onClick={startCreate}>Create Quiz</Button>
          </div>
        </div>
      </div>

      <EnterpriseRequiredBanner
        open={enterpriseToast.open}
        feature={enterpriseToast.feature}
        onClose={enterpriseToast.dismiss}
      />

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : quizzes.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <div className="rounded-full bg-neutral-100 p-4 dark:bg-neutral-800">
              <svg
                className="h-8 w-8 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">
              No quizzes yet
            </h3>
            <p className="mt-1 max-w-sm text-sm text-neutral-500 dark:text-neutral-400">
              Create a quiz to test employees on cybersecurity awareness. Quizzes are scored and can
              be made mandatory.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setAiTopic("Cybersecurity Awareness");
                  setAiNumQuestions(10);
                  setAiDifficulty("intermediate");
                  setAiContext("");
                  setAiError(null);
                  openAiModal();
                }}
              >
                <span className="flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                  Generate with AI
                </span>
              </Button>
              <Button onClick={startCreate}>Create Manually</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                      {quiz.title}
                    </h3>
                    {quiz.isPublished ? (
                      <Badge variant="success">Published</Badge>
                    ) : (
                      <Badge variant="neutral">Draft</Badge>
                    )}
                  </div>
                  {quiz.description && (
                    <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                      {quiz.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-4 text-xs text-neutral-400">
                    <span>{quiz._count.questions} questions</span>
                    <span>{quiz._count.attempts} attempts</span>
                    <span>Pass: {quiz.passingScore}%</span>
                    {quiz.timeLimitMinutes && <span>{quiz.timeLimitMinutes} min limit</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handlePublishToggle(quiz)}>
                    {quiz.isPublished ? "Unpublish" : "Publish"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(quiz)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/training/${programId}/quiz/${quiz.id}/results`)}
                  >
                    Results
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 dark:text-red-400"
                    onClick={() => handleDeleteQuiz(quiz.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* AI Generation Modal */}
      <Modal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        title="Generate Quiz with AI"
        description="Use AI to automatically generate quiz questions. You can review and edit them before saving."
        size="lg"
      >
        <div className="space-y-4">
          {aiError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
              {aiError}
            </div>
          )}

          <Input
            id="ai-topic"
            label="Topic"
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="e.g., Cybersecurity Awareness, Phishing Prevention"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="ai-num"
              label="Number of Questions"
              type="number"
              min={1}
              max={50}
              value={aiNumQuestions}
              onChange={(e) => setAiNumQuestions(Number(e.target.value) || 10)}
            />
            <Select
              id="ai-difficulty"
              label="Difficulty"
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
              value={aiDifficulty}
              onChange={(e) =>
                setAiDifficulty(e.target.value as "beginner" | "intermediate" | "advanced")
              }
            />
          </div>

          <Textarea
            id="ai-context"
            label="Additional Context (optional)"
            value={aiContext}
            onChange={(e) => setAiContext(e.target.value)}
            placeholder="e.g., Focus on remote work security, include GDPR-related questions..."
          />

          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
            <Button variant="ghost" onClick={() => setAiModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAIGenerate} loading={aiGenerating} disabled={!aiTopic.trim()}>
              <span className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                Generate
              </span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
