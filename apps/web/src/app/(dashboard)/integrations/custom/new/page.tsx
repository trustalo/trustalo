"use client";

/**
 * Phase 4 (AI accelerators): "Add automated check" wizard.
 *
 * Three sequential steps with no skip-ahead:
 *
 *   1. Prompt    — free-text instruction describing what to verify.
 *                  Server-side denylist + LLM safety prompt reject obvious
 *                  destructive intents before persistence.
 *   2. Spec      — preview the AI-generated runner spec; admin can edit
 *                  the JSON in-place before testing or saving.
 *   3. Test+Save — run the spec live (HTTP runner only, browser runs
 *                  asynchronously after save) and persist as a custom
 *                  IntegrationCheck under the org's "custom" connector.
 *
 * The wizard stays inside the existing /integrations workspace so admins
 * can mix manifest-driven and AI-authored checks side-by-side.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type {
  GeneratedCheckDraft,
  HttpCheckTestResult,
  IntegrationCheckSeverity,
} from "@/lib/api-client";

type Step = "prompt" | "spec" | "test";

const SEVERITY_OPTIONS: IntegrationCheckSeverity[] = ["low", "medium", "high", "critical"];

const SAMPLE_PROMPTS = [
  "Verify TLS on https://app.example.com expires more than 30 days from now",
  "Check that https://example.com returns HTTP 200 and the Strict-Transport-Security header is set",
  "Confirm https://example.com/.well-known/security.txt is reachable and contains the word Contact",
];

export default function NewCustomCheckPage() {
  const [step, setStep] = useState<Step>("prompt");
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [draft, setDraft] = useState<GeneratedCheckDraft | null>(null);

  const [editableSpec, setEditableSpec] = useState<string>("{}");
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [editableSeverity, setEditableSeverity] = useState<IntegrationCheckSeverity>("medium");
  const [editableSchedule, setEditableSchedule] = useState("0 6 * * *");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<HttpCheckTestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ id: string; title: string } | null>(null);

  const parsedSpec = useMemo(() => {
    try {
      return { ok: true as const, value: JSON.parse(editableSpec) as unknown };
    } catch (err) {
      return { ok: false as const, message: err instanceof Error ? err.message : String(err) };
    }
  }, [editableSpec]);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setDraft(null);
    try {
      const res = await apiClient.generateCheckFromPrompt(prompt.trim());
      setDraft(res.data);
      setEditableSpec(JSON.stringify(res.data.spec, null, 2));
      setEditableTitle(res.data.suggestedTitle);
      setEditableDescription(res.data.suggestedDescription);
      setEditableSeverity(res.data.suggestedSeverity);
      setEditableSchedule(res.data.suggestedSchedule);
      setStep("spec");
    } catch (err) {
      setGenerateError(extractMessage(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleTest() {
    if (!draft) return;
    if (!parsedSpec.ok) {
      setTestError(`Spec is not valid JSON: ${parsedSpec.message}`);
      return;
    }
    setTesting(true);
    setTestError(null);
    setTestResult(null);
    try {
      const res = await apiClient.testCheckSpec({ runner: draft.runner, spec: parsedSpec.value });
      setTestResult(res.data);
    } catch (err) {
      setTestError(extractMessage(err));
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    if (!parsedSpec.ok) {
      setSaveError(`Spec is not valid JSON: ${parsedSpec.message}`);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const res = await apiClient.saveCheckFromPrompt({
        prompt,
        runner: draft.runner,
        spec: parsedSpec.value as never,
        title: editableTitle.trim(),
        description: editableDescription.trim(),
        severity: editableSeverity,
        schedule: editableSchedule.trim(),
        modelUsed: draft.modelUsed,
      });
      setSaved({ id: res.data.id, title: res.data.title });
    } catch (err) {
      setSaveError(extractMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6">
        <Link href="/integrations/checks" className="text-sm text-blue-600 hover:underline">
          ← Back to Integrations
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">
          New automated check from natural language
        </h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Describe what should be verified — Trustalo will draft a runnable check, let you preview
          the spec, and test it before turning it into recurring evidence.
        </p>
      </div>

      <Stepper step={step} />

      {step === "prompt" && (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <label
            htmlFor="prompt"
            className="block text-sm font-medium text-neutral-900 dark:text-white"
          >
            What should this check verify?
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder="e.g. Verify TLS on https://app.acme.com is valid for at least 30 more days"
            className="mt-2 w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
          />
          <p className="mt-2 text-xs text-neutral-500">
            Read-only verifications only. Destructive intents (delete, disable, escalate, …) are
            blocked before reaching the model.
          </p>

          <div className="mt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">
              Examples
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="rounded-full border border-neutral-200 px-3 py-1 text-xs text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {generateError && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {generateError}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={prompt.trim().length < 3 || generating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow disabled:cursor-not-allowed disabled:opacity-50 hover:bg-blue-700"
            >
              {generating ? "Generating…" : "Generate spec →"}
            </button>
          </div>
        </section>
      )}

      {step === "spec" && draft && (
        <section className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <Pill>runner: {draft.runner}</Pill>
            <Pill>model: {draft.modelUsed}</Pill>
            <Pill>provider: {draft.providerSource}</Pill>
          </div>

          <Field label="Title">
            <input
              type="text"
              value={editableTitle}
              onChange={(e) => setEditableTitle(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
          </Field>

          <Field label="Description">
            <textarea
              value={editableDescription}
              onChange={(e) => setEditableDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Severity">
              <select
                value={editableSeverity}
                onChange={(e) => setEditableSeverity(e.target.value as IntegrationCheckSeverity)}
                className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              >
                {SEVERITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Schedule (cron)">
              <input
                type="text"
                value={editableSchedule}
                onChange={(e) => setEditableSchedule(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white p-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-white"
              />
            </Field>
          </div>

          <Field label="Spec (editable JSON)">
            <textarea
              value={editableSpec}
              onChange={(e) => setEditableSpec(e.target.value)}
              rows={Math.min(20, editableSpec.split("\n").length + 1)}
              spellCheck={false}
              className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-3 font-mono text-xs leading-relaxed dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
            />
            {!parsedSpec.ok && (
              <p className="mt-1 text-xs text-red-600">JSON error: {parsedSpec.message}</p>
            )}
          </Field>

          {draft.suggestedFrameworkRefs.length > 0 && (
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Suggested framework mappings
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {draft.suggestedFrameworkRefs.map((ref, i) => (
                  <Pill key={`${ref.framework}-${ref.requirement}-${i}`}>
                    {ref.framework.toUpperCase()} · {ref.requirement}
                  </Pill>
                ))}
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                Mappings are advisory; auto-link to controls happens after save based on the matched
                requirement IDs.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep("prompt")}
              className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
            >
              ← Edit prompt
            </button>
            <button
              type="button"
              onClick={() => setStep("test")}
              disabled={!parsedSpec.ok}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow disabled:cursor-not-allowed disabled:opacity-50 hover:bg-blue-700"
            >
              Continue to test →
            </button>
          </div>
        </section>
      )}

      {step === "test" && draft && (
        <section className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
          {draft.runner === "browser" ? (
            <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Browser checks run inside the collector container. After save, use the standard "Run
              now" action on the integration detail page to see the first execution.
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !parsedSpec.ok}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-950 dark:text-white dark:hover:bg-neutral-800"
              >
                {testing ? "Running…" : "Run test now"}
              </button>
              {testError && (
                <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                  {testError}
                </div>
              )}
              {testResult && (
                <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-950">
                  <div className="flex items-center gap-3">
                    <StatusBadge status={testResult.status} />
                    <span className="text-neutral-500">{testResult.durationMs}ms</span>
                    {testResult.responseStatus && (
                      <span className="text-neutral-500">HTTP {testResult.responseStatus}</span>
                    )}
                    {testResult.tlsValidUntil && (
                      <span className="text-neutral-500">
                        TLS valid until {testResult.tlsValidUntil}
                      </span>
                    )}
                  </div>
                  {testResult.failures.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-red-700 dark:text-red-300">
                      {testResult.failures.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  )}
                  {testResult.error && (
                    <div className="mt-3 rounded bg-red-100 px-3 py-2 text-red-800 dark:bg-red-900/40 dark:text-red-200">
                      {testResult.error}
                    </div>
                  )}
                  {testResult.bodySnippet && (
                    <pre className="mt-3 max-h-40 overflow-auto rounded bg-white p-2 text-xs text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
                      {testResult.bodySnippet}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          {saveError && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {saveError}
            </div>
          )}

          {saved ? (
            <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-200">
              Saved <span className="font-medium">{saved.title}</span>.{" "}
              <Link href="/integrations/checks" className="underline">
                View in integrations →
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep("spec")}
                className="text-sm text-neutral-600 hover:underline dark:text-neutral-400"
              >
                ← Edit spec
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !parsedSpec.ok}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow disabled:cursor-not-allowed disabled:opacity-50 hover:bg-green-700"
              >
                {saving ? "Saving…" : "Save check"}
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Stepper({ step }: { step: Step }) {
  const stages: { id: Step; label: string }[] = [
    { id: "prompt", label: "Prompt" },
    { id: "spec", label: "Spec preview" },
    { id: "test", label: "Test + Save" },
  ];
  const active = stages.findIndex((s) => s.id === step);
  return (
    <ol className="mb-6 flex items-center gap-3 text-xs">
      {stages.map((s, i) => {
        const reached = i <= active;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={
                reached
                  ? "flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 font-semibold text-white"
                  : "flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 font-semibold text-neutral-500 dark:bg-neutral-800"
              }
            >
              {i + 1}
            </span>
            <span className={reached ? "text-neutral-900 dark:text-white" : "text-neutral-500"}>
              {s.label}
            </span>
            {i < stages.length - 1 && (
              <span className="mx-2 h-px w-10 bg-neutral-300 dark:bg-neutral-700" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: HttpCheckTestResult["status"] }) {
  const palette: Record<HttpCheckTestResult["status"], string> = {
    pass: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200",
    fail: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
    error: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${palette[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
}

function extractMessage(err: unknown): string {
  if (!err) return "Unknown error";
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}
