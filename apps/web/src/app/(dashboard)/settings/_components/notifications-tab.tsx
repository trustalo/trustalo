"use client";

/**
 * Settings → Notifications. Manages alert channels (email / Slack / Teams
 * webhooks), the built-in alert rules with their thresholds, and shows the
 * recent delivery feed. Channel config is write-only: the API returns a
 * masked preview and never echoes the stored URL/recipients back.
 */

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  apiClient,
  type AlertRule,
  type AlertRuleKey,
  type NotificationChannel,
  type NotificationChannelType,
  type NotificationDelivery,
} from "@/lib/api-client";

const CHANNEL_TYPE_LABELS: Record<NotificationChannelType, string> = {
  email: "Email",
  slack_webhook: "Slack webhook",
  teams_webhook: "Teams webhook",
};

const CHANNEL_TYPE_OPTIONS = [
  { value: "email", label: "Email" },
  { value: "slack_webhook", label: "Slack webhook" },
  { value: "teams_webhook", label: "Microsoft Teams webhook" },
];

const SEVERITY_OPTIONS = [
  { value: "low", label: "Low and above" },
  { value: "medium", label: "Medium and above" },
  { value: "high", label: "High and above" },
  { value: "critical", label: "Critical only" },
];

interface RuleMeta {
  description: string;
  threshold?: { key: string; label: string; kind: "number" | "severity"; suffix?: string };
}

const RULE_META: Record<AlertRuleKey, RuleMeta> = {
  control_failing: {
    description: "An unresolved control weakness is open at or above the chosen severity.",
    threshold: { key: "minSeverity", label: "Minimum severity", kind: "severity" },
  },
  integration_sync_failed: {
    description: "An active integration connection's latest sync is failing.",
  },
  device_at_risk: {
    description:
      "A device is failing an evaluated posture signal or has gone stale (missed check-ins).",
  },
  person_offboarding_incomplete: {
    description: "An offboarded person still has open offboarding checklist items.",
    threshold: { key: "olderThanDays", label: "Older than", kind: "number", suffix: "days" },
  },
  background_check_expiring: {
    description: "A cleared background check expires within the chosen window.",
    threshold: { key: "thresholdDays", label: "Warn within", kind: "number", suffix: "days" },
  },
  training_overdue: {
    description: "A required training assignment is incomplete past its due date.",
    threshold: { key: "graceDays", label: "Grace period", kind: "number", suffix: "days" },
  },
  incident_breach_clock: {
    description:
      "A regulatory notification clock (GDPR 72h) on an open incident or data breach is about to expire.",
    threshold: { key: "thresholdHours", label: "Warn within", kind: "number", suffix: "hours" },
  },
};

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus:ring-offset-neutral-900 ${
        enabled ? "bg-blue-600" : "bg-neutral-200 dark:bg-neutral-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function NotificationsTab({ canWrite }: { canWrite: boolean }) {
  const [channels, setChannels] = useState<NotificationChannel[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [deliveries, setDeliveries] = useState<NotificationDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Add-channel modal state.
  const [addOpen, setAddOpen] = useState(false);
  const [draftType, setDraftType] = useState<NotificationChannelType>("email");
  const [draftName, setDraftName] = useState("");
  const [draftRecipients, setDraftRecipients] = useState("");
  const [draftUrl, setDraftUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [savingRule, setSavingRule] = useState<AlertRuleKey | null>(null);
  const [ruleDrafts, setRuleDrafts] = useState<Record<string, string>>({});

  const fetchData = useCallback(async () => {
    setError(null);
    try {
      const [channelsRes, rulesRes, deliveriesRes] = await Promise.all([
        apiClient.listNotificationChannels(),
        apiClient.listAlertRules(),
        apiClient.listNotificationDeliveries({ limit: 20 }),
      ]);
      setChannels(channelsRes.data);
      setRules(rulesRes.data);
      setDeliveries(deliveriesRes.data);
    } catch {
      setError("Failed to load notification settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function openAddModal() {
    setDraftType("email");
    setDraftName("");
    setDraftRecipients("");
    setDraftUrl("");
    setModalError(null);
    setAddOpen(true);
  }

  async function handleAddChannel() {
    setModalError(null);
    const config =
      draftType === "email"
        ? {
            recipients: draftRecipients
              .split(/[\n,;]+/)
              .map((r) => r.trim())
              .filter(Boolean),
          }
        : { url: draftUrl.trim() };
    setSaving(true);
    try {
      await apiClient.createNotificationChannel({
        type: draftType,
        name: draftName.trim(),
        config,
      });
      setAddOpen(false);
      await fetchData();
    } catch (err) {
      setModalError(err instanceof Error ? err.message : "Failed to add channel.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleChannel(channel: NotificationChannel) {
    setTogglingId(channel.id);
    setActionError(null);
    try {
      await apiClient.updateNotificationChannel(channel.id, { enabled: !channel.enabled });
      await fetchData();
    } catch {
      setActionError("Failed to update channel.");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDeleteChannel(channel: NotificationChannel) {
    if (!confirm(`Delete notification channel "${channel.name}"?`)) return;
    setActionError(null);
    try {
      await apiClient.deleteNotificationChannel(channel.id);
      await fetchData();
    } catch {
      setActionError("Failed to delete channel.");
    }
  }

  async function handleTestChannel(channel: NotificationChannel) {
    setTestingId(channel.id);
    setTestResult(null);
    try {
      const res = await apiClient.testNotificationChannel(channel.id);
      setTestResult({
        id: channel.id,
        message: res.success ? "Test alert sent." : "Test delivery failed.",
      });
    } catch (err) {
      setTestResult({
        id: channel.id,
        message: err instanceof Error ? err.message : "Test delivery failed.",
      });
    } finally {
      setTestingId(null);
    }
  }

  async function handleToggleRule(rule: AlertRule) {
    setSavingRule(rule.ruleKey);
    setActionError(null);
    try {
      const res = await apiClient.updateAlertRule(rule.ruleKey, { enabled: !rule.enabled });
      setRules((prev) => prev.map((r) => (r.ruleKey === rule.ruleKey ? res.data : r)));
    } catch {
      setActionError("Failed to update rule.");
    } finally {
      setSavingRule(null);
    }
  }

  async function handleSaveThreshold(rule: AlertRule) {
    const meta = RULE_META[rule.ruleKey];
    if (!meta.threshold) return;
    const raw = ruleDrafts[rule.ruleKey];
    if (raw === undefined) return;
    const value = meta.threshold.kind === "number" ? Number(raw) : raw;
    if (meta.threshold.kind === "number" && (!Number.isFinite(value) || Number(value) < 0)) {
      setActionError("Threshold must be a non-negative number.");
      return;
    }
    setSavingRule(rule.ruleKey);
    setActionError(null);
    try {
      const res = await apiClient.updateAlertRule(rule.ruleKey, {
        config: { ...rule.config, [meta.threshold.key]: value },
      });
      setRules((prev) => prev.map((r) => (r.ruleKey === rule.ruleKey ? res.data : r)));
      setRuleDrafts((prev) => {
        const next = { ...prev };
        delete next[rule.ruleKey];
        return next;
      });
    } catch {
      setActionError("Failed to save threshold.");
    } finally {
      setSavingRule(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-64 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={() => void fetchData()}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {actionError}
        </div>
      )}

      {/* ── Channels ─────────────────────────────────────────────── */}
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Alert channels
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Where alerts are delivered. Webhook URLs are stored encrypted and never shown again.
            </p>
          </div>
          {canWrite && (
            <Button size="sm" onClick={openAddModal}>
              Add channel
            </Button>
          )}
        </div>

        <div className="mt-5 space-y-3">
          {channels.length === 0 ? (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No channels yet. Add an email, Slack, or Teams channel to start receiving alerts.
            </p>
          ) : (
            channels.map((channel) => (
              <div
                key={channel.id}
                className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                        {channel.name}
                      </p>
                      <Badge variant="info">{CHANNEL_TYPE_LABELS[channel.type]}</Badge>
                      <Badge variant={channel.enabled ? "success" : "warning"}>
                        {channel.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {channel.configPreview}
                    </p>
                    {testResult?.id === channel.id && (
                      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">
                        {testResult.message}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!canWrite || testingId === channel.id}
                      loading={testingId === channel.id}
                      onClick={() => void handleTestChannel(channel)}
                    >
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!canWrite || togglingId === channel.id}
                      loading={togglingId === channel.id}
                      onClick={() => void handleToggleChannel(channel)}
                    >
                      {channel.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!canWrite}
                      onClick={() => void handleDeleteChannel(channel)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ── Alert rules ──────────────────────────────────────────── */}
      <Card>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">Alert rules</h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            The evaluator checks these every few minutes and alerts each condition once. Disable a
            rule to silence it.
          </p>
        </div>
        <div className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          {rules.map((rule) => {
            const meta = RULE_META[rule.ruleKey];
            const threshold = meta?.threshold;
            const currentValue = threshold
              ? (ruleDrafts[rule.ruleKey] ?? String(rule.config[threshold.key] ?? ""))
              : "";
            const dirty = threshold && ruleDrafts[rule.ruleKey] !== undefined;
            return (
              <div key={rule.ruleKey} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 dark:text-white">
                    {rule.label}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {meta?.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {threshold &&
                    (threshold.kind === "severity" ? (
                      <div className="w-40">
                        <Select
                          aria-label={`${rule.label} threshold`}
                          options={SEVERITY_OPTIONS}
                          value={currentValue}
                          disabled={!canWrite || savingRule === rule.ruleKey}
                          onChange={(e) =>
                            setRuleDrafts((prev) => ({
                              ...prev,
                              [rule.ruleKey]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-20">
                          <Input
                            aria-label={`${rule.label} threshold`}
                            type="number"
                            min={0}
                            value={currentValue}
                            disabled={!canWrite || savingRule === rule.ruleKey}
                            onChange={(e) =>
                              setRuleDrafts((prev) => ({
                                ...prev,
                                [rule.ruleKey]: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {threshold.suffix}
                        </span>
                      </div>
                    ))}
                  {dirty && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={savingRule === rule.ruleKey}
                      onClick={() => void handleSaveThreshold(rule)}
                    >
                      Save
                    </Button>
                  )}
                  <Toggle
                    enabled={rule.enabled}
                    disabled={!canWrite || savingRule === rule.ruleKey}
                    onChange={() => void handleToggleRule(rule)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Recent deliveries ────────────────────────────────────── */}
      <Card>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Recent deliveries
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            The latest alerts sent (or attempted) across all channels.
          </p>
        </div>
        {deliveries.length === 0 ? (
          <p className="mt-5 text-sm text-neutral-500 dark:text-neutral-400">
            No alerts delivered yet.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
                  <th className="py-2 pr-4 font-medium">Time</th>
                  <th className="py-2 pr-4 font-medium">Alert</th>
                  <th className="py-2 pr-4 font-medium">Channel</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="whitespace-nowrap py-2 pr-4 text-xs text-neutral-500 dark:text-neutral-400">
                      {formatDate(delivery.createdAt)}
                    </td>
                    <td className="max-w-md py-2 pr-4 text-neutral-900 dark:text-neutral-100">
                      <span className="line-clamp-2">{delivery.summary}</span>
                    </td>
                    <td className="whitespace-nowrap py-2 pr-4 text-xs text-neutral-600 dark:text-neutral-300">
                      {delivery.channel
                        ? `${delivery.channel.name} (${CHANNEL_TYPE_LABELS[delivery.channel.type]})`
                        : "Deleted channel"}
                    </td>
                    <td className="py-2">
                      <Badge variant={delivery.status === "sent" ? "success" : "danger"}>
                        {delivery.status === "sent" ? "Sent" : "Failed"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Add channel modal ────────────────────────────────────── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add notification channel">
        <div className="space-y-4">
          <Select
            id="channel-type"
            label="Channel type"
            options={CHANNEL_TYPE_OPTIONS}
            value={draftType}
            onChange={(e) => setDraftType(e.target.value as NotificationChannelType)}
          />
          <Input
            id="channel-name"
            label="Name"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder={draftType === "email" ? "Security team" : "#compliance-alerts"}
          />
          {draftType === "email" ? (
            <Input
              id="channel-recipients"
              label="Recipients (comma-separated)"
              value={draftRecipients}
              onChange={(e) => setDraftRecipients(e.target.value)}
              placeholder="security@example.com, ciso@example.com"
            />
          ) : (
            <Input
              id="channel-url"
              type="password"
              label={draftType === "slack_webhook" ? "Slack webhook URL" : "Teams webhook URL"}
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder={
                draftType === "slack_webhook"
                  ? "https://hooks.slack.com/services/…"
                  : "https://….webhook.office.com/…"
              }
            />
          )}
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {draftType === "email"
              ? "Delivery uses the SMTP relay configured by your operator (SMTP_HOST)."
              : "The webhook URL is a credential — it is encrypted at rest and never displayed again."}
          </p>
          {modalError && (
            <p className="rounded bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              {modalError}
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => void handleAddChannel()}
              loading={saving}
              disabled={
                !draftName.trim() ||
                (draftType === "email" ? !draftRecipients.trim() : !draftUrl.trim())
              }
            >
              Add channel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
