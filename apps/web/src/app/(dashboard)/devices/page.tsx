"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DeviceDetailDrawer } from "@/components/device/device-detail-drawer";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell,
} from "@/components/ui/table";
import { apiClient, type DeviceListItem, type DeviceStatus } from "@/lib/api-client";
import { usePermissions } from "@/lib/use-permissions";

const STATUS_BADGE: Record<DeviceStatus, BadgeVariant> = {
  active: "success",
  pending: "info",
  stale: "warning",
  revoked: "danger",
  retired: "neutral",
};

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "stale", label: "Stale" },
  { value: "revoked", label: "Revoked" },
  { value: "retired", label: "Retired" },
];

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  { value: "macos", label: "macOS" },
  { value: "windows", label: "Windows" },
  { value: "linux", label: "Linux" },
];

function signal(state: string) {
  const v: BadgeVariant = state === "pass" ? "success" : state === "fail" ? "danger" : "neutral";
  return <Badge variant={v}>{state}</Badge>;
}

export default function DevicesPage() {
  const { canWrite } = usePermissions();
  const canManage = canWrite("assets");
  const [devices, setDevices] = useState<DeviceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (platformFilter) params.platform = platformFilter;
      if (search.trim()) params.search = search.trim();
      const res = await apiClient.listDevices(params);
      setDevices(res.data.items);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load devices");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, platformFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(id: string) {
    if (!confirm("Revoke this device? Its agent check-ins will be rejected.")) return;
    await apiClient.revokeDevice(id);
    void load();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/assets" className="text-sm text-neutral-500 hover:text-neutral-800">
          ← Back to Assets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Devices
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Endpoint posture reported by the Trustalo device agent. Each device maps to a Computer
          asset and its assigned person. Click a device to see its full detail.
        </p>
      </div>

      <Card padding="md">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="w-48">
            <Input
              label="Search"
              placeholder="Hostname, OS…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="w-40">
            <Select
              label="Platform"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              options={PLATFORM_OPTIONS}
            />
          </div>
        </div>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <div className="py-12 text-center text-sm text-neutral-500">Loading…</div>
        ) : devices.length === 0 ? (
          <div className="py-12 text-center text-sm text-neutral-500">
            No devices enrolled yet. Install the Trustalo device agent to start reporting posture.
          </div>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Device</TableHeader>
                <TableHeader>Assigned to</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Disk</TableHeader>
                <TableHeader>Firewall</TableHeader>
                <TableHeader>Lock</TableHeader>
                <TableHeader>AV</TableHeader>
                <TableHeader>Last seen</TableHeader>
                {canManage && <TableHeader> </TableHeader>}
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((d) => (
                <TableRow key={d.id} className="cursor-pointer" onClick={() => setSelectedId(d.id)}>
                  <TableCell>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100">
                      {d.hostname || d.asset?.name || d.id}
                    </div>
                    <div className="text-xs capitalize text-neutral-500">
                      {d.platform}
                      {d.osVersion ? ` · ${d.osVersion}` : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    {d.person ? (
                      <span className="text-sm">{d.person.fullName}</span>
                    ) : (
                      <span className="text-neutral-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[d.status]}>{d.status}</Badge>
                  </TableCell>
                  <TableCell>{signal(d.diskEncryption)}</TableCell>
                  <TableCell>{signal(d.firewall)}</TableCell>
                  <TableCell>{signal(d.screenLock)}</TableCell>
                  <TableCell>{signal(d.antivirus)}</TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "Never"}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {d.status !== "revoked" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            void revoke(d.id);
                          }}
                        >
                          Revoke
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <DeviceDetailDrawer
        deviceId={selectedId}
        onClose={() => setSelectedId(null)}
        onChanged={load}
      />
    </div>
  );
}
