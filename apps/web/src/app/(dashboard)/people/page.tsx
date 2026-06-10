"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import {
  apiClient,
  type PersonKind,
  type PersonListItem,
  type PersonReadiness,
  type PersonRole,
  type PersonStats,
  type PersonStatus,
} from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";

const STATUS_OPTIONS: { value: PersonStatus; label: string }[] = [
  { value: "invited", label: "Invited" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "offboarded", label: "Offboarded" },
];

const KIND_OPTIONS: { value: PersonKind; label: string }[] = [
  { value: "employee", label: "Employee" },
  { value: "contractor", label: "Contractor" },
  { value: "vendor_contact", label: "Vendor contact" },
  { value: "service_account", label: "Service account" },
  { value: "other", label: "Other" },
];

const ROLE_OPTIONS: { value: PersonRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "compliance_manager", label: "Compliance manager" },
  { value: "auditor", label: "Auditor" },
  { value: "viewer", label: "Viewer" },
  { value: "integration_admin", label: "Integration admin" },
  { value: "dpo", label: "DPO" },
];

const STATUS_BADGE: Record<PersonStatus, BadgeVariant> = {
  active: "success",
  invited: "info",
  suspended: "warning",
  offboarded: "neutral",
};

const READINESS_BADGE: Record<PersonReadiness, BadgeVariant> = {
  ready: "success",
  at_risk: "danger",
  invited: "info",
  suspended: "warning",
  offboarded: "neutral",
};

const READINESS_LABEL: Record<PersonReadiness, string> = {
  ready: "Ready",
  at_risk: "At risk",
  invited: "Invited",
  suspended: "Suspended",
  offboarded: "Offboarded",
};

function roleLabel(role: PersonRole): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card padding="md">
      <div className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</div>
      <div className="mt-1 text-sm text-neutral-500">{label}</div>
    </Card>
  );
}

export default function PeoplePage() {
  const router = useRouter();
  const { canWrite } = usePermissions();
  const canManage = canWrite("people");

  const [people, setPeople] = useState<PersonListItem[]>([]);
  const [stats, setStats] = useState<PersonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [search, setSearch] = useState("");

  const [inviteOpen, setInviteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (kindFilter) params.kind = kindFilter;
      if (search.trim()) params.search = search.trim();
      const [list, statRes] = await Promise.all([
        apiClient.listPeople(params),
        apiClient.getPeopleStats(),
      ]);
      setPeople(list.data.items);
      setStats(statRes.data);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load people");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, kindFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">People</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Personnel directory — staff, contractors and vendor contacts in compliance scope.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)}>
              Add person
            </Button>
            <Button size="sm" onClick={() => setInviteOpen(true)}>
              Invite to log in
            </Button>
          </div>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total people" value={stats.total} />
          <StatCard label="Active" value={stats.byStatus.active ?? 0} />
          <StatCard label="Invited" value={stats.byStatus.invited ?? 0} />
          <StatCard label="With login" value={stats.withLogin} />
        </div>
      )}

      <Card padding="md">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Input
              label="Search"
              placeholder="Name, email, title…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[{ value: "", label: "All statuses" }, ...STATUS_OPTIONS]}
            />
          </div>
          <div className="w-44">
            <Select
              label="Kind"
              value={kindFilter}
              onChange={(e) => setKindFilter(e.target.value)}
              options={[{ value: "", label: "All kinds" }, ...KIND_OPTIONS]}
            />
          </div>
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Loading…</div>
        ) : people.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-500">No people found.</div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Kind</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Readiness</TableHeader>
                <TableHeader>Devices</TableHeader>
                <TableHeader>Training</TableHeader>
                <TableHeader>Policies</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {people.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/people/${p.id}`)}
                >
                  <TableCell>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {p.fullName}
                    </div>
                    <div className="text-xs text-neutral-500">{p.email}</div>
                  </TableCell>
                  <TableCell>{roleLabel(p.role)}</TableCell>
                  <TableCell className="capitalize">{p.kind.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[p.status]}>{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {p.rollup ? (
                      <Badge variant={READINESS_BADGE[p.rollup.readiness]}>
                        {READINESS_LABEL[p.rollup.readiness]}
                      </Badge>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.rollup ? (
                      <span className={p.rollup.devicesAtRisk > 0 ? "text-red-600" : ""}>
                        {p.rollup.deviceCount}
                        {p.rollup.devicesAtRisk > 0 ? ` (${p.rollup.devicesAtRisk}⚠)` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{p.rollup ? `${p.rollup.trainingPct}%` : "—"}</TableCell>
                  <TableCell>{p.rollup ? `${p.rollup.policyPct}%` : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {inviteOpen && (
        <InvitePersonModal
          onClose={() => setInviteOpen(false)}
          onDone={() => {
            setInviteOpen(false);
            void load();
          }}
        />
      )}
      {addOpen && (
        <AddPersonModal
          onClose={() => setAddOpen(false)}
          onDone={() => {
            setAddOpen(false);
            void load();
          }}
        />
      )}
    </div>
  );
}

function InvitePersonModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PersonRole>("member");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!email.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await apiClient.invitePerson({ email: email.trim(), role });
      onDone();
    } catch (e) {
      setErr((e as Error)?.message || "Failed to invite");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Invite a person to log in" size="md">
      <div className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select
          label="Role"
          value={role}
          onChange={(e) => setRole(e.target.value as PersonRole)}
          options={ROLE_OPTIONS}
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Inviting…" : "Send invite"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function AddPersonModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [kind, setKind] = useState<PersonKind>("employee");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!email.trim() || !fullName.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await apiClient.createPerson({
        email: email.trim(),
        fullName: fullName.trim(),
        kind,
        jobTitle: jobTitle.trim() || null,
        department: department.trim() || null,
      });
      onDone();
    } catch (e) {
      setErr((e as Error)?.message || "Failed to add person");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add a person (no login)" size="md">
      <div className="space-y-4">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Select
          label="Kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as PersonKind)}
          options={KIND_OPTIONS}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
          <Input
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Adding…" : "Add person"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
