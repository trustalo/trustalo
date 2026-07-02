// SPDX-License-Identifier: LicenseRef-Trustalo-Enterprise-1.0

/**
 * Directory Sync admin card (Settings → General). Enterprise-only
 * (`sso` feature): the whole card body is replaced by the standard
 * amber upgrade state when the deployment is unlicensed — proactively
 * via `useEnterpriseGated()`, or reactively when the API answers 402.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import type {
  DirectorySyncConfig,
  DirectorySyncProvider,
  DirectorySyncRun,
  EntraDirectorySyncCredentials,
  GoogleWorkspaceDirectorySyncCredentials,
  UpsertDirectorySyncConfigInput,
} from "@/lib/api-client";
import {
  ENTERPRISE_REQUIRED_MESSAGE,
  isEnterpriseLicenseError,
  useEnterpriseGated,
} from "@/lib/enterprise-license";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";

const PROVIDER_LABELS: Record<DirectorySyncProvider, string> = {
  entra: "Microsoft Entra ID",
  google_workspace: "Google Workspace",
};

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "compliance_manager", label: "Compliance Manager" },
  { value: "auditor", label: "Auditor" },
  { value: "viewer", label: "Viewer" },
  { value: "integration_admin", label: "Integration Admin" },
  { value: "dpo", label: "DPO" },
];

const STATUS_OPTIONS = [
  { value: "invited", label: "Invited (recommended)" },
  { value: "active", label: "Active" },
];

const FREQUENCY_OPTIONS = [
  { value: "1440", label: "Daily (24 hours)" },
  { value: "10080", label: "Weekly (7 days)" },
];

const ENABLED_OPTIONS = [
  { value: "true", label: "Enabled" },
  { value: "false", label: "Disabled" },
];

type DraftState = {
  isEnabled: boolean;
  syncFrequencyMinutes: "1440" | "10080";
  defaultRole: "admin" | "compliance_manager" | "auditor" | "viewer" | "integration_admin" | "dpo";
  defaultStatus: "invited" | "active";
  // Entra
  tenantId: string;
  clientId: string;
  clientSecret: string;
  // Google
  serviceAccountJson: string;
  adminEmail: string;
};

function getDefaultDraft(config: DirectorySyncConfig | null): DraftState {
  return {
    isEnabled: config?.isEnabled ?? true,
    syncFrequencyMinutes: String(config?.syncFrequencyMinutes ?? 1440) as "1440" | "10080",
    defaultRole: config?.defaultRole ?? "viewer",
    defaultStatus: config?.defaultStatus ?? "invited",
    tenantId: "",
    clientId: "",
    clientSecret: "",
    serviceAccountJson: "",
    adminEmail: "",
  };
}

function statusBadge(config: DirectorySyncConfig | null) {
  if (!config) return { label: "Not configured", variant: "neutral" as const };
  if (config.lastSyncStatus === "failed") return { label: "Error", variant: "danger" as const };
  if (!config.isEnabled) return { label: "Disabled", variant: "warning" as const };
  return { label: "Active", variant: "success" as const };
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString();
}

/** "12 found · 3 created · 2 updated · 1 suspended" for a finished run. */
function runCounts(run: DirectorySyncRun): string {
  return [
    `${run.usersDiscovered} found`,
    `${run.usersCreated} created`,
    `${run.usersUpdated} updated`,
    `${run.usersSuspended} suspended`,
  ].join(" · ");
}

export function DirectorySyncCard({ canWrite }: { canWrite: boolean }) {
  const gated = useEnterpriseGated();
  const [licenseBlocked, setLicenseBlocked] = useState(false);
  const [configs, setConfigs] = useState<DirectorySyncConfig[]>([]);
  const [runs, setRuns] = useState<DirectorySyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncingProvider, setSyncingProvider] = useState<DirectorySyncProvider | null>(null);
  const [togglingProvider, setTogglingProvider] = useState<DirectorySyncProvider | null>(null);
  const [testing, setTesting] = useState(false);
  const [modalProvider, setModalProvider] = useState<DirectorySyncProvider | null>(null);
  const [draft, setDraft] = useState<DraftState>(getDefaultDraft(null));
  const [testMessage, setTestMessage] = useState<string | null>(null);

  const configMap = useMemo(() => {
    const map = new Map<DirectorySyncProvider, DirectorySyncConfig>();
    for (const config of configs) {
      map.set(config.provider, config);
    }
    return map;
  }, [configs]);

  // Latest finished run per provider, for the "last sync" count summary.
  const lastRunMap = useMemo(() => {
    const map = new Map<DirectorySyncProvider, DirectorySyncRun>();
    for (const run of runs) {
      if (!map.has(run.provider)) map.set(run.provider, run);
    }
    return map;
  }, [runs]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configsRes, runsRes] = await Promise.all([
        apiClient.listDirectorySyncConfigs(),
        apiClient.listDirectorySyncRuns({ limit: 20 }),
      ]);
      setConfigs(configsRes.data);
      setRuns(runsRes.data);
    } catch (err) {
      if (isEnterpriseLicenseError(err)) {
        setLicenseBlocked(true);
      } else {
        setError("Failed to load directory sync settings.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const openModal = (provider: DirectorySyncProvider) => {
    const existing = configMap.get(provider) ?? null;
    setModalProvider(provider);
    setDraft(getDefaultDraft(existing));
    setTestMessage(null);
  };

  const closeModal = () => {
    setModalProvider(null);
    setTestMessage(null);
  };

  const buildPayload = (): UpsertDirectorySyncConfigInput => {
    const base: Omit<UpsertDirectorySyncConfigInput, "credentials"> = {
      isEnabled: draft.isEnabled,
      syncFrequencyMinutes: Number(draft.syncFrequencyMinutes) as 1440 | 10080,
      defaultRole: draft.defaultRole,
      defaultStatus: draft.defaultStatus,
      groupRoleMappings: [],
    };

    if (modalProvider === "entra") {
      const credentials: EntraDirectorySyncCredentials = {
        tenantId: draft.tenantId.trim(),
        clientId: draft.clientId.trim(),
        clientSecret: draft.clientSecret.trim(),
      };
      return { ...base, credentials };
    }

    const credentials: GoogleWorkspaceDirectorySyncCredentials = {
      serviceAccountJson: draft.serviceAccountJson.trim(),
      adminEmail: draft.adminEmail.trim(),
    };
    return { ...base, credentials };
  };

  const handleSave = async () => {
    if (!modalProvider) return;
    setSaving(true);
    setTestMessage(null);
    try {
      await apiClient.upsertDirectorySyncConfig(modalProvider, buildPayload());
      closeModal();
      await fetchData();
    } catch (err: any) {
      if (isEnterpriseLicenseError(err)) {
        closeModal();
        setLicenseBlocked(true);
        return;
      }
      setTestMessage(err?.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!modalProvider) return;
    setTesting(true);
    setTestMessage(null);
    try {
      const result = await apiClient.testDirectorySyncConfig(
        modalProvider,
        buildPayload().credentials,
      );
      setTestMessage(`Connection successful. Sampled ${result.data.usersSampled} users.`);
    } catch (err: any) {
      setTestMessage(err?.message || "Connection test failed.");
    } finally {
      setTesting(false);
    }
  };

  const handleSyncNow = async (provider: DirectorySyncProvider) => {
    setSyncingProvider(provider);
    setActionError(null);
    try {
      await apiClient.triggerDirectorySync(provider);
      await fetchData();
    } catch (err: any) {
      if (isEnterpriseLicenseError(err)) {
        setLicenseBlocked(true);
      } else {
        setActionError(err?.message || "Failed to trigger sync.");
      }
    } finally {
      setSyncingProvider(null);
    }
  };

  const handleToggleEnabled = async (provider: DirectorySyncProvider, isEnabled: boolean) => {
    setTogglingProvider(provider);
    setActionError(null);
    try {
      await apiClient.patchDirectorySyncConfig(provider, { isEnabled });
      await fetchData();
    } catch (err: any) {
      if (isEnterpriseLicenseError(err)) {
        setLicenseBlocked(true);
      } else {
        setActionError(err?.message || "Failed to update sync state.");
      }
    } finally {
      setTogglingProvider(null);
    }
  };

  const handleDeleteConfig = async (provider: DirectorySyncProvider) => {
    if (!confirm(`Delete ${PROVIDER_LABELS[provider]} sync configuration?`)) return;
    await apiClient.deleteDirectorySyncConfig(provider);
    await fetchData();
  };

  const unlicensed = gated || licenseBlocked;

  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Directory Sync
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Automatically sync users from Microsoft Entra ID or Google Workspace.
          </p>
        </div>
        <Badge variant="warning">Enterprise</Badge>
      </div>

      {unlicensed ? (
        <div className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700/60 dark:bg-amber-950/30">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            Directory Sync — Enterprise feature
          </div>
          <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/90">
            {ENTERPRISE_REQUIRED_MESSAGE} Once licensed, users from Microsoft Entra ID or Google
            Workspace are provisioned into your organization automatically.
          </p>
          <a
            href="mailto:sales@trustalo.com?subject=Trustalo%20Enterprise%20License"
            className="mt-3 inline-block rounded-md border border-amber-400 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
          >
            Contact sales
          </a>
        </div>
      ) : loading ? (
        <div className="mt-5 text-sm text-neutral-500 dark:text-neutral-400">Loading…</div>
      ) : error ? (
        <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      ) : (
        <>
          {actionError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {actionError}
            </div>
          )}
          <div className="mt-5 space-y-3">
            {(Object.keys(PROVIDER_LABELS) as DirectorySyncProvider[]).map((provider) => {
              const config = configMap.get(provider) ?? null;
              const badge = statusBadge(config);
              const lastRun = lastRunMap.get(provider) ?? null;
              return (
                <div
                  key={provider}
                  className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                          {PROVIDER_LABELS[provider]}
                        </p>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        Last sync: {formatDate(config?.lastSyncAt ?? null)}
                      </p>
                      {lastRun && lastRun.status === "succeeded" && (
                        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                          {runCounts(lastRun)}
                        </p>
                      )}
                      {config?.lastSyncError && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {config.lastSyncError}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {config && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!canWrite || syncingProvider === provider}
                            loading={syncingProvider === provider}
                            onClick={() => handleSyncNow(provider)}
                          >
                            Sync now
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!canWrite || togglingProvider === provider}
                            loading={togglingProvider === provider}
                            onClick={() => handleToggleEnabled(provider, !config.isEnabled)}
                          >
                            {config.isEnabled ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!canWrite}
                            onClick={() => void handleDeleteConfig(provider)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      <Button size="sm" disabled={!canWrite} onClick={() => openModal(provider)}>
                        {config ? "Configure" : "Set up"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            <p className="mb-2 text-sm font-medium text-neutral-900 dark:text-white">
              Recent sync runs
            </p>
            {runs.length === 0 ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">No sync runs yet.</p>
            ) : (
              <div className="space-y-2">
                {runs.slice(0, 10).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-xs dark:border-neutral-700"
                  >
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {PROVIDER_LABELS[run.provider]} · {run.triggeredBy} · {run.status}
                      {run.status === "succeeded" && (
                        <span className="text-neutral-500 dark:text-neutral-400">
                          {" "}
                          · {runCounts(run)}
                        </span>
                      )}
                    </span>
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {formatDate(run.finishedAt ?? run.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      <Modal
        open={!!modalProvider}
        onClose={closeModal}
        title={
          modalProvider
            ? `Configure ${PROVIDER_LABELS[modalProvider]} sync`
            : "Configure directory sync"
        }
      >
        {modalProvider && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Select
                id="directory-frequency"
                label="Sync frequency"
                options={FREQUENCY_OPTIONS}
                value={draft.syncFrequencyMinutes}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    syncFrequencyMinutes: e.target.value as "1440" | "10080",
                  }))
                }
              />
              <Select
                id="directory-default-status"
                label="Initial member status"
                options={STATUS_OPTIONS}
                value={draft.defaultStatus}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    defaultStatus: e.target.value as "invited" | "active",
                  }))
                }
              />
              <Select
                id="directory-default-role"
                label="Default role"
                options={ROLE_OPTIONS}
                value={draft.defaultRole}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    defaultRole: e.target.value as DraftState["defaultRole"],
                  }))
                }
              />
              <Select
                id="directory-enabled"
                label="Sync state"
                options={ENABLED_OPTIONS}
                value={draft.isEnabled ? "true" : "false"}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    isEnabled: e.target.value === "true",
                  }))
                }
              />
            </div>

            {modalProvider === "entra" ? (
              <>
                <Input
                  id="entra-tenant-id"
                  label="Tenant ID"
                  value={draft.tenantId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, tenantId: e.target.value }))}
                />
                <Input
                  id="entra-client-id"
                  label="Client ID"
                  value={draft.clientId}
                  onChange={(e) => setDraft((prev) => ({ ...prev, clientId: e.target.value }))}
                />
                <Input
                  id="entra-client-secret"
                  type="password"
                  label="Client Secret"
                  value={draft.clientSecret}
                  onChange={(e) => setDraft((prev) => ({ ...prev, clientSecret: e.target.value }))}
                />
              </>
            ) : (
              <>
                <Input
                  id="gws-admin-email"
                  label="Admin email"
                  value={draft.adminEmail}
                  onChange={(e) => setDraft((prev) => ({ ...prev, adminEmail: e.target.value }))}
                />
                <Input
                  id="gws-service-account-json"
                  label="Service account JSON"
                  value={draft.serviceAccountJson}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, serviceAccountJson: e.target.value }))
                  }
                  placeholder='{"type":"service_account",...}'
                />
              </>
            )}

            {testMessage && (
              <p className="rounded bg-neutral-100 px-3 py-2 text-xs text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {testMessage}
              </p>
            )}

            <div className="flex justify-between gap-3">
              <Button variant="secondary" size="sm" onClick={handleTest} loading={testing}>
                Test connection
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={closeModal}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} loading={saving}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  );
}
