"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient, type TrainingQuizDetail, type QuizAttemptItem } from "@/lib/api-client";

export default function QuizTakePage() {
  const { id: programId, quizId } = useParams<{
    id: string;
    quizId: string;
  }>();
  const router = useRouter();

  const [quiz, setQuiz] = useState<TrainingQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizAttemptItem | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const fetchQuiz = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getQuizForTaking(programId, quizId);
      setQuiz(res.data);
      if (res.data.timeLimitMinutes) {
        setTimeLeft(res.data.timeLimitMinutes * 60);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [programId, quizId]);

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || result) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, result]);

  useEffect(() => {
    if (timeLeft === 0 && !result && quiz) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);

  async function handleSubmit() {
    if (!quiz) return;
    setSubmitting(true);
    try {
      const answerPayload = quiz.questions.map((q) => ({
        questionId: q.id,
        optionId: answers[q.id] || "",
      }));
      const res = await apiClient.submitQuiz(programId, quizId, {
        answers: answerPayload.filter((a) => a.optionId),
      });
      setResult(res.data);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="py-16 text-center">
        <p className="text-neutral-500 dark:text-neutral-400">Quiz not available.</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => router.push(`/training/${programId}`)}
        >
          Back to Program
        </Button>
      </div>
    );
  }

  if (result) {
    const correctCount = result.answers?.filter((a) => a.isCorrect).length ?? 0;
    const totalQ = quiz.questions.length;

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <div className="text-center">
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                result.passed ? "bg-emerald-100 dark:bg-emerald-900" : "bg-red-100 dark:bg-red-900"
              }`}
            >
              {result.passed ? (
                <svg
                  className="h-10 w-10 text-emerald-600 dark:text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="h-10 w-10 text-red-600 dark:text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
              {result.passed ? "Congratulations!" : "Not Quite"}
            </h2>
            <p className="mt-1 text-neutral-500 dark:text-neutral-400">
              {result.passed
                ? "You passed the quiz. Your training is marked as complete."
                : `You need ${quiz.passingScore}% to pass. You can retake the quiz.`}
            </p>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {result.percentage}%
              </p>
              <p className="text-xs text-neutral-500">Score</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {correctCount}/{totalQ}
              </p>
              <p className="text-xs text-neutral-500">Correct</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                {result.score}/{result.totalPoints}
              </p>
              <p className="text-xs text-neutral-500">Points</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="secondary" onClick={() => router.push(`/training/${programId}`)}>
              Back to Program
            </Button>
            {!result.passed && (
              <Button
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  if (quiz.timeLimitMinutes) {
                    setTimeLeft(quiz.timeLimitMinutes * 60);
                  }
                }}
              >
                Retake Quiz
              </Button>
            )}
          </div>
        </Card>

        {/* Answer review */}
        <Card>
          <h3 className="mb-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            Answer Review
          </h3>
          <div className="space-y-4">
            {result.answers?.map((a, i) => (
              <div
                key={a.id}
                className={`rounded-lg border p-3 ${
                  a.isCorrect
                    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950"
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                }`}
              >
                <p className="text-sm font-medium text-neutral-900 dark:text-white">
                  {i + 1}. {a.question.text}
                </p>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Your answer: {a.option?.text ?? "No answer"} —{" "}
                  {a.isCorrect ? (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      Correct
                    </span>
                  ) : (
                    <span className="font-medium text-red-600 dark:text-red-400">Incorrect</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = quiz.questions.length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white">{quiz.title}</h1>
            {quiz.description && (
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                {quiz.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div
                className={`rounded-lg px-3 py-1.5 text-sm font-mono font-semibold ${
                  timeLeft < 60
                    ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                    : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                }`}
              >
                {formatTime(timeLeft)}
              </div>
            )}
            <Badge variant="info">
              {answeredCount}/{totalQuestions} answered
            </Badge>
          </div>
        </div>
      </Card>

      {/* Questions */}
      {quiz.questions.map((question, qi) => (
        <Card key={question.id}>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                <span className="mr-2 text-blue-600 dark:text-blue-400">Q{qi + 1}.</span>
                {question.text}
              </p>
              <span className="shrink-0 text-xs text-neutral-400">
                {question.points} pt{question.points !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="space-y-2">
              {question.options.map((option) => {
                const selected = answers[question.id] === option.id;
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                      selected
                        ? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                        : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={selected}
                      onChange={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: option.id,
                        }))
                      }
                      className="h-4 w-4 border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {option.text}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </Card>
      ))}

      {/* Submit */}
      <div className="flex justify-between">
        <Button variant="secondary" onClick={() => router.push(`/training/${programId}`)}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} loading={submitting} disabled={answeredCount === 0}>
          Submit Quiz ({answeredCount}/{totalQuestions} answered)
        </Button>
      </div>
    </div>
  );
}
