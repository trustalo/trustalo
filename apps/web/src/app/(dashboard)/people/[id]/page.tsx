"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DeviceDetailDrawer } from "@/components/device/device-detail-drawer";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  apiClient,
  type BackgroundCheckItem,
  type BackgroundCheckStatus,
  type BackgroundCheckType,
  type ChecklistItem,
  type PersonDetail,
  type PersonReadiness,
  type PersonRole,
  type PersonStatus,
} from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";

const ROLE_OPTIONS: { value: PersonRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "compliance_manager", label: "Compliance manager" },
  { value: "auditor", label: "Auditor" },
  { value: "viewer", label: "Viewer" },
  { value: "integration_admin", label: "Integration admin" },
  { value: "dpo", label: "DPO" },
];

const BG_TYPES: BackgroundCheckType[] = [
  "identity",
  "criminal",
  "employment",
  "education",
  "credit",
  "reference",
  "other",
];
const BG_STATUSES: BackgroundCheckStatus[] = [
  "not_started",
  "in_progress",
  "cleared",
  "flagged",
  "expired",
];

const READINESS_BADGE: Record<PersonReadiness, BadgeVariant> = {
  ready: "success",
  at_risk: "danger",
  invited: "info",
  suspended: "warning",
  offboarded: "neutral",
};

const BG_BADGE: Record<BackgroundCheckStatus, BadgeVariant> = {
  cleared: "success",
  in_progress: "info",
  not_started: "neutral",
  flagged: "danger",
  expired: "warning",
};

const TABS = [
  "Overview",
  "Devices",
  "Assets",
  "Background",
  "Onboarding",
  "Training",
  "Policies",
  "Access",
] as const;
type Tab = (typeof TABS)[number];

function signalBadge(state: string) {
  const v: BadgeVariant = state === "pass" ? "success" : state === "fail" ? "danger" : "neutral";
  return <Badge variant={v}>{state}</Badge>;
}

export default function PersonProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { canWrite } = usePermissions();
  const canManage = canWrite("people");

  const [person, setPerson] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("Overview");
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.getPerson(id);
      setPerson(res.data);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load person");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="py-12 text-center text-sm text-neutral-500">Loading…</div>;
  if (error || !person)
    return <div className="py-12 text-center text-sm text-red-600">{error || "Not found"}</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push("/people")}
        className="text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← Back to People
      </button>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              {person.fullName}
            </h1>
            {person.rollup && (
              <Badge variant={READINESS_BADGE[person.rollup.readiness]}>
                {person.rollup.readiness.replace(/_/g, " ")}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            {person.email} · {person.jobTitle || person.kind.replace(/_/g, " ")}
            {person.department ? ` · ${person.department}` : ""}
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              Edit
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-neutral-200 dark:border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium ${
              tab === t
                ? "border-b-2 border-emerald-500 text-emerald-600"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <OverviewTab person={person} />}
      {tab === "Devices" && <DevicesTab person={person} onChanged={load} />}
      {tab === "Assets" && <AssetsTab person={person} />}
      {tab === "Background" && (
        <BackgroundTab person={person} canManage={canManage} onChange={load} />
      )}
      {tab === "Onboarding" && (
        <ChecklistTab person={person} canManage={canManage} onChange={load} />
      )}
      {tab === "Training" && <TrainingTab person={person} />}
      {tab === "Policies" && <PoliciesTab person={person} />}
      {tab === "Access" && <AccessTab person={person} canManage={canManage} onChange={load} />}

      {editOpen && (
        <EditProfileModal
          person={person}
          onClose={() => setEditOpen(false)}
          onDone={() => {
            setEditOpen(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-0.5 text-sm text-neutral-800 dark:text-neutral-200">{value || "—"}</div>
    </div>
  );
}

function OverviewTab({ person }: { person: PersonDetail }) {
  const r = person.rollup;
  return (
    <div className="space-y-6">
      {r && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card padding="md">
            <div className="text-2xl font-semibold">{r.deviceCount}</div>
            <div className="mt-1 text-sm text-neutral-500">
              Devices{r.devicesAtRisk > 0 ? ` · ${r.devicesAtRisk} at risk` : ""}
            </div>
          </Card>
          <Card padding="md">
            <div className="text-2xl font-semibold">{r.trainingPct}%</div>
            <div className="mt-1 text-sm text-neutral-500">
              Training ({r.trainingCompleted}/{r.trainingAssigned})
            </div>
          </Card>
          <Card padding="md">
            <div className="text-2xl font-semibold">{r.policyPct}%</div>
            <div className="mt-1 text-sm text-neutral-500">
              Policies ({r.policiesAcknowledged}/{r.policiesTotal})
            </div>
          </Card>
          <Card padding="md">
            <div className="text-lg font-semibold capitalize">
              {r.backgroundCheckStatus?.replace(/_/g, " ") || "—"}
            </div>
            <div className="mt-1 text-sm text-neutral-500">Background check</div>
          </Card>
        </div>
      )}
      <Card padding="lg">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <Field label="Role" value={person.role.replace(/_/g, " ")} />
          <Field label="Status" value={person.status} />
          <Field label="Kind" value={person.kind.replace(/_/g, " ")} />
          <Field label="Job title" value={person.jobTitle} />
          <Field label="Department" value={person.department} />
          <Field label="Employment type" value={person.employmentType} />
          <Field label="Manager" value={person.manager?.fullName} />
          <Field label="Location" value={person.location} />
          <Field label="Source" value={person.source.replace(/_/g, " ")} />
          <Field
            label="Start date"
            value={person.startDate ? new Date(person.startDate).toLocaleDateString() : null}
          />
          <Field label="Has login" value={person.userId ? "Yes" : "No"} />
          <Field
            label="Last login"
            value={
              person.user?.lastLoginAt
                ? new Date(person.user.lastLoginAt).toLocaleString()
                : "Never"
            }
          />
        </div>
      </Card>
    </div>
  );
}

function DevicesTab({ person, onChanged }: { person: PersonDetail; onChanged: () => void }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (person.devices.length === 0)
    return (
      <Card padding="lg">
        <p className="text-sm text-neutral-500">No devices assigned.</p>
      </Card>
    );
  return (
    <div className="space-y-3">
      {person.devices.map((d) => (
        <Card
          key={d.id}
          padding="md"
          className="cursor-pointer transition-colors hover:border-neutral-300 dark:hover:border-neutral-700"
          onClick={() => setSelectedId(d.id)}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{d.hostname || d.id}</div>
              <div className="text-xs text-neutral-500 capitalize">
                {d.platform} · {d.status}
                {d.lastSeenAt ? ` · seen ${new Date(d.lastSeenAt).toLocaleString()}` : ""}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span>Disk {signalBadge(d.diskEncryption)}</span>
              <span>Firewall {signalBadge(d.firewall)}</span>
              <span>Lock {signalBadge(d.screenLock)}</span>
              <span>AV {signalBadge(d.antivirus)}</span>
            </div>
          </div>
        </Card>
      ))}

      <DeviceDetailDrawer
        deviceId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={onChanged}
      />
    </div>
  );
}

function AssetsTab({ person }: { person: PersonDetail }) {
  if (person.assignedAssets.length === 0)
    return (
      <Card padding="lg">
        <p className="text-sm text-neutral-500">No assets assigned.</p>
      </Card>
    );
  return (
    <div className="space-y-2">
      {person.assignedAssets.map((a) => (
        <Card key={a.id} padding="md">
          <div className="flex items-center justify-between">
            <span className="font-medium">{a.name}</span>
            <span className="text-xs capitalize text-neutral-500">
              {a.type} · {a.classification} · {a.status}
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function BackgroundTab({
  person,
  canManage,
  onChange,
}: {
  person: PersonDetail;
  canManage: boolean;
  onChange: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<BackgroundCheckType>("identity");
  const [status, setStatus] = useState<BackgroundCheckStatus>("not_started");
  const [provider, setProvider] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    try {
      await apiClient.createBackgroundCheck(person.id, {
        type,
        status,
        provider: provider.trim() || null,
      });
      setAdding(false);
      setProvider("");
      onChange();
    } finally {
      setBusy(false);
    }
  }

  async function setCheckStatus(check: BackgroundCheckItem, next: BackgroundCheckStatus) {
    await apiClient.updateBackgroundCheck(person.id, check.id, { status: next });
    onChange();
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div>
          {adding ? (
            <Card padding="md">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-40">
                  <Select
                    label="Type"
                    value={type}
                    onChange={(e) => setType(e.target.value as BackgroundCheckType)}
                    options={BG_TYPES.map((t) => ({ value: t, label: t }))}
                  />
                </div>
                <div className="w-40">
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BackgroundCheckStatus)}
                    options={BG_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
                  />
                </div>
                <div className="w-48">
                  <Input
                    label="Provider"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                  />
                </div>
                <Button size="sm" onClick={add} disabled={busy}>
                  Save
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          ) : (
            <Button size="sm" onClick={() => setAdding(true)}>
              Add background check
            </Button>
          )}
        </div>
      )}

      {person.backgroundChecks.length === 0 ? (
        <Card padding="lg">
          <p className="text-sm text-neutral-500">No background checks recorded.</p>
        </Card>
      ) : (
        person.backgroundChecks.map((c) => (
          <Card key={c.id} padding="md">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium capitalize">{c.type}</div>
                <div className="text-xs text-neutral-500">
                  {c.provider || "—"}
                  {c.expiresAt ? ` · expires ${new Date(c.expiresAt).toLocaleDateString()}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={BG_BADGE[c.status]}>{c.status.replace(/_/g, " ")}</Badge>
                {canManage && c.status !== "cleared" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setCheckStatus(c, "cleared")}
                  >
                    Mark cleared
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}

function ChecklistTab({
  person,
  canManage,
  onChange,
}: {
  person: PersonDetail;
  canManage: boolean;
  onChange: () => void;
}) {
  async function seed(kind: "onboarding" | "offboarding") {
    await apiClient.seedPersonChecklist(person.id, kind);
    onChange();
  }
  async function toggle(item: ChecklistItem) {
    await apiClient.completeChecklistItem(
      person.id,
      item.id,
      item.status === "done" ? "pending" : "done",
    );
    onChange();
  }

  const groups: ("onboarding" | "offboarding")[] = ["onboarding", "offboarding"];
  return (
    <div className="space-y-6">
      {groups.map((kind) => {
        const items = person.checklist.filter((i) => i.kind === kind);
        return (
          <Card key={kind} padding="md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-medium capitalize">{kind}</h3>
              {canManage && items.length === 0 && (
                <Button size="sm" variant="secondary" onClick={() => seed(kind)}>
                  Seed {kind} checklist
                </Button>
              )}
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-neutral-500">Not started.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((i) => (
                  <li key={i.id} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={i.status === "done"}
                      disabled={!canManage}
                      onChange={() => toggle(i)}
                    />
                    <span
                      className={
                        i.status === "done" ? "text-neutral-400 line-through" : "text-neutral-800"
                      }
                    >
                      {i.label}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function TrainingTab({ person }: { person: PersonDetail }) {
  if (!person.userId)
    return (
      <Card padding="lg">
        <p className="text-sm text-neutral-500">
          This person has no login, so no training is assigned.
        </p>
      </Card>
    );
  if (person.training.length === 0)
    return (
      <Card padding="lg">
        <p className="text-sm text-neutral-500">No training assigned.</p>
      </Card>
    );
  return (
    <div className="space-y-2">
      {person.training.map((t) => (
        <Card key={t.id} padding="md">
          <div className="flex items-center justify-between">
            <span className="font-medium">{t.trainingProgram.title}</span>
            <Badge variant={t.status === "completed" ? "success" : "info"}>{t.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

function PoliciesTab({ person }: { person: PersonDetail }) {
  if (!person.userId)
    return (
      <Card padding="lg">
        <p className="text-sm text-neutral-500">
          This person has no login, so no policies are tracked.
        </p>
      </Card>
    );
  if (person.policies.length === 0)
    return (
      <Card padding="lg">
        <p className="text-sm text-neutral-500">No published policies.</p>
      </Card>
    );
  return (
    <div className="space-y-2">
      {person.policies.map((p) => (
        <Card key={p.id} padding="md">
          <div className="flex items-center justify-between">
            <span className="font-medium">{p.title}</span>
            <Badge variant={p.acknowledgedCurrent ? "success" : "warning"}>
              {p.acknowledgedCurrent ? "Acknowledged" : "Pending"}
            </Badge>
          </div>
        </Card>
      ))}
    </div>
  );
}

function AccessTab({
  person,
  canManage,
  onChange,
}: {
  person: PersonDetail;
  canManage: boolean;
  onChange: () => void;
}) {
  const [role, setRole] = useState<PersonRole>(person.role);
  const [busy, setBusy] = useState(false);
  const isOwner = person.role === "owner";

  async function saveRole() {
    setBusy(true);
    try {
      await apiClient.updatePersonRole(person.id, role);
      onChange();
    } finally {
      setBusy(false);
    }
  }
  async function setStatus(status: PersonStatus) {
    setBusy(true);
    try {
      await apiClient.setPersonStatus(person.id, status);
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card padding="lg">
        <h3 className="mb-3 font-medium">Role &amp; access</h3>
        {isOwner ? (
          <p className="text-sm text-neutral-500">
            This person is the organization owner; their role can&apos;t be changed here.
          </p>
        ) : (
          <div className="flex items-end gap-3">
            <div className="w-56">
              <Select
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value as PersonRole)}
                options={ROLE_OPTIONS}
                disabled={!canManage}
              />
            </div>
            {canManage && (
              <Button size="sm" onClick={saveRole} disabled={busy || role === person.role}>
                Update role
              </Button>
            )}
          </div>
        )}
      </Card>

      {canManage && !isOwner && (
        <Card padding="lg">
          <h3 className="mb-3 font-medium">Lifecycle</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setStatus("active")}
              disabled={busy}
            >
              Activate
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setStatus("suspended")}
              disabled={busy}
            >
              Suspend
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setStatus("offboarded")}
              disabled={busy}
            >
              Offboard
            </Button>
          </div>
          <p className="mt-2 text-xs text-neutral-500">
            Offboarding seeds the offboarding checklist and revokes the person&apos;s devices.
          </p>
        </Card>
      )}
    </div>
  );
}

function EditProfileModal({
  person,
  onClose,
  onDone,
}: {
  person: PersonDetail;
  onClose: () => void;
  onDone: () => void;
}) {
  const [fullName, setFullName] = useState(person.fullName);
  const [jobTitle, setJobTitle] = useState(person.jobTitle ?? "");
  const [department, setDepartment] = useState(person.department ?? "");
  const [location, setLocation] = useState(person.location ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await apiClient.updatePerson(person.id, {
        fullName: fullName.trim(),
        jobTitle: jobTitle.trim() || null,
        department: department.trim() || null,
        location: location.trim() || null,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Edit profile" size="md">
      <div className="space-y-4">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={busy}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
