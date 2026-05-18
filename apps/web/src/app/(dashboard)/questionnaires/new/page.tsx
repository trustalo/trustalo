/**
 * Phase 6 (AI accelerators): import a questionnaire.
 *
 * The user first picks an import method (upload a file or paste CSV)
 * and only the matching input is rendered. This keeps the form short
 * and removes the "which one wins?" ambiguity that the dual-input
 * version had.
 *
 *   • Upload     — .csv (read in-browser → JSON post) or .xlsx / .xls
 *                  / .docx (multipart → server parses).
 *   • Paste CSV  — textarea, posts JSON. Useful when the user is
 *                  pulling rows out of a Google Sheet / email body.
 *
 * Switching method clears the previous input so the submit branch
 * decision stays unambiguous.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  apiClient,
  type QuestionnaireImportJob,
  type QuestionnaireImportSheetProgress,
} from "@/lib/api-client";
import {
  isEnterpriseLicenseError,
  useEnterpriseGated,
  useEnterpriseToast,
} from "@/lib/enterprise-license";
import { EnterpriseRequiredBanner } from "@/components/ai/enterprise-required-banner";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPT_ATTR = [
  ".csv",
  ".xlsx",
  ".xls",
  ".docx",
  "text/csv",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
].join(",");

const TEXT_LIKE_EXTS = ["csv", "txt"];
const BINARY_EXTS = ["xlsx", "xls", "docx"];

type ImportMethod = "upload" | "paste";

export default function NewQuestionnairePage() {
  const router = useRouter();
  const [method, setMethod] = useState<ImportMethod>("upload");
  const [name, setName] = useState("");
  const [requester, setRequester] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [csv, setCsv] = useState("");
  const [binaryFile, setBinaryFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const aiGated = useEnterpriseGated();
  const enterpriseToast = useEnterpriseToast();

  // jobId (truthy) flips the page to the progress view. We don't
  // navigate away mid-import — the user wants to watch sheets tick
  // off in real time.
  const [jobId, setJobId] = useState<string | null>(null);

  const previewLines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const detectedHeader = previewLines[0] ?? "";
  const previewRows = previewLines.slice(1, 4);

  const hasInput =
    method === "upload" ? binaryFile !== null || csv.trim().length > 0 : csv.trim().length > 0;

  function switchMethod(next: ImportMethod) {
    if (next === method) return;
    setMethod(next);
    setError(null);
    setCsv("");
    setBinaryFile(null);
  }

  async function handleFile(file: File) {
    setError(null);

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File too large (${formatBytes(MAX_UPLOAD_BYTES)} max).`);
      return;
    }

    const ext = (file.name.split(".").pop() ?? "").toLowerCase();

    if (TEXT_LIKE_EXTS.includes(ext)) {
      const text = await file.text();
      setCsv(text);
      setBinaryFile(null);
    } else if (BINARY_EXTS.includes(ext)) {
      setBinaryFile(file);
      setCsv("");
    } else {
      setError(`Unsupported file type: .${ext}. Use .csv, .xlsx, .xls or .docx`);
      return;
    }

    if (!name) setName(file.name.replace(/\.[^.]+$/, ""));
  }

  function clearBinaryFile() {
    setBinaryFile(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (aiGated) {
      enterpriseToast.show("AI questionnaire import");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const meta = {
        name,
        requester: requester.trim() || undefined,
        dueDate: dueDate || undefined,
      };

      const res = binaryFile
        ? await apiClient.createQuestionnaireFromFile(binaryFile, meta)
        : await apiClient.createQuestionnaire({ ...meta, csv });

      // 202 + jobId — flip to progress view; the polling component
      // owns navigation once the job reaches a terminal state.
      setJobId(res.data.jobId);
    } catch (err) {
      if (isEnterpriseLicenseError(err)) {
        enterpriseToast.show("AI questionnaire import");
      } else {
        setError(err instanceof Error ? err.message : "Failed to import questionnaire");
      }
      setSubmitting(false);
    }
    // NOTE: don't reset `submitting` on success — we stay on the
    // progress view and the form is replaced.
  }

  if (jobId) {
    return (
      <ImportProgressView
        jobId={jobId}
        onComplete={(questionnaireId) => router.push(`/questionnaires/${questionnaireId}`)}
        onCancel={() => {
          setJobId(null);
          setSubmitting(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href="/questionnaires"
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            ← Back to Questionnaires
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
            Import questionnaire
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Pick an import method below. The importer auto-detects the question column.
          </p>
        </div>
      </header>

      <EnterpriseRequiredBanner
        open={enterpriseToast.open}
        feature={enterpriseToast.feature}
        onClose={enterpriseToast.dismiss}
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Name" required>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Acme Q1 security review"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </Field>
          <Field label="Requester">
            <input
              type="text"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              placeholder="Acme Corp procurement"
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </Field>
          <Field label="Due date">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              Import method
            </span>
            <MethodSegmented value={method} onChange={switchMethod} />
          </div>

          {method === "upload" ? (
            <UploadSection
              binaryFile={binaryFile}
              csv={csv}
              previewLines={previewLines}
              detectedHeader={detectedHeader}
              previewRows={previewRows}
              onFile={handleFile}
              onClear={clearBinaryFile}
            />
          ) : (
            <PasteSection csv={csv} onChange={setCsv} />
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Link
            href="/questionnaires"
            className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !hasInput || !name}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Importing…" : "Import"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Method picker ─────────────────────────────────────────────

function MethodSegmented({
  value,
  onChange,
}: {
  value: ImportMethod;
  onChange: (next: ImportMethod) => void;
}) {
  const options: { value: ImportMethod; label: string }[] = [
    { value: "upload", label: "Upload file" },
    { value: "paste", label: "Paste CSV" },
  ];
  return (
    <div
      role="tablist"
      aria-label="Import method"
      className="inline-flex flex-shrink-0 rounded-md border border-neutral-200 bg-neutral-50 p-0.5 text-xs dark:border-neutral-700 dark:bg-neutral-900"
    >
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`rounded px-3 py-1 font-medium transition ${
              active
                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Upload section ────────────────────────────────────────────

function UploadSection({
  binaryFile,
  csv,
  previewLines,
  detectedHeader,
  previewRows,
  onFile,
  onClear,
}: {
  binaryFile: File | null;
  csv: string;
  previewLines: string[];
  detectedHeader: string;
  previewRows: string[];
  onFile: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        CSV, Excel (.xlsx/.xls) or Word (.docx). Max {formatBytes(MAX_UPLOAD_BYTES)}.
      </p>

      <input
        type="file"
        accept={ACCEPT_ATTR}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
        }}
        className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-neutral-300 dark:file:bg-blue-950 dark:file:text-blue-300"
      />

      {binaryFile && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm dark:border-blue-900 dark:bg-blue-950">
          <div className="min-w-0">
            <div className="truncate font-semibold text-blue-900 dark:text-blue-200">
              {binaryFile.name}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-400">
              {formatBytes(binaryFile.size)} · will be parsed on the server
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            Remove
          </button>
        </div>
      )}

      {!binaryFile && csv.trim().length > 0 && previewLines.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-950">
          <div className="font-semibold text-neutral-700 dark:text-neutral-300">
            Detected headers ({previewLines.length - 1} rows)
          </div>
          <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] text-neutral-600 dark:text-neutral-400">
            {detectedHeader}
            {"\n"}
            {previewRows.join("\n")}
            {previewLines.length > 4 && `\n…and ${previewLines.length - 4} more`}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Paste section ─────────────────────────────────────────────

function PasteSection({ csv, onChange }: { csv: string; onChange: (next: string) => void }) {
  const previewLines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const detectedHeader = previewLines[0] ?? "";
  const previewRows = previewLines.slice(1, 4);

  return (
    <div className="space-y-3">
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Paste rows directly. Headers on the first row.
      </p>

      <textarea
        value={csv}
        onChange={(e) => onChange(e.target.value)}
        rows={10}
        placeholder={
          'Question,Domain,Yes/No/N/A\n"Do you encrypt data at rest?","Data Security",\n"Do you maintain a SOC 2 report?","Audit & Assurance",\n'
        }
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-xs dark:border-neutral-700 dark:bg-neutral-950"
      />

      {previewLines.length > 0 && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs dark:border-neutral-800 dark:bg-neutral-950">
          <div className="font-semibold text-neutral-700 dark:text-neutral-300">
            Detected headers ({previewLines.length - 1} rows)
          </div>
          <pre className="mt-2 overflow-x-auto whitespace-pre text-[11px] text-neutral-600 dark:text-neutral-400">
            {detectedHeader}
            {"\n"}
            {previewRows.join("\n")}
            {previewLines.length > 4 && `\n…and ${previewLines.length - 4} more`}
          </pre>
        </div>
      )}
    </div>
  );
}

// ─── Shared bits ───────────────────────────────────────────────

function Field({
  label,
  subtitle,
  required,
  children,
}: {
  label: string;
  subtitle?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </span>
        {subtitle && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</span>
        )}
      </div>
      {children}
    </label>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Import progress view ─────────────────────────────────────

/**
 * Live polling view for an in-flight import job. Polls every 1.5 s
 * while the job is non-terminal; on `completed` redirects to the new
 * questionnaire detail page; on `partial` shows a banner before
 * redirecting (the user can read which sheets failed); on `failed`
 * stops polling and shows the public-safe error.
 */
function ImportProgressView({
  jobId,
  onComplete,
  onCancel,
}: {
  jobId: string;
  onComplete: (questionnaireId: string) => void;
  onCancel: () => void;
}) {
  const [job, setJob] = useState<QuestionnaireImportJob | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  // useRef so the interval cleanup doesn't trigger on every poll.
  const pollingRef = useRef(true);

  useEffect(() => {
    pollingRef.current = true;

    let timeout: ReturnType<typeof setTimeout> | null = null;

    async function tick() {
      if (!pollingRef.current) return;
      try {
        const res = await apiClient.getQuestionnaireImportJob(jobId);
        setJob(res.data);
        const terminal = ["completed", "partial", "failed"].includes(res.data.status);
        if (terminal) {
          // Auto-navigate on success / partial after a short pause
          // so the user sees the final tick state. Failures stay on
          // this page so the user can read the message.
          if (
            (res.data.status === "completed" || res.data.status === "partial") &&
            res.data.questionnaireId
          ) {
            const id = res.data.questionnaireId;
            const delay = res.data.status === "partial" ? 2500 : 600;
            setTimeout(() => onComplete(id), delay);
          }
          return;
        }
      } catch (err) {
        setPollError(err instanceof Error ? err.message : "Polling failed");
      }
      timeout = setTimeout(tick, 1500);
    }

    void tick();

    return () => {
      pollingRef.current = false;
      if (timeout) clearTimeout(timeout);
    };
  }, [jobId, onComplete]);

  const progress = job?.progress;
  const phaseLabel = phaseToLabel(progress?.phase);
  const isFailed = job?.status === "failed";
  const isPartial = job?.status === "partial";
  const isCompleted = job?.status === "completed";
  const isWorking = !isFailed && !isPartial && !isCompleted;

  return (
    <div className="space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <Link
            href="/questionnaires"
            className="text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            ← Back to Questionnaires
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">
            Importing questionnaire…
          </h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {job?.name ?? "Preparing"} · the structure agent is reading the file sheet by sheet.
          </p>
        </div>
      </header>

      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        {/* Top status banner */}
        <div className="flex items-center gap-3">
          {isWorking && <Spinner className="h-5 w-5 text-blue-600" />}
          {isCompleted && <CheckIcon className="h-5 w-5 text-emerald-600" />}
          {isPartial && <WarnIcon className="h-5 w-5 text-amber-600" />}
          {isFailed && <ErrorIcon className="h-5 w-5 text-red-600" />}
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
            {isWorking && phaseLabel}
            {isCompleted && "Import complete — redirecting…"}
            {isPartial && "Imported with warnings — redirecting…"}
            {isFailed && "Import failed"}
          </div>
          {progress && progress.totalSheets > 0 && (
            <div className="ml-auto text-xs text-neutral-500 dark:text-neutral-400">
              {progress.completedSheets} / {progress.totalSheets} sheets ready
              {progress.failedSheets > 0 && ` · ${progress.failedSheets} failed`}
            </div>
          )}
        </div>

        {/* Per-sheet list */}
        {progress && progress.sheets.length > 0 && (
          <ul className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {progress.sheets.map((s) => (
              <SheetRow key={s.name} sheet={s} />
            ))}
          </ul>
        )}

        {/* Empty state — phase=queued/downloading and no sheets yet */}
        {(!progress || progress.sheets.length === 0) && isWorking && (
          <div className="rounded-md border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <Spinner className="mx-auto h-5 w-5 text-neutral-400" />
            <div className="mt-2">Reading the file…</div>
          </div>
        )}

        {/* Errors */}
        {isFailed && job?.errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {job.errorMessage}
          </div>
        )}
        {pollError && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            Could not poll for status: {pollError}. The import may still be running.
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2">
          {isFailed && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              Try again
            </button>
          )}
          {(isWorking || isPartial) && (
            <Link
              href="/questionnaires"
              className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              {isWorking ? "Run in background" : "Skip"}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function SheetRow({ sheet }: { sheet: QuestionnaireImportSheetProgress }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3 text-sm">
      <SheetStatusIcon status={sheet.status} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-neutral-900 dark:text-neutral-100">
          {sheet.name}
        </div>
        <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">
          {sheet.status === "running" && "Analyzing structure…"}
          {sheet.status === "pending" && "Waiting…"}
          {sheet.status === "completed" &&
            `${sheetKindLabel(sheet.kind)}${
              sheet.questionCount != null
                ? ` · ${sheet.questionCount} question${sheet.questionCount === 1 ? "" : "s"}`
                : ""
            }${sheet.durationMs != null ? ` · ${(sheet.durationMs / 1000).toFixed(1)}s` : ""}`}
          {sheet.status === "failed" && (sheet.error ?? "Could not understand this sheet")}
        </div>
      </div>
    </li>
  );
}

function SheetStatusIcon({ status }: { status: QuestionnaireImportSheetProgress["status"] }) {
  switch (status) {
    case "running":
      return <Spinner className="h-4 w-4 text-blue-600" />;
    case "completed":
      return <CheckIcon className="h-4 w-4 text-emerald-600" />;
    case "failed":
      return <ErrorIcon className="h-4 w-4 text-red-600" />;
    default:
      return (
        <span className="inline-block h-2.5 w-2.5 rounded-full border border-neutral-300 dark:border-neutral-600" />
      );
  }
}

function phaseToLabel(phase: string | undefined): string {
  switch (phase) {
    case "downloading":
      return "Loading the uploaded file…";
    case "parsing":
      return "Parsing rows…";
    case "mapping":
      return "Reading sheet structure…";
    case "persisting":
      return "Saving questions…";
    default:
      return "Queued — starting in a moment…";
  }
}

function sheetKindLabel(kind: QuestionnaireImportSheetProgress["kind"]): string {
  switch (kind) {
    case "instructions":
      return "Instructions (skipped)";
    case "metadata":
      return "Cover page";
    case "matrix":
      return "Matrix questions";
    case "csv":
      return "CSV";
    case "question_table":
    default:
      return "Questions";
  }
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.296a1 1 0 010 1.414l-7.5 7.5a1 1 0 01-1.414 0l-3.5-3.5a1 1 0 111.414-1.414L8.5 12.086l6.79-6.79a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarnIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 1.667a1.5 1.5 0 011.32.79l7.5 13.75A1.5 1.5 0 0117.5 18.5h-15a1.5 1.5 0 01-1.32-2.293l7.5-13.75A1.5 1.5 0 0110 1.667zm0 5a.833.833 0 00-.833.833v3.333a.833.833 0 001.666 0V7.5A.833.833 0 0010 6.667zm0 8.333a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 011.414 0L10 7.586l-.293-.293a1 1 0 011.414 0L11.414 9l.293.293a1 1 0 11-1.414 1.414L10 10.414l-.293.293a1 1 0 11-1.414-1.414L8.586 9l-.293-.293-.293-.293a1 1 0 010-1.414z"
        clipRule="evenodd"
      />
    </svg>
  );
}
