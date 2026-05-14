"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import { apiClient, type QuizAttemptItem, type TrainingQuizListItem } from "@/lib/api-client";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function QuizResultsPage() {
  const { id: programId, quizId } = useParams<{
    id: string;
    quizId: string;
  }>();
  const router = useRouter();

  const [attempts, setAttempts] = useState<QuizAttemptItem[]>([]);
  const [quiz, setQuiz] = useState<TrainingQuizListItem | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [attemptsRes, quizzesRes] = await Promise.all([
        apiClient.listQuizAttempts(programId, quizId),
        apiClient.listQuizzes(programId),
      ]);
      setAttempts(attemptsRes.data);
      const found = quizzesRes.data.find((q) => q.id === quizId);
      if (found) setQuiz(found);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [programId, quizId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const passedCount = attempts.filter((a) => a.passed).length;
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / attempts.length)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push(`/training/${programId}/quiz`)}
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
          Quiz Results{quiz ? `: ${quiz.title}` : ""}
        </h1>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-neutral-900 dark:text-white">{attempts.length}</p>
            <p className="text-xs text-neutral-500">Total Attempts</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {passedCount}
            </p>
            <p className="text-xs text-neutral-500">Passed</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{avgScore}%</p>
            <p className="text-xs text-neutral-500">Average Score</p>
          </div>
        </Card>
      </div>

      {/* Attempts table */}
      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">No attempts yet.</p>
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Employee</TableHeader>
                <TableHeader>Score</TableHeader>
                <TableHeader>Percentage</TableHeader>
                <TableHeader>Result</TableHeader>
                <TableHeader>Submitted</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {attempts.map((attempt) => (
                <TableRow key={attempt.id}>
                  <TableCell>
                    {attempt.user ? (
                      <div>
                        <p className="font-medium text-neutral-900 dark:text-white">
                          {attempt.user.name}
                        </p>
                        <p className="text-xs text-neutral-400">{attempt.user.email}</p>
                      </div>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {attempt.score}/{attempt.totalPoints}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
                        <div
                          className={`h-full rounded-full ${
                            (attempt.percentage ?? 0) >= (quiz?.passingScore ?? 70)
                              ? "bg-emerald-500"
                              : "bg-red-500"
                          }`}
                          style={{
                            width: `${attempt.percentage ?? 0}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm">{attempt.percentage}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {attempt.passed ? (
                      <Badge variant="success">Passed</Badge>
                    ) : (
                      <Badge variant="danger">Failed</Badge>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(attempt.completedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
