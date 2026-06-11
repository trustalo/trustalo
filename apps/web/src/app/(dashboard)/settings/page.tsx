"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  apiClient,
  type Organization,
  type OrganizationSettings,
  type OrgMember,
  type SecurityDefaults,
  type AIProviderType,
  type AIFeatureType,
  type AIFeatureConfigItem,
  type AIProviderConfigItem,
  AI_PROVIDER_LABELS,
  AI_PROVIDER_MODELS,
  AI_FEATURE_LABELS,
} from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";
import { AIUsageTab } from "./_components/ai-usage-tab";
import { DirectorySyncCard } from "./_components/directory-sync-card";

type SettingsTab = "general" | "members" | "security" | "ai" | "ai-usage";

const TABS: { id: SettingsTab; label: string; icon: string }[] = [
  {
    id: "general",
    label: "General",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
  {
    id: "members",
    label: "Members",
    icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
  },
  {
    id: "security",
    label: "Security",
    icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  },
  {
    id: "ai",
    label: "AI",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
  },
  // AI usage was a top-level sidebar entry; moved here so the
  // sidebar focuses on daily-driver workflows and observability
  // surfaces live with the rest of the org-admin settings.
  {
    id: "ai-usage",
    label: "AI Usage",
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  },
];

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  compliance_manager: "Compliance Manager",
  auditor: "Auditor",
  viewer: "Viewer",
  integration_admin: "Integration Admin",
};

const ROLE_BADGE_VARIANT: Record<string, "success" | "info" | "warning" | "neutral" | "danger"> = {
  owner: "success",
  admin: "info",
  compliance_manager: "info",
  auditor: "neutral",
  viewer: "neutral",
  integration_admin: "warning",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

const PLAN_BADGE_VARIANT: Record<string, "neutral" | "info" | "success" | "warning"> = {
  free: "neutral",
  starter: "info",
  professional: "success",
  enterprise: "warning",
};

const INDUSTRY_OPTIONS = [
  { value: "", label: "Select industry" },
  { value: "technology", label: "Technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance & Banking" },
  { value: "education", label: "Education" },
  { value: "government", label: "Government" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting" },
  { value: "legal", label: "Legal" },
  { value: "other", label: "Other" },
];

const COMPANY_SIZE_OPTIONS = [
  { value: "", label: "Select company size" },
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1,000 employees" },
  { value: "1001-5000", label: "1,001-5,000 employees" },
  { value: "5001+", label: "5,001+ employees" },
];

const TIMEZONE_OPTIONS = [
  { value: "", label: "Select timezone" },
  { value: "America/New_York", label: "Eastern Time (US)" },
  { value: "America/Chicago", label: "Central Time (US)" },
  { value: "America/Denver", label: "Mountain Time (US)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US)" },
  { value: "Europe/London", label: "GMT (London)" },
  { value: "Europe/Berlin", label: "CET (Berlin)" },
  { value: "Asia/Kolkata", label: "IST (India)" },
  { value: "Asia/Tokyo", label: "JST (Tokyo)" },
  { value: "Asia/Shanghai", label: "CST (China)" },
  { value: "Australia/Sydney", label: "AEST (Sydney)" },
  { value: "Pacific/Auckland", label: "NZST (Auckland)" },
];

const SESSION_TIMEOUT_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "120", label: "2 hours" },
  { value: "240", label: "4 hours" },
  { value: "480", label: "8 hours" },
  { value: "720", label: "12 hours" },
  { value: "1440", label: "24 hours" },
  { value: "4320", label: "3 days" },
];

const ASSIGNABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "compliance_manager", label: "Compliance Manager" },
  { value: "auditor", label: "Auditor" },
  { value: "viewer", label: "Viewer" },
  { value: "integration_admin", label: "Integration Admin" },
];

function TabIcon({ d }: { d: string }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded bg-neutral-200 dark:bg-neutral-700 ${className}`} />
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-900 dark:text-white">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

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

// ─── General Settings ───────────────────────────────────────────────

const DEVICE_INTERVAL_OPTIONS = [
  { value: "1800", label: "Every 30 minutes" },
  { value: "3600", label: "Every hour" },
  { value: "7200", label: "Every 2 hours" },
  { value: "21600", label: "Every 6 hours" },
  { value: "43200", label: "Every 12 hours" },
  { value: "86400", label: "Once a day" },
];

// Posture signals an admin can choose to evaluate. Keys mirror the server's
// EVALUABLE_POSTURE_SIGNALS; unchecked = optional (collected + shown, never an
// "issue"). The four core signals are the default-on set.
const POSTURE_SIGNAL_OPTIONS = [
  { key: "diskEncryption", label: "Disk encryption" },
  { key: "firewall", label: "Host firewall" },
  { key: "screenLock", label: "Screen lock" },
  { key: "antivirus", label: "Antivirus / EDR" },
  { key: "autoUpdate", label: "Automatic OS updates" },
  { key: "mdmEnrolled", label: "MDM managed" },
  { key: "gatekeeper", label: "Gatekeeper (macOS)" },
  { key: "sip", label: "System Integrity Protection (macOS)" },
];

const DEFAULT_REQUIRED_SIGNALS = ["diskEncryption", "firewall", "screenLock", "antivirus"];

function GeneralTab({
  org,
  settings,
  onOrgUpdated,
  onSettingsUpdated,
  canWrite,
}: {
  org: Organization | null;
  settings: OrganizationSettings | null;
  onOrgUpdated: (o: Organization) => void;
  onSettingsUpdated: (s: OrganizationSettings) => void;
  canWrite: boolean;
}) {
  const [editOrgOpen, setEditOrgOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [profileForm, setProfileForm] = useState({
    industry: "",
    companySize: "",
    country: "",
    timezone: "",
  });
  const [saving, setSaving] = useState(false);
  const [savingInterval, setSavingInterval] = useState(false);
  const [savingSignals, setSavingSignals] = useState(false);

  useEffect(() => {
    if (org) setOrgName(org.name);
  }, [org]);

  useEffect(() => {
    if (settings) {
      setProfileForm({
        industry: settings.industry ?? "",
        companySize: settings.companySize ?? "",
        country: settings.country ?? "",
        timezone: settings.timezone ?? "",
      });
    }
  }, [settings]);

  async function handleSaveOrgName() {
    if (!orgName.trim()) return;
    setSaving(true);
    try {
      const res = await apiClient.updateOrganization({ name: orgName.trim() });
      onOrgUpdated(res.data);
      setEditOrgOpen(false);
    } catch {
      // keep modal open on error
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await apiClient.updateOrganizationSettings({
        industry: profileForm.industry || null,
        companySize: profileForm.companySize || null,
        country: profileForm.country || null,
        timezone: profileForm.timezone || null,
      });
      onSettingsUpdated(res.data);
      setEditProfileOpen(false);
    } catch {
      // keep modal open on error
    } finally {
      setSaving(false);
    }
  }

  async function saveDeviceInterval(seconds: number) {
    setSavingInterval(true);
    try {
      const res = await apiClient.updateOrganizationSettings({
        deviceCheckInIntervalSeconds: seconds,
      });
      onSettingsUpdated(res.data);
    } finally {
      setSavingInterval(false);
    }
  }

  const requiredSignals = settings?.devicePostureRequiredSignals ?? DEFAULT_REQUIRED_SIGNALS;

  async function toggleSignal(key: string, on: boolean) {
    const next = on
      ? [...new Set([...requiredSignals, key])]
      : requiredSignals.filter((k) => k !== key);
    setSavingSignals(true);
    try {
      const res = await apiClient.updateOrganizationSettings({
        devicePostureRequiredSignals: next,
      });
      onSettingsUpdated(res.data);
    } finally {
      setSavingSignals(false);
    }
  }

  if (!org) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Organization
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Basic information about your organization
            </p>
          </div>
          {canWrite && (
            <Button variant="secondary" size="sm" onClick={() => setEditOrgOpen(true)}>
              Edit
            </Button>
          )}
        </div>
        <dl className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          <SettingRow label="Name">
            <span className="text-sm font-medium text-neutral-900 dark:text-white">{org.name}</span>
          </SettingRow>
          <SettingRow label="Slug">
            <code className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
              {org.slug}
            </code>
          </SettingRow>
          <SettingRow label="Plan">
            <Badge variant={PLAN_BADGE_VARIANT[org.plan] ?? "neutral"}>
              {PLAN_LABELS[org.plan] ?? org.plan}
            </Badge>
          </SettingRow>
          <SettingRow label="Status">
            <Badge variant={org.status === "active" ? "success" : "danger"}>
              {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
            </Badge>
          </SettingRow>
        </dl>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Company Profile
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              Details used across compliance reports and frameworks
            </p>
          </div>
          {canWrite && (
            <Button variant="secondary" size="sm" onClick={() => setEditProfileOpen(true)}>
              Edit
            </Button>
          )}
        </div>
        <dl className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          <SettingRow label="Industry">
            <span className="text-sm text-neutral-900 dark:text-white">
              {INDUSTRY_OPTIONS.find((o) => o.value === settings?.industry)?.label || "Not set"}
            </span>
          </SettingRow>
          <SettingRow label="Company Size">
            <span className="text-sm text-neutral-900 dark:text-white">
              {COMPANY_SIZE_OPTIONS.find((o) => o.value === settings?.companySize)?.label ||
                "Not set"}
            </span>
          </SettingRow>
          <SettingRow label="Country">
            <span className="text-sm text-neutral-900 dark:text-white">
              {settings?.country || "Not set"}
            </span>
          </SettingRow>
          <SettingRow label="Timezone">
            <span className="text-sm text-neutral-900 dark:text-white">
              {TIMEZONE_OPTIONS.find((o) => o.value === settings?.timezone)?.label || "Not set"}
            </span>
          </SettingRow>
        </dl>
      </Card>

      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Device agent
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              How often enrolled devices report their security posture
            </p>
          </div>
        </div>
        <dl className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          <SettingRow label="Check-in interval">
            {canWrite ? (
              <div className="w-48">
                <Select
                  aria-label="Device check-in interval"
                  value={String(settings?.deviceCheckInIntervalSeconds ?? 1800)}
                  onChange={(e) => saveDeviceInterval(Number(e.target.value))}
                  options={DEVICE_INTERVAL_OPTIONS}
                  disabled={savingInterval}
                />
              </div>
            ) : (
              <span className="text-sm text-neutral-900 dark:text-white">
                {DEVICE_INTERVAL_OPTIONS.find(
                  (o) => o.value === String(settings?.deviceCheckInIntervalSeconds ?? 1800),
                )?.label ?? `Every ${(settings?.deviceCheckInIntervalSeconds ?? 1800) / 60} min`}
              </span>
            )}
          </SettingRow>
        </dl>
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          Applies to all devices on their next check-in. Shorter intervals report sooner but use
          more battery and network.
        </p>
      </Card>

      <Card>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Evaluated posture signals
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            A failing signal you evaluate raises a posture issue and marks the device at-risk.
            Unchecked signals are still collected and shown, but never raise an issue — e.g. leave
            MDM off if it isn&apos;t required for your organization.
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {POSTURE_SIGNAL_OPTIONS.map((sig) => {
            const checked = requiredSignals.includes(sig.key);
            return (
              <label
                key={sig.key}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                  canWrite ? "cursor-pointer" : "cursor-default"
                } ${
                  checked
                    ? "border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800/50"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400 dark:border-neutral-600"
                  checked={checked}
                  disabled={!canWrite || savingSignals}
                  onChange={(e) => toggleSignal(sig.key, e.target.checked)}
                />
                <span className="text-neutral-900 dark:text-neutral-100">{sig.label}</span>
                {!checked && (
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-neutral-400">
                    optional
                  </span>
                )}
              </label>
            );
          })}
        </div>
      </Card>

      <DirectorySyncCard canWrite={canWrite} />

      {/* Edit Organization Name Modal */}
      <Modal
        open={editOrgOpen}
        onClose={() => setEditOrgOpen(false)}
        title="Edit Organization"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            id="org-name"
            label="Organization Name"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setEditOrgOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveOrgName} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Company Profile Modal */}
      <Modal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        title="Edit Company Profile"
      >
        <div className="space-y-4">
          <Select
            id="industry"
            label="Industry"
            options={INDUSTRY_OPTIONS}
            value={profileForm.industry}
            onChange={(e) => setProfileForm((p) => ({ ...p, industry: e.target.value }))}
          />
          <Select
            id="companySize"
            label="Company Size"
            options={COMPANY_SIZE_OPTIONS}
            value={profileForm.companySize}
            onChange={(e) => setProfileForm((p) => ({ ...p, companySize: e.target.value }))}
          />
          <Input
            id="country"
            label="Country"
            value={profileForm.country}
            onChange={(e) => setProfileForm((p) => ({ ...p, country: e.target.value }))}
            placeholder="e.g. United States"
          />
          <Select
            id="timezone"
            label="Timezone"
            options={TIMEZONE_OPTIONS}
            value={profileForm.timezone}
            onChange={(e) => setProfileForm((p) => ({ ...p, timezone: e.target.value }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveProfile} loading={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Members Tab ────────────────────────────────────────────────────

function MembersTab({
  members,
  loading,
  onMembersUpdated,
  canManage,
}: {
  members: OrgMember[];
  loading: boolean;
  onMembersUpdated: () => void;
  canManage: boolean;
}) {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [roleEditId, setRoleEditId] = useState<string | null>(null);
  const [roleEditValue, setRoleEditValue] = useState("");
  const [updatingRole, setUpdatingRole] = useState(false);

  async function handleInvite() {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    try {
      await apiClient.inviteMember({ email: inviteEmail.trim(), role: inviteRole });
      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("viewer");
      onMembersUpdated();
    } catch (err: any) {
      setInviteError(err?.message || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  }

  async function handleRoleChange(memberId: string) {
    setUpdatingRole(true);
    try {
      await apiClient.updateMemberRole(memberId, roleEditValue);
      setRoleEditId(null);
      onMembersUpdated();
    } catch {
      // silently fail, keep dialog open
    } finally {
      setUpdatingRole(false);
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await apiClient.removeMember(memberId);
      onMembersUpdated();
    } catch {
      // silently fail
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
              Team Members
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
              {members.length} member{members.length !== 1 ? "s" : ""} in your organization
            </p>
          </div>
          {canManage && (
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              Invite Member
            </Button>
          )}
        </div>

        <ul className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {m.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900 dark:text-white">
                    {m.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                    {m.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={ROLE_BADGE_VARIANT[m.role] ?? "neutral"}>
                  {ROLE_LABELS[m.role] ?? m.role}
                </Badge>
                {canManage && m.role !== "owner" && (
                  <div className="flex gap-1">
                    <button
                      className="rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                      title="Change role"
                      onClick={() => {
                        setRoleEditId(m.id);
                        setRoleEditValue(m.role);
                      }}
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
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z"
                        />
                      </svg>
                    </button>
                    <button
                      className="rounded p-1 text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                      title="Remove member"
                      onClick={() => handleRemove(m.id)}
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
          {members.length === 0 && (
            <li className="py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
              No members yet. Invite someone to get started.
            </li>
          )}
        </ul>
      </Card>

      {/* Invite Member Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Team Member"
        description="They will receive access to this organization."
        size="sm"
      >
        <div className="space-y-4">
          <Input
            id="invite-email"
            label="Email Address"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@company.com"
            error={inviteError}
          />
          <Select
            id="invite-role"
            label="Role"
            options={ASSIGNABLE_ROLES}
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleInvite} loading={inviting}>
              Send Invite
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Role Modal */}
      <Modal
        open={!!roleEditId}
        onClose={() => setRoleEditId(null)}
        title="Change Member Role"
        size="sm"
      >
        <div className="space-y-4">
          <Select
            id="edit-role"
            label="New Role"
            options={ASSIGNABLE_ROLES}
            value={roleEditValue}
            onChange={(e) => setRoleEditValue(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" size="sm" onClick={() => setRoleEditId(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => roleEditId && handleRoleChange(roleEditId)}
              loading={updatingRole}
            >
              Update Role
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Security Tab ───────────────────────────────────────────────────

function SecurityTab({
  settings,
  onSettingsUpdated,
  canWrite,
}: {
  settings: OrganizationSettings | null;
  onSettingsUpdated: (s: OrganizationSettings) => void;
  canWrite: boolean;
}) {
  const defaults: SecurityDefaults = (settings?.defaults as SecurityDefaults) ?? {};
  const [saving, setSaving] = useState(false);

  async function updateSecurity(patch: Partial<SecurityDefaults>) {
    setSaving(true);
    try {
      const merged = { ...defaults, ...patch };
      const res = await apiClient.updateOrganizationSettings({ defaults: merged });
      onSettingsUpdated(res.data);
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Authentication
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Multi-factor authentication and session management
          </p>
        </div>
        <div className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          <SettingRow
            label="Require MFA for all members"
            description="When enabled, every member must set up multi-factor authentication"
          >
            <Toggle
              enabled={defaults.mfaRequired ?? false}
              onChange={(v) => updateSecurity({ mfaRequired: v })}
              disabled={saving || !canWrite}
            />
          </SettingRow>
          <SettingRow
            label="Session Timeout"
            description="Automatically log out users after a period of inactivity"
          >
            <Select
              id="session-timeout"
              options={SESSION_TIMEOUT_OPTIONS}
              value={String(defaults.sessionTimeoutMinutes ?? 720)}
              onChange={(e) => updateSecurity({ sessionTimeoutMinutes: Number(e.target.value) })}
              disabled={saving || !canWrite}
            />
          </SettingRow>
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Password Policy
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Enforce strong password requirements for all members
          </p>
        </div>
        <div className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          <SettingRow
            label="Minimum Password Length"
            description="The minimum number of characters required"
          >
            <Select
              id="pwd-length"
              options={[
                { value: "8", label: "8 characters" },
                { value: "10", label: "10 characters" },
                { value: "12", label: "12 characters" },
                { value: "14", label: "14 characters" },
                { value: "16", label: "16 characters" },
              ]}
              value={String(defaults.passwordMinLength ?? 12)}
              onChange={(e) => updateSecurity({ passwordMinLength: Number(e.target.value) })}
              disabled={saving || !canWrite}
            />
          </SettingRow>
          <SettingRow
            label="Require uppercase letters"
            description="At least one uppercase letter (A-Z)"
          >
            <Toggle
              enabled={defaults.passwordRequireUppercase ?? true}
              onChange={(v) => updateSecurity({ passwordRequireUppercase: v })}
              disabled={saving || !canWrite}
            />
          </SettingRow>
          <SettingRow
            label="Require lowercase letters"
            description="At least one lowercase letter (a-z)"
          >
            <Toggle
              enabled={defaults.passwordRequireLowercase ?? true}
              onChange={(v) => updateSecurity({ passwordRequireLowercase: v })}
              disabled={saving || !canWrite}
            />
          </SettingRow>
          <SettingRow label="Require numbers" description="At least one numeric digit (0-9)">
            <Toggle
              enabled={defaults.passwordRequireNumbers ?? true}
              onChange={(v) => updateSecurity({ passwordRequireNumbers: v })}
              disabled={saving || !canWrite}
            />
          </SettingRow>
          <SettingRow
            label="Require symbols"
            description="At least one special character (!@#$...)"
          >
            <Toggle
              enabled={defaults.passwordRequireSymbols ?? true}
              onChange={(v) => updateSecurity({ passwordRequireSymbols: v })}
              disabled={saving || !canWrite}
            />
          </SettingRow>
        </div>
      </Card>
    </div>
  );
}

// ─── AI Settings Tab ────────────────────────────────────────────────

const ALL_FEATURES: AIFeatureType[] = [
  "quiz_generation",
  "risk_analysis",
  "policy_drafting",
  "policy_generation",
  "vendor_assessment",
  "incident_summary",
  "control_suggestion",
  "automated_check_generation",
  "risk_scoring",
  "vendor_scoring",
  "questionnaire_answering",
  "trust_center_summary",
];

function AISettingsTab({ canWrite }: { canWrite: boolean }) {
  const [providers, setProviders] = useState<AIProviderConfigItem[]>([]);
  const [features, setFeatures] = useState<AIFeatureConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [provRes, featRes] = await Promise.all([
        apiClient.listAIProviders(),
        apiClient.listAIFeatures(),
      ]);
      setProviders(provRes.data);
      setFeatures(featRes.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enabledProviders = providers.filter((p) => p.isEnabled);
  const providerOptions = enabledProviders.map((p) => ({
    value: p.provider,
    label: AI_PROVIDER_LABELS[p.provider],
  }));

  function getFeatureConfig(feature: AIFeatureType): AIFeatureConfigItem | undefined {
    return features.find((f) => f.feature === feature);
  }

  async function handleFeatureSave(
    feature: AIFeatureType,
    provider: AIProviderType,
    model: string,
    isEnabled: boolean,
  ) {
    setSaving(feature);
    try {
      await apiClient.upsertAIFeature(feature, { provider, model, isEnabled });
      await fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(null);
    }
  }

  async function handleFeatureToggle(feature: AIFeatureType, enabled: boolean) {
    const config = getFeatureConfig(feature);
    if (!config) return;
    setSaving(feature);
    try {
      await apiClient.upsertAIFeature(feature, {
        provider: config.provider,
        model: config.model,
        isEnabled: enabled,
      });
      await fetchData();
    } catch {
      // handle error
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  // AI Context wizard call-out — surfaced regardless of provider
  // configuration so users can prepare their context up-front.
  const aiContextCard = (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">AI Context</h3>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Teach Trustalo about your organisation. Used to draft policies, answer customer
            questionnaires, and score risks against your real environment.
          </p>
        </div>
        <a
          href="/settings/ai-context"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          Open wizard
        </a>
      </div>
    </Card>
  );

  if (enabledProviders.length === 0) {
    return (
      <div className="space-y-6">
        {aiContextCard}
        <Card>
          <div className="py-8 text-center">
            <svg
              className="mx-auto h-10 w-10 text-neutral-400"
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
            <h3 className="mt-3 text-base font-semibold text-neutral-900 dark:text-white">
              No AI providers configured
            </h3>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Set <code>AI_PROVIDER</code> in your deployment environment, or configure a per-org
              provider here once a provider is enabled.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {aiContextCard}
      <Card>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            AI Feature Configuration
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Assign an AI provider and model for each platform feature. Configure providers in the
            Integrations page first.
          </p>
        </div>

        <div className="mt-5 divide-y divide-neutral-100 dark:divide-neutral-800">
          {ALL_FEATURES.map((feature) => {
            const config = getFeatureConfig(feature);
            const selectedProvider = (config?.provider ??
              enabledProviders[0]?.provider ??
              "openai") as AIProviderType;
            const modelOptions = AI_PROVIDER_MODELS[selectedProvider] ?? [];
            const selectedModel = config?.model ?? modelOptions[0]?.value ?? "";

            return (
              <div key={feature} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 dark:text-white">
                      {AI_FEATURE_LABELS[feature]}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
                      {config ? (
                        <>
                          Using{" "}
                          <span className="font-medium">{AI_PROVIDER_LABELS[config.provider]}</span>{" "}
                          / {config.model}
                        </>
                      ) : (
                        "Not configured"
                      )}
                    </p>
                  </div>
                  {config && (
                    <Toggle
                      enabled={config.isEnabled}
                      onChange={(v) => handleFeatureToggle(feature, v)}
                      disabled={saving === feature || !canWrite}
                    />
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <Select
                    id={`${feature}-provider`}
                    label="Provider"
                    options={providerOptions}
                    value={config?.provider ?? selectedProvider}
                    onChange={(e) => {
                      const newProv = e.target.value as AIProviderType;
                      const newModels = AI_PROVIDER_MODELS[newProv] ?? [];
                      const newModel = newModels[0]?.value ?? "";
                      handleFeatureSave(feature, newProv, newModel, config?.isEnabled ?? true);
                    }}
                    disabled={saving === feature || !canWrite}
                  />
                  <Select
                    id={`${feature}-model`}
                    label="Model"
                    options={(
                      AI_PROVIDER_MODELS[
                        (config?.provider ?? selectedProvider) as AIProviderType
                      ] ?? []
                    ).map((m) => ({
                      value: m.value,
                      label: m.label,
                    }))}
                    value={config?.model ?? selectedModel}
                    onChange={(e) => {
                      handleFeatureSave(
                        feature,
                        (config?.provider ?? selectedProvider) as AIProviderType,
                        e.target.value,
                        config?.isEnabled ?? true,
                      );
                    }}
                    disabled={saving === feature || !canWrite}
                  />
                  {!config && (
                    <div className="flex items-end">
                      <Button
                        size="sm"
                        disabled={!canWrite}
                        loading={saving === feature}
                        onClick={() =>
                          handleFeatureSave(feature, selectedProvider, selectedModel, true)
                        }
                      >
                        Enable
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Connected Providers
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
            Providers available for AI features
          </p>
        </div>
        <div className="mt-4 space-y-2">
          {enabledProviders.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-2.5 dark:border-neutral-700"
            >
              <div className="flex items-center gap-3">
                <Badge variant="success">Active</Badge>
                <span className="text-sm font-medium text-neutral-900 dark:text-white">
                  {AI_PROVIDER_LABELS[p.provider]}
                </span>
              </div>
              <span className="text-xs text-neutral-400">Key: {p.apiKey ?? "••••••••"}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Main Settings Page ─────────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [org, setOrg] = useState<Organization | null>(null);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [_loadingOrg, setLoadingOrg] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { hasPermission } = usePermissions();
  const canWriteSettings = hasPermission("settings:write");
  const canManageUsers = hasPermission("users:manage");

  const fetchOrg = useCallback(async () => {
    try {
      const [orgRes, settingsRes] = await Promise.allSettled([
        apiClient.getOrganization(),
        apiClient.getOrganizationSettings(),
      ]);
      if (orgRes.status === "fulfilled") setOrg(orgRes.value.data);
      if (settingsRes.status === "fulfilled") setSettings(settingsRes.value.data);
    } catch {
      setError("Failed to load organization data");
    } finally {
      setLoadingOrg(false);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await apiClient.listMembers();
      setMembers(res.data);
    } catch {
      // members will be empty
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (!apiClient.isAuthenticated()) return;
    fetchOrg();
    fetchMembers();
  }, [fetchOrg, fetchMembers]);

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setError(null);
              setLoadingOrg(true);
              fetchOrg();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Manage your organization, team, and security preferences
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Navigation */}
        <nav className="w-52 shrink-0">
          <ul className="space-y-1">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
                  }`}
                >
                  <TabIcon d={tab.icon} />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content Area */}
        <div className="min-w-0 flex-1">
          {activeTab === "general" && (
            <GeneralTab
              org={org}
              settings={settings}
              onOrgUpdated={setOrg}
              onSettingsUpdated={setSettings}
              canWrite={canWriteSettings}
            />
          )}
          {activeTab === "members" && (
            <MembersTab
              members={members}
              loading={loadingMembers}
              onMembersUpdated={fetchMembers}
              canManage={canManageUsers}
            />
          )}
          {activeTab === "security" && (
            <SecurityTab
              settings={settings}
              onSettingsUpdated={setSettings}
              canWrite={canWriteSettings}
            />
          )}
          {activeTab === "ai" && <AISettingsTab canWrite={canWriteSettings} />}
          {activeTab === "ai-usage" && <AIUsageTab />}
        </div>
      </div>
    </div>
  );
}
