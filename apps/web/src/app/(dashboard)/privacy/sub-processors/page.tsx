"use client";

/**
 * Sub-processors saved view — Art. 28 lens onto the existing Vendors workspace.
 *
 * This page deliberately does NOT introduce a parallel Vendor model. Vendors
 * are vendors regardless of whether they are also Art. 28 sub-processors;
 * what differs is the GDPR-specific metadata (DPA status, sub-processor
 * purpose, data shared, data locations) and the linked Processing Activities.
 *
 * This page surfaces only vendors flagged as `dataProcessing` and gives the
 * privacy team a single screen to monitor DPA freshness and where personal
 * data flows. Rows deep-link into the canonical vendor detail page so the
 * Vendors team workflow is preserved.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  apiClient,
  type DpaStatus,
  type PrivacySubprocessor,
  type VendorRiskTier,
} from "@/lib/api-client";
import {
  EmptyState,
  KpiCard,
  ListIcon,
  ShieldIcon,
  SpinnerIcon,
  AlertIcon,
  formatDate,
  timeUntil,
} from "../_components";

const RISK_TIER_BADGE: Record<VendorRiskTier, { variant: BadgeVariant; label: string }> = {
  critical: { variant: "danger", label: "Critical" },
  high: { variant: "warning", label: "High" },
  medium: { variant: "info", label: "Medium" },
  low: { variant: "neutral", label: "Low" },
};

const DPA_STATUS_BADGE: Record<DpaStatus, { variant: BadgeVariant; label: string }> = {
  not_required: { variant: "neutral", label: "Not required" },
  not_started: { variant: "danger", label: "Not started" },
  requested: { variant: "warning", label: "Requested" },
  received: { variant: "info", label: "Received" },
  approved: { variant: "success", label: "Approved" },
  expired: { variant: "danger", label: "Expired" },
};

const DPA_FILTER_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "requested", label: "Requested" },
  { value: "received", label: "Received" },
  { value: "approved", label: "Approved" },
  { value: "expired", label: "Expired" },
  { value: "not_required", label: "Not required" },
];

export default function SubProcessorsPage() {
  const [items, setItems] = useState<PrivacySubprocessor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dpaFilter, setDpaFilter] = useState("");
  const [expiringSoon, setExpiringSoon] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (dpaFilter) params.dpaStatus = dpaFilter;
      if (expiringSoon) params.expiringSoon = "true";
      const res = await apiClient.listPrivacySubprocessors(params);
      setItems(res.data.items);
      setTotal(res.data.total);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, dpaFilter, expiringSoon]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filtersActive = Boolean(search || dpaFilter || expiringSoon);

  const dpaCounts = useMemo(() => {
    const counts: Record<DpaStatus, number> = {
      not_required: 0,
      not_started: 0,
      requested: 0,
      received: 0,
      approved: 0,
      expired: 0,
    };
    for (const it of items) counts[it.dpaStatus]++;
    return counts;
  }, [items]);

  const expiringWithin90 = useMemo(
    () =>
      items.filter((it) => {
        if (!it.dpaExpiresAt) return false;
        const ms = new Date(it.dpaExpiresAt).getTime() - Date.now();
        return ms > 0 && ms < 1000 * 60 * 60 * 24 * 90;
      }).length,
    [items],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-400">
          Vendors processing personal data on your behalf (Art. 28). Saved view across the Vendors
          workspace — keep DPAs current and the processing-activity links accurate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          icon={<ListIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          tone="blue"
          value={total}
          label="Sub-processors"
        />
        <KpiCard
          icon={<ShieldIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
          tone="emerald"
          value={dpaCounts.approved}
          label="DPA approved"
        />
        <KpiCard
          icon={<AlertIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
          tone="red"
          value={dpaCounts.not_started + dpaCounts.expired}
          label="DPA gap"
          valueClass={dpaCounts.not_started + dpaCounts.expired > 0 ? "text-red-600" : undefined}
          hint="Not started or expired"
        />
        <KpiCard
          icon={<AlertIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          tone="amber"
          value={expiringWithin90}
          label="Expiring < 90 days"
          valueClass={expiringWithin90 > 0 ? "text-amber-600" : undefined}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="w-72">
          <Input
            id="sp-search"
            placeholder="Search sub-processor name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-48">
          <Select
            id="sp-dpa"
            options={DPA_FILTER_OPTIONS}
            placeholder="All DPA statuses"
            value={dpaFilter}
            onChange={(e) => setDpaFilter(e.target.value)}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-neutral-700 dark:text-neutral-300">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500 dark:border-neutral-700 dark:bg-neutral-900"
            checked={expiringSoon}
            onChange={(e) => setExpiringSoon(e.target.checked)}
          />
          Expiring soon
        </label>
        <span className="ml-auto pb-2 text-sm text-neutral-500 dark:text-neutral-400">
          {total} {total === 1 ? "sub-processor" : "sub-processors"}
        </span>
      </div>

      <Card padding="none">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <SpinnerIcon />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            filtered={filtersActive}
            title="No sub-processors yet"
            hint="Mark vendors as 'data processing' in the Vendors workspace, or link them from a Processing Activity."
            cta={
              <Link
                href="/vendors"
                className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
              >
                Go to Vendors
              </Link>
            }
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Sub-processor</TableHeader>
                <TableHeader>Risk tier</TableHeader>
                <TableHeader>Purpose</TableHeader>
                <TableHeader>Data types</TableHeader>
                <TableHeader>Locations</TableHeader>
                <TableHeader>DPA</TableHeader>
                <TableHeader>DPA expires</TableHeader>
                <TableHeader>Activities</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((sp) => {
                const tier = RISK_TIER_BADGE[sp.riskTier];
                const dpa = DPA_STATUS_BADGE[sp.dpaStatus];
                const exp = sp.dpaExpiresAt ? timeUntil(sp.dpaExpiresAt) : null;
                return (
                  <TableRow
                    key={sp.id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  >
                    <TableCell>
                      <Link
                        href={`/vendors/${sp.id}`}
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {sp.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tier.variant}>{tier.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {sp.subprocessorPurpose ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-neutral-500">
                        {sp.dataTypesShared.length === 0 ? "—" : sp.dataTypesShared.join(", ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-neutral-500">
                        {sp.dataLocations.length === 0 ? "—" : sp.dataLocations.join(", ")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dpa.variant}>{dpa.label}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{formatDate(sp.dpaExpiresAt)}</span>
                        {exp && exp.imminent && !exp.overdue && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400">
                            {exp.label} left
                          </span>
                        )}
                        {exp && exp.overdue && (
                          <span className="text-[11px] text-red-600 dark:text-red-400">
                            Expired
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-neutral-500">
                        {sp.processingActivities.length === 0
                          ? "—"
                          : `${sp.processingActivities.length} linked`}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
