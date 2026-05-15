"use client";

import { useEffect, useMemo, useState, useCallback, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  collectorClient,
  CollectorError,
  type IntegrationProviderInfo,
  type IntegrationConnection,
  type CatalogCategory,
  type CredentialField,
} from "@/lib/collector-client";
import { apiClient, type AIProviderType, type AIProviderConfigItem } from "@/lib/api-client";

// ── Brand + category metadata ────────────────────────────
//
// Each provider gets a typographic monogram avatar with a brand-tinted
// background so cards remain visually distinct without bundling vendor
// logos (avoids trademark/asset-pipeline complexity while still feeling
// branded). The CSS variables hold a foreground colour for the monogram
// and a `from`/`to` pair used for a subtle gradient background.

type BrandTone = {
  initials: string;
  fg: string; // text colour for the monogram
  bgFrom: string; // gradient start (top-left)
  bgTo: string; // gradient end   (bottom-right)
};

const BRAND_TONES: Record<string, BrandTone> = {
  // Cloud / PaaS
  aws: { initials: "AW", fg: "#9A3412", bgFrom: "#FFEDD5", bgTo: "#FED7AA" },
  gcp: { initials: "GC", fg: "#1D4ED8", bgFrom: "#DBEAFE", bgTo: "#BFDBFE" },
  azure: { initials: "AZ", fg: "#1E3A8A", bgFrom: "#DBEAFE", bgTo: "#C7D2FE" },
  // Identity
  okta: { initials: "OK", fg: "#1E40AF", bgFrom: "#DBEAFE", bgTo: "#BFDBFE" },
  auth0: { initials: "A0", fg: "#9A3412", bgFrom: "#FFEDD5", bgTo: "#FECACA" },
  // Source code
  github: { initials: "GH", fg: "#171717", bgFrom: "#F5F5F5", bgTo: "#E5E5E5" },
  bitbucket: { initials: "BB", fg: "#1D4ED8", bgFrom: "#DBEAFE", bgTo: "#BFDBFE" },
  // Productivity
  "google-workspace": { initials: "GW", fg: "#047857", bgFrom: "#D1FAE5", bgTo: "#A7F3D0" },
  office365: { initials: "O3", fg: "#9A3412", bgFrom: "#FFE4E6", bgTo: "#FECACA" },
  // AI
  openai: { initials: "AI", fg: "#0F766E", bgFrom: "#CCFBF1", bgTo: "#99F6E4" },
  anthropic: { initials: "An", fg: "#9A3412", bgFrom: "#FEF3C7", bgTo: "#FDE68A" },
  bedrock: { initials: "Br", fg: "#9A3412", bgFrom: "#FFEDD5", bgTo: "#FED7AA" },
  openrouter: { initials: "Or", fg: "#6D28D9", bgFrom: "#EDE9FE", bgTo: "#DDD6FE" },
};

const FALLBACK_TONE: BrandTone = {
  initials: "·",
  fg: "#404040",
  bgFrom: "#F5F5F5",
  bgTo: "#E5E5E5",
};

function toneFor(slug: string, name?: string): BrandTone {
  const direct = BRAND_TONES[slug];
  if (direct) return direct;
  // Derive initials from name as a graceful fallback so newly added
  // providers still render a sensible avatar without a code change.
  const letters = (name ?? slug)
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return { ...FALLBACK_TONE, initials: letters || FALLBACK_TONE.initials };
}

function ProviderAvatar({ slug, name, size = 40 }: { slug: string; name?: string; size?: number }) {
  const tone = toneFor(slug, name);
  const fontSize = Math.round(size * 0.4);
  return (
    <div
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-black/5 dark:ring-white/10"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${tone.bgFrom}, ${tone.bgTo})`,
        color: tone.fg,
        fontSize,
        fontWeight: 700,
        letterSpacing: "-0.02em",
      }}
    >
      {tone.initials}
    </div>
  );
}

// ── Category metadata ────────────────────────────────────

type CategoryKey =
  | "ai"
  | "cloud"
  | "identity"
  | "code_repository"
  | "productivity"
  | "security"
  | "hr"
  | "custom";

const AI_CATEGORY_KEY = "ai";
const AI_CATEGORY_LABEL = "AI & LLM";

const CATEGORY_LABELS: Record<string, string> = {
  [AI_CATEGORY_KEY]: AI_CATEGORY_LABEL,
  cloud: "Cloud & Infrastructure",
  identity: "Identity & Access",
  code_repository: "Source Code",
  productivity: "Productivity & Email",
  security: "Security",
  hr: "Human Resources",
  custom: "Custom",
};

function CategoryIcon({
  category,
  className = "h-4 w-4",
}: {
  category: string;
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 1.6,
  } as const;
  switch (category as CategoryKey) {
    case "ai":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
      );
    case "cloud":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z"
          />
        </svg>
      );
    case "identity":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      );
    case "code_repository":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
          />
        </svg>
      );
    case "productivity":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
          />
        </svg>
      );
    case "security":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12c0 5-3.75 9.75-9 9.75S3 17 3 12V5.25l9-3.75 9 3.75V12z"
          />
        </svg>
      );
    case "hr":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      );
    case "custom":
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.759 6.759 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

// ── Status / formatting helpers ──────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case "connected":
      return <Badge variant="success">Connected</Badge>;
    case "syncing":
      return <Badge variant="info">Syncing</Badge>;
    case "error":
      return <Badge variant="danger">Error</Badge>;
    case "pending_auth":
      return <Badge variant="warning">Pending</Badge>;
    default:
      return <Badge variant="neutral">Disconnected</Badge>;
  }
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function syncFreqLabel(minutes: number): string {
  const opt = SYNC_FREQ_OPTIONS.find((o) => o.value === String(minutes));
  if (opt) return opt.label;
  if (minutes < 60) return `Every ${minutes}m`;
  const hrs = Math.round(minutes / 60);
  if (hrs < 24) return `Every ${hrs}h`;
  const days = Math.round(hrs / 24);
  return `Every ${days}d`;
}

const SYNC_FREQ_OPTIONS = [
  { value: "60", label: "Every hour" },
  { value: "360", label: "Every 6 hours" },
  { value: "720", label: "Every 12 hours" },
  { value: "1440", label: "Daily" },
  { value: "10080", label: "Weekly" },
];

// ── Reusable UI atoms ────────────────────────────────────

function CapabilityChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 ring-1 ring-inset ring-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:ring-neutral-700">
      {children}
    </span>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  count?: number;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          <span className="text-neutral-400 dark:text-neutral-500">{icon}</span>
          {title}
          {typeof count === "number" && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300">
              {count}
            </span>
          )}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// Shared card chrome — gives every integration card the same height,
// padding rhythm, hover state and bottom-pinned action row.
function IntegrationCardShell({
  avatar,
  title,
  subtitle,
  status,
  body,
  footer,
  message,
}: {
  avatar: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  status?: ReactNode;
  body?: ReactNode;
  footer: ReactNode;
  message?: ReactNode;
}) {
  return (
    <Card padding="none" className="flex h-full flex-col transition-shadow hover:shadow-md">
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start gap-3">
          {avatar}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                {title}
              </h3>
              {status}
            </div>
            {subtitle && (
              <p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {body && <div className="flex-1">{body}</div>}

        {message}
      </div>

      <div className="border-t border-neutral-100 bg-neutral-50/50 px-5 py-3 dark:border-neutral-800 dark:bg-neutral-900/40">
        {footer}
      </div>
    </Card>
  );
}

// ── Connect Modal ────────────────────────────────────────

function ConnectModal({
  provider,
  open,
  onClose,
  onSuccess,
}: {
  provider: IntegrationProviderInfo | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connectionName, setConnectionName] = useState("");
  const [syncFreq, setSyncFreq] = useState("1440");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setCredentials({});
      setConnectionName(provider.name);
      setSyncFreq("1440");
      setError(null);

      const fields = provider.configSchema?.fields ?? [];
      const defaults: Record<string, string> = {};
      for (const f of fields) {
        if (f.default) defaults[f.key] = f.default;
      }
      setCredentials(defaults);
    }
  }, [provider]);

  if (!provider) return null;
  const fields: CredentialField[] = provider.configSchema?.fields ?? [];
  const visibleFields = fields.filter((f) => {
    if (!f.showWhen) return true;
    return credentials[f.showWhen.key] === f.showWhen.value;
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await collectorClient.createConnection({
        integrationId: provider!.id,
        name: connectionName,
        credentials,
        syncFrequencyMinutes: parseInt(syncFreq, 10),
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof CollectorError ? err.message : "Failed to create connection");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Connect ${provider.name}`}
      description={provider.description ?? undefined}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="connection-name"
          label="Connection Name"
          value={connectionName}
          onChange={(e) => setConnectionName(e.target.value)}
          required
          placeholder="My AWS Account"
        />

        <div className="border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <h3 className="mb-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Credentials
          </h3>
          <div className="space-y-3">
            {visibleFields.map((field) => {
              if (field.type === "textarea") {
                return (
                  <Textarea
                    key={field.key}
                    id={`cred-${field.key}`}
                    label={field.label}
                    value={credentials[field.key] ?? ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    required={field.required}
                    placeholder={field.placeholder}
                  />
                );
              }
              if (field.type === "select" && field.options) {
                return (
                  <Select
                    key={field.key}
                    id={`cred-${field.key}`}
                    label={field.label}
                    value={credentials[field.key] ?? ""}
                    onChange={(e) =>
                      setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    required={field.required}
                    options={field.options}
                    placeholder={field.placeholder ?? `Select ${field.label}`}
                  />
                );
              }
              return (
                <Input
                  key={field.key}
                  id={`cred-${field.key}`}
                  label={field.label}
                  type={field.type === "password" ? "password" : "text"}
                  value={credentials[field.key] ?? ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  required={field.required}
                  placeholder={field.placeholder}
                  helperText={field.description}
                />
              );
            })}
          </div>
        </div>

        <Select
          id="sync-frequency"
          label="Sync Frequency"
          value={syncFreq}
          onChange={(e) => setSyncFreq(e.target.value)}
          options={SYNC_FREQ_OPTIONS}
        />

        <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Connect
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── AI Provider Modal ────────────────────────────────────

const AI_PROVIDERS: {
  id: AIProviderType;
  name: string;
  description: string;
  fields: { key: string; label: string; type: string; required: boolean; placeholder: string }[];
}[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4.1, and o-series models",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", required: true, placeholder: "sk-..." },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Sonnet 4 and Claude 3.5 models",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "sk-ant-...",
      },
    ],
  },
  {
    id: "bedrock",
    name: "AWS Bedrock",
    description: "Claude, Nova, and other models via AWS",
    fields: [
      {
        key: "accessKeyId",
        label: "Access Key ID",
        type: "text",
        required: true,
        placeholder: "AKIA...",
      },
      {
        key: "secretAccessKey",
        label: "Secret Access Key",
        type: "password",
        required: true,
        placeholder: "Secret key",
      },
      { key: "region", label: "Region", type: "text", required: true, placeholder: "us-east-1" },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access 200+ models from a single API key",
    fields: [
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        required: true,
        placeholder: "sk-or-...",
      },
      {
        key: "baseUrl",
        label: "Base URL (optional)",
        type: "text",
        required: false,
        placeholder: "https://openrouter.ai/api/v1",
      },
    ],
  },
];

function AIProviderModal({
  provider,
  existing,
  open,
  onClose,
  onSuccess,
}: {
  provider: (typeof AI_PROVIDERS)[number] | null;
  existing: AIProviderConfigItem | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (provider) {
      setValues({});
      setError(null);
      setTestResult(null);
    }
  }, [provider]);

  if (!provider) return null;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiClient.upsertAIProvider(provider!.id, values);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save provider");
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      // Save first so the test uses the freshly entered credentials.
      await apiClient.upsertAIProvider(provider!.id, values);
      const res = await apiClient.testAIProvider(provider!.id);
      if (res.success && res.data) {
        setTestResult(`Connected — model: ${res.data.model}`);
      } else {
        setError((res as any).error || "Test failed");
      }
    } catch (err: any) {
      setError(err.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Configure ${provider.name}`}
      description={provider.description}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}
        {testResult && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {testResult}
          </div>
        )}

        {existing && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Already configured. Enter new values to update, or leave blank to keep current
            credentials.
          </div>
        )}

        {provider.fields.map((field) => (
          <Input
            key={field.key}
            id={`ai-${field.key}`}
            label={field.label}
            type={field.type === "password" ? "password" : "text"}
            value={values[field.key] ?? ""}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
            required={field.required && !existing}
            placeholder={field.placeholder}
          />
        ))}

        <div className="flex justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="ghost" onClick={handleTest} loading={testing}>
            Test Connection
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Settings Modal ───────────────────────────────────────

function SettingsModal({
  connection,
  open,
  onClose,
  onUpdate,
  onDelete,
}: {
  connection: IntegrationConnection | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState("");
  const [syncFreq, setSyncFreq] = useState("1440");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connection) {
      setName(connection.name);
      setSyncFreq(String(connection.syncFrequencyMinutes));
      setIsActive(connection.isActive);
      setDeleteConfirm(false);
      setError(null);
    }
  }, [connection]);

  if (!connection) return null;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await collectorClient.updateConnection(connection!.id, {
        name,
        syncFrequencyMinutes: parseInt(syncFreq, 10),
        isActive,
      });
      onUpdate();
      onClose();
    } catch (err) {
      setError(err instanceof CollectorError ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setLoading(true);
    try {
      await collectorClient.deleteConnection(connection!.id);
      onDelete();
      onClose();
    } catch (err) {
      setError(err instanceof CollectorError ? err.message : "Failed to delete");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Settings: ${connection.name}`}
      description={`Provider: ${connection.integration.name}`}
    >
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <Input
          id="settings-name"
          label="Connection Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Select
          id="settings-sync-freq"
          label="Sync Frequency"
          value={syncFreq}
          onChange={(e) => setSyncFreq(e.target.value)}
          options={SYNC_FREQ_OPTIONS}
        />

        <div className="flex items-center gap-3">
          <input
            id="settings-active"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
          />
          <label
            htmlFor="settings-active"
            className="text-sm text-neutral-700 dark:text-neutral-300"
          >
            Active (enable scheduled syncs)
          </label>
        </div>

        {connection.lastErrorMessage && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <strong>Last error:</strong> {connection.lastErrorMessage}
          </div>
        )}

        <div className="flex justify-between border-t border-neutral-200 pt-4 dark:border-neutral-800">
          <Button type="button" variant="danger" size="sm" onClick={handleDelete} loading={loading}>
            {deleteConfirm ? "Confirm Delete" : "Delete Connection"}
          </Button>
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ────────────────────────────────────────────

export default function IntegrationsPage() {
  const [catalog, setCatalog] = useState<CatalogCategory[]>([]);
  const [connections, setConnections] = useState<IntegrationConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [connectProvider, setConnectProvider] = useState<IntegrationProviderInfo | null>(null);
  const [settingsConnection, setSettingsConnection] = useState<IntegrationConnection | null>(null);

  const [aiProviders, setAiProviders] = useState<AIProviderConfigItem[]>([]);
  const [editingAIProvider, setEditingAIProvider] = useState<(typeof AI_PROVIDERS)[number] | null>(
    null,
  );
  const [aiTestLoading, setAiTestLoading] = useState<Record<string, boolean>>({});
  const [aiTestMessage, setAiTestMessage] = useState<{
    provider: string;
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionMessage, setActionMessage] = useState<{
    id: string;
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Catalog browsing controls
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  const loadAIProviders = useCallback(async () => {
    try {
      const res = await apiClient.listAIProviders();
      setAiProviders(res.data);
    } catch {
      // AI providers are optional — swallow so the page still renders.
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [catalogRes, connsRes] = await Promise.all([
        collectorClient.getProviderCatalog(),
        collectorClient.listConnections(),
      ]);
      setCatalog(catalogRes.data);
      setConnections(connsRes.data);
      setPageError(null);
    } catch (err) {
      setPageError(
        err instanceof CollectorError
          ? err.message
          : "Failed to load integrations. Is the collector service running?",
      );
    } finally {
      setLoading(false);
    }
    await loadAIProviders();
  }, [loadAIProviders]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function setActionState(id: string, isLoading: boolean) {
    setActionLoading((prev) => ({ ...prev, [id]: isLoading }));
  }

  function showMessage(id: string, type: "success" | "error", text: string) {
    setActionMessage({ id, type, text });
    setTimeout(() => setActionMessage(null), 4000);
  }

  async function handleTestConnection(connectionId: string) {
    setActionState(connectionId, true);
    try {
      const res = await collectorClient.testConnection(connectionId);
      showMessage(connectionId, res.data.success ? "success" : "error", res.data.message);
      await loadData();
    } catch (err) {
      showMessage(
        connectionId,
        "error",
        err instanceof CollectorError ? err.message : "Test failed",
      );
    } finally {
      setActionState(connectionId, false);
    }
  }

  async function handleSyncNow(connectionId: string) {
    setActionState(connectionId, true);
    try {
      await collectorClient.triggerJob(connectionId);
      showMessage(connectionId, "success", "Sync job triggered successfully");
      await loadData();
    } catch (err) {
      showMessage(
        connectionId,
        "error",
        err instanceof CollectorError ? err.message : "Failed to trigger sync",
      );
    } finally {
      setActionState(connectionId, false);
    }
  }

  async function handleAITest(providerId: AIProviderType) {
    setAiTestLoading((p) => ({ ...p, [providerId]: true }));
    try {
      const res = await apiClient.testAIProvider(providerId);
      if (res.success && res.data) {
        setAiTestMessage({
          provider: providerId,
          type: "success",
          text: `Connected — ${res.data.model}`,
        });
      } else {
        setAiTestMessage({
          provider: providerId,
          type: "error",
          text: (res as any).error || "Failed",
        });
      }
    } catch (err: any) {
      setAiTestMessage({ provider: providerId, type: "error", text: err.message || "Failed" });
    } finally {
      setAiTestLoading((p) => ({ ...p, [providerId]: false }));
      setTimeout(() => setAiTestMessage(null), 5000);
    }
  }

  async function handleAIRemove(providerId: AIProviderType) {
    await apiClient.deleteAIProvider(providerId);
    loadAIProviders();
  }

  // ── Unified connected + catalog data model ─────────────────────────
  //
  // AI providers and collector-backed integrations share the same card
  // shell so we project both into discriminated-union shapes here. The
  // render code then only switches on `kind` to pick the right footer
  // actions/body — everything else (avatar, header, grid) is identical.

  const connectedProviderIds = useMemo(
    () => new Set(connections.map((c) => c.integrationId)),
    [connections],
  );

  const configuredAIIds = useMemo(() => new Set(aiProviders.map((a) => a.provider)), [aiProviders]);

  type ConnectedEntry =
    | { kind: "integration"; key: string; conn: IntegrationConnection }
    | { kind: "ai"; key: string; meta: (typeof AI_PROVIDERS)[number]; cfg: AIProviderConfigItem };

  const unifiedConnected = useMemo<ConnectedEntry[]>(() => {
    const aiEntries: ConnectedEntry[] = AI_PROVIDERS.flatMap((meta) => {
      const cfg = aiProviders.find((a) => a.provider === meta.id);
      return cfg ? [{ kind: "ai" as const, key: `ai-${meta.id}`, meta, cfg }] : [];
    });
    const intEntries: ConnectedEntry[] = connections.map((conn) => ({
      kind: "integration" as const,
      key: `int-${conn.id}`,
      conn,
    }));
    return [...aiEntries, ...intEntries];
  }, [aiProviders, connections]);

  type CatalogEntry =
    | { kind: "integration"; key: string; provider: IntegrationProviderInfo }
    | { kind: "ai"; key: string; meta: (typeof AI_PROVIDERS)[number] };

  type CatalogGroup = { category: string; label: string; entries: CatalogEntry[] };

  const filteredCatalog = useMemo<CatalogGroup[]>(() => {
    const term = search.trim().toLowerCase();

    const matchesSearch = (
      name: string,
      description: string | null | undefined,
      extras: string[] = [],
    ) => {
      if (!term) return true;
      return (
        name.toLowerCase().includes(term) ||
        (description ?? "").toLowerCase().includes(term) ||
        extras.some((e) => e.toLowerCase().includes(term))
      );
    };

    const groups: CatalogGroup[] = [];

    if (activeCategory === "all" || activeCategory === AI_CATEGORY_KEY) {
      const aiEntries: CatalogEntry[] = AI_PROVIDERS.filter((p) => !configuredAIIds.has(p.id))
        .filter((p) => matchesSearch(p.name, p.description))
        .map((meta) => ({ kind: "ai" as const, key: `ai-${meta.id}`, meta }));
      if (aiEntries.length > 0) {
        groups.push({
          category: AI_CATEGORY_KEY,
          label: AI_CATEGORY_LABEL,
          entries: aiEntries,
        });
      }
    }

    for (const cat of catalog) {
      // The frontend owns the `ai` category via the virtual AI section
      // above (hardcoded `AI_PROVIDERS`, distinct CatalogEntry kind).
      // Skip any backend ai-category group to avoid a duplicate React
      // key on `group.category` and a mixed-kind section the renderer
      // can't satisfy.
      if (cat.category === AI_CATEGORY_KEY) continue;
      if (activeCategory !== "all" && cat.category !== activeCategory) continue;
      const entries: CatalogEntry[] = cat.integrations
        .filter((p) => !connectedProviderIds.has(p.id))
        .filter((p) => matchesSearch(p.name, p.description, p.capabilities))
        .map((provider) => ({ kind: "integration" as const, key: `int-${provider.id}`, provider }));
      if (entries.length > 0) {
        groups.push({
          category: cat.category,
          label: CATEGORY_LABELS[cat.category] ?? cat.label,
          entries,
        });
      }
    }

    return groups;
  }, [catalog, connectedProviderIds, configuredAIIds, activeCategory, search]);

  const totalAvailable = useMemo(() => {
    const aiCount = AI_PROVIDERS.filter((p) => !configuredAIIds.has(p.id)).length;
    const intCount = catalog.reduce(
      (sum, c) => sum + c.integrations.filter((p) => !connectedProviderIds.has(p.id)).length,
      0,
    );
    return aiCount + intCount;
  }, [catalog, connectedProviderIds, configuredAIIds]);

  // Category chips: surface a virtual "AI & LLM" chip (owned by the
  // frontend's hardcoded AI_PROVIDERS list) plus every backend category
  // except `ai` — the virtual chip already covers that key, and a
  // backend ai-category row would duplicate it.
  const categoryOptions = useMemo(() => {
    const opts: { key: string; label: string }[] = [
      { key: AI_CATEGORY_KEY, label: AI_CATEGORY_LABEL },
    ];
    for (const cat of catalog) {
      if (cat.category === AI_CATEGORY_KEY) continue;
      opts.push({ key: cat.category, label: CATEGORY_LABELS[cat.category] ?? cat.label });
    }
    return opts;
  }, [catalog]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 animate-spin text-blue-600"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="mt-3 text-sm text-neutral-500">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Integrations</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Connect your tools to automate evidence collection and compliance monitoring.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/integrations/checks"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            View Checks
          </Link>
          <Link
            href="/integrations/custom/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Custom Integration
          </Link>
        </div>
      </div>

      {pageError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {pageError}
          <Button variant="ghost" size="sm" className="ml-3" onClick={loadData}>
            Retry
          </Button>
        </div>
      )}

      {/* ── Connected (AI + integrations, unified) ── */}
      {unifiedConnected.length > 0 && (
        <section>
          <SectionHeader
            icon={
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.6}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            }
            title="Connected"
            count={unifiedConnected.length}
            description="Active providers — AI, cloud and SaaS — feeding your evidence pipeline."
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {unifiedConnected.map((entry) => {
              if (entry.kind === "ai") {
                const { meta, cfg } = entry;
                const status = cfg.isEnabled ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="neutral">Disabled</Badge>
                );
                return (
                  <IntegrationCardShell
                    key={entry.key}
                    avatar={<ProviderAvatar slug={meta.id} name={meta.name} />}
                    title={meta.name}
                    subtitle={AI_CATEGORY_LABEL}
                    status={status}
                    body={
                      <div className="rounded-md bg-neutral-50 px-3 py-2 font-mono text-[11px] text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
                        Key: {cfg.apiKey ?? "••••••••"}
                      </div>
                    }
                    message={
                      aiTestMessage?.provider === meta.id && (
                        <div
                          className={`rounded-md px-3 py-2 text-xs ${
                            aiTestMessage.type === "success"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                          }`}
                        >
                          {aiTestMessage.text}
                        </div>
                      )
                    }
                    footer={
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                          onClick={() => handleAIRemove(meta.id)}
                        >
                          Remove
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={aiTestLoading[meta.id]}
                            onClick={() => handleAITest(meta.id)}
                          >
                            Test
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setEditingAIProvider(meta)}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    }
                  />
                );
              }

              const { conn } = entry;
              return (
                <IntegrationCardShell
                  key={entry.key}
                  avatar={
                    <ProviderAvatar slug={conn.integration.id} name={conn.integration.name} />
                  }
                  title={conn.name}
                  subtitle={conn.integration.name}
                  status={statusBadge(conn.status)}
                  body={
                    <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                      <dt className="text-neutral-500 dark:text-neutral-400">Last sync</dt>
                      <dd className="text-right text-neutral-700 dark:text-neutral-200">
                        {timeAgo(conn.lastSyncAt)}
                      </dd>
                      <dt className="text-neutral-500 dark:text-neutral-400">Schedule</dt>
                      <dd className="text-right text-neutral-700 dark:text-neutral-200">
                        {syncFreqLabel(conn.syncFrequencyMinutes)}
                      </dd>
                      {!conn.isActive && (
                        <>
                          <dt className="text-neutral-500 dark:text-neutral-400">State</dt>
                          <dd className="text-right text-amber-600 dark:text-amber-400">Paused</dd>
                        </>
                      )}
                      {conn.lastErrorMessage && (
                        <dd
                          className="col-span-2 mt-2 truncate rounded-md bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                          title={conn.lastErrorMessage}
                        >
                          {conn.lastErrorMessage}
                        </dd>
                      )}
                    </dl>
                  }
                  message={
                    actionMessage?.id === conn.id && (
                      <div
                        className={`rounded-md px-3 py-2 text-xs ${
                          actionMessage.type === "success"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {actionMessage.text}
                      </div>
                    )
                  }
                  footer={
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSettingsConnection(conn)}>
                        Settings
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={actionLoading[conn.id]}
                          onClick={() => handleTestConnection(conn.id)}
                        >
                          Test
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          loading={actionLoading[conn.id]}
                          onClick={() => handleSyncNow(conn.id)}
                          disabled={conn.status !== "connected"}
                        >
                          Sync Now
                        </Button>
                      </div>
                    </div>
                  }
                />
              );
            })}
          </div>
        </section>
      )}

      {/* ── Catalog (AI + integrations, unified) ── */}
      <section>
        <SectionHeader
          icon={
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.6}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
              />
            </svg>
          }
          title="Browse catalog"
          count={totalAvailable}
          description="Pick a provider to connect — your credentials are encrypted at rest."
        />

        {/* Search + category filter chips. Chips sit immediately to the
            right of the search field on wide screens so the two filter
            controls read as a single related unit. */}
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <div className="relative w-full lg:w-80 lg:flex-shrink-0">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.3-4.3m1.55-5.2a6.75 6.75 0 11-13.5 0 6.75 6.75 0 0113.5 0z"
              />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers, capabilities…"
              className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder-neutral-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:placeholder-neutral-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryChip
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            >
              All
            </CategoryChip>
            {categoryOptions.map((cat) => (
              <CategoryChip
                key={cat.key}
                active={activeCategory === cat.key}
                onClick={() => setActiveCategory(cat.key)}
              >
                <CategoryIcon category={cat.key} className="h-3.5 w-3.5" />
                {cat.label}
              </CategoryChip>
            ))}
          </div>
        </div>

        {filteredCatalog.length === 0 ? (
          <Card className="text-center">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {search.trim() ? (
                <>
                  No providers match <strong>&ldquo;{search}&rdquo;</strong>.
                </>
              ) : (
                "Nothing more to connect in this category — try another."
              )}
            </p>
          </Card>
        ) : (
          <div className="space-y-8">
            {filteredCatalog.map((group) => (
              <div key={group.category}>
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  <CategoryIcon category={group.category} />
                  {group.label}
                  <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {group.entries.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.entries.map((entry) => {
                    if (entry.kind === "ai") {
                      const { meta } = entry;
                      return (
                        <IntegrationCardShell
                          key={entry.key}
                          avatar={<ProviderAvatar slug={meta.id} name={meta.name} />}
                          title={meta.name}
                          subtitle={group.label}
                          body={
                            <div className="space-y-3">
                              <p className="line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                                {meta.description}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                <CapabilityChip>API key</CapabilityChip>
                                <CapabilityChip>LLM</CapabilityChip>
                              </div>
                            </div>
                          }
                          footer={
                            <div className="flex items-center justify-end">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setEditingAIProvider(meta)}
                              >
                                Connect
                              </Button>
                            </div>
                          }
                        />
                      );
                    }

                    const { provider } = entry;
                    return (
                      <IntegrationCardShell
                        key={entry.key}
                        avatar={<ProviderAvatar slug={provider.id} name={provider.name} />}
                        title={provider.name}
                        subtitle={group.label}
                        body={
                          <div className="space-y-3">
                            <p className="line-clamp-2 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                              {provider.description ?? "No description provided."}
                            </p>
                            {provider.capabilities.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {provider.capabilities.slice(0, 3).map((cap) => (
                                  <CapabilityChip key={cap}>
                                    {cap.replace(/_/g, " ")}
                                  </CapabilityChip>
                                ))}
                                {provider.capabilities.length > 3 && (
                                  <CapabilityChip>
                                    +{provider.capabilities.length - 3} more
                                  </CapabilityChip>
                                )}
                              </div>
                            )}
                          </div>
                        }
                        footer={
                          <div className="flex items-center justify-end">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setConnectProvider(provider)}
                            >
                              Connect
                            </Button>
                          </div>
                        }
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Modals ── */}
      <ConnectModal
        provider={connectProvider}
        open={!!connectProvider}
        onClose={() => setConnectProvider(null)}
        onSuccess={loadData}
      />

      <SettingsModal
        connection={settingsConnection}
        open={!!settingsConnection}
        onClose={() => setSettingsConnection(null)}
        onUpdate={loadData}
        onDelete={loadData}
      />

      <AIProviderModal
        provider={editingAIProvider}
        existing={
          editingAIProvider
            ? (aiProviders.find((a) => a.provider === editingAIProvider.id) ?? null)
            : null
        }
        open={!!editingAIProvider}
        onClose={() => setEditingAIProvider(null)}
        onSuccess={loadAIProviders}
      />
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-950/50 dark:text-blue-300"
          : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
      }`}
    >
      {children}
    </button>
  );
}
