/**
 * Phase 6 (AI accelerators): Questionnaires workspace landing page.
 *
 * Lists every imported questionnaire with progress chips so a reviewer
 * can immediately see which deals are blocked on Q&A. Each row links
 * to the detail page where the actual review + AI-answering happens.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient, type QuestionnaireListItem, type QuestionnaireStatus } from "@/lib/api-client";

const STATUS_LABEL: Record<QuestionnaireStatus, string> = {
  draft: "Draft",
  in_progress: "In Progress",
  completed: "Completed",
  exported: "Exported",
};

const STATUS_TINT: Record<QuestionnaireStatus, string> = {
  draft: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  exported: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function QuestionnairesPage() {
  const [rows, setRows] = useState<QuestionnaireListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.listQuestionnaires();
        if (!cancelled) setRows(res.data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "Failed to load questionnaires");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Questionnaires
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Import customer security questionnaires (CAIQ, SIG, CSV) and let AI draft answers
            grounded in your policies and organisation context.
          </p>
        </div>
        <Link
          href="/questionnaires/new"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow hover:bg-blue-700"
        >
          + Import questionnaire
        </Link>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800">
            <thead className="bg-neutral-50 dark:bg-neutral-950">
              <tr>
                <Th>Name</Th>
                <Th>Format</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th>Due</Th>
                <Th>Imported</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-950">
                  <Td>
                    <Link
                      href={`/questionnaires/${r.id}`}
                      className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {r.name}
                    </Link>
                    <div className="text-xs text-neutral-500">
                      {r.requester ?? "—"}
                      {r.vendor && <> · {r.vendor.name}</>}
                    </div>
                  </Td>
                  <Td>
                    <span className="inline-block rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                      {r.sourceFormat}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TINT[r.status]}`}
                    >
                      {STATUS_LABEL[r.status]}
                    </span>
                  </Td>
                  <Td>
                    <ProgressBar
                      total={r.questionCount}
                      approved={r.progress.approved}
                      draft={r.progress.draft}
                    />
                  </Td>
                  <Td className="text-sm text-neutral-600 dark:text-neutral-300">
                    {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—"}
                  </Td>
                  <Td className="text-xs text-neutral-500">
                    {r.importedBy?.name ?? "—"}
                    <div>{new Date(r.createdAt).toLocaleDateString()}</div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-sm ${className}`}>{children}</td>;
}

function ProgressBar({
  total,
  approved,
  draft,
}: {
  total: number;
  approved: number;
  draft: number;
}) {
  const approvedPct = total > 0 ? (approved / total) * 100 : 0;
  const draftPct = total > 0 ? (draft / total) * 100 : 0;
  return (
    <div className="w-40">
      <div className="flex h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div className="bg-green-500" style={{ width: `${approvedPct}%` }} />
        <div className="bg-blue-400" style={{ width: `${draftPct}%` }} />
      </div>
      <div className="mt-1 text-[10px] text-neutral-500">
        {approved} approved · {draft} drafted · {Math.max(0, total - approved - draft)} pending
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center dark:border-neutral-700 dark:bg-neutral-900">
      <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
        No questionnaires yet
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-neutral-500">
        Import a CAIQ, SIG, or any CSV file with a "Question" column. The AI answerer will draft
        responses grounded in your approved policies and organisation context.
      </p>
      <Link
        href="/questionnaires/new"
        className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
      >
        Import your first questionnaire
      </Link>
    </div>
  );
}
