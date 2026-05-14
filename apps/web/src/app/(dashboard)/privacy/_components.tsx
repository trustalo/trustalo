"use client";

/**
 * Shared UI primitives for the Privacy / GDPR workspace. Mirrors the local
 * helpers used across AI Governance and BCP pages (KpiCard, SortableHeader,
 * EmptyState, sort icons) so the visual language stays consistent. Kept inside
 * the workspace folder rather than promoted to /components/ui because the
 * other workspaces have not adopted them as primitives either — the patterns
 * are intentionally co-located while we shape the design system.
 */

import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { TableHeader } from "@/components/ui/table";

export type SortDir = "asc" | "desc";

export type KpiTone = "blue" | "red" | "amber" | "emerald" | "purple" | "neutral";

const KPI_TONES: Record<KpiTone, string> = {
  blue: "bg-blue-50 dark:bg-blue-950",
  red: "bg-red-50 dark:bg-red-950",
  amber: "bg-amber-50 dark:bg-amber-950",
  emerald: "bg-emerald-50 dark:bg-emerald-950",
  purple: "bg-purple-50 dark:bg-purple-950",
  neutral: "bg-neutral-100 dark:bg-neutral-800",
};

export function KpiCard({
  icon,
  tone,
  value,
  label,
  valueClass,
  hint,
}: {
  icon: ReactNode;
  tone: KpiTone;
  value: number | string;
  label: string;
  valueClass?: string;
  hint?: string;
}) {
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className={`rounded-lg p-2 ${KPI_TONES[tone]}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className={`text-2xl font-bold ${valueClass ?? "text-neutral-900 dark:text-white"}`}>
            {value}
          </p>
          <p className="text-xs text-neutral-500">{label}</p>
          {hint && (
            <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">{hint}</p>
          )}
        </div>
      </div>
    </Card>
  );
}

export function SortableHeader({
  label,
  column,
  current,
  onClick,
}: {
  label: string;
  column: string;
  current: SortDir | null;
  onClick: (column: string) => void;
}) {
  return (
    <TableHeader>
      <button
        type="button"
        onClick={() => onClick(column)}
        className="-mx-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {label}
        <SortIcon direction={current} />
      </button>
    </TableHeader>
  );
}

export function EmptyState({
  filtered,
  title,
  hint,
  cta,
}: {
  filtered: boolean;
  title: string;
  hint: string;
  cta?: ReactNode;
}) {
  return (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
        <ListIcon className="h-6 w-6 text-neutral-400" />
      </div>
      <h3 className="text-sm font-medium text-neutral-900 dark:text-white">
        {filtered ? "No records match your filters" : title}
      </h3>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        {filtered ? "Try adjusting your search or filters." : hint}
      </p>
      {!filtered && cta && <div className="mt-4">{cta}</div>}
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</h3>
        {description && (
          <p className="text-xs text-neutral-500 dark:text-neutral-400">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

export function DetailField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="mt-0.5 text-sm text-neutral-900 dark:text-neutral-100">{children}</div>
    </div>
  );
}

export function DetailLong({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <h4 className="border-b border-neutral-200 pb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
        {title}
      </h4>
      <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-300">
        {children}
      </p>
    </>
  );
}

export function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function formatDateTime(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

/**
 * Returns a human-readable countdown to a deadline. Used both for the GDPR
 * Art. 33 72-hour breach clock and for DSAR SLA badges (1-month default,
 * +2 months extendable). When already overdue, prefixes with "−".
 */
export function timeUntil(deadline: string | Date | null | undefined): {
  label: string;
  overdue: boolean;
  imminent: boolean;
} {
  if (!deadline) return { label: "—", overdue: false, imminent: false };
  const target = typeof deadline === "string" ? new Date(deadline) : deadline;
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const overdue = diffMs < 0;
  const absMs = Math.abs(diffMs);
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  let label: string;
  if (days >= 2) label = `${days}d`;
  else if (hours >= 1) label = `${hours}h`;
  else label = `${Math.floor(absMs / (1000 * 60))}m`;
  if (overdue) label = `−${label}`;
  return { label, overdue, imminent: !overdue && hours <= 24 };
}

// ── Icons ─────────────────────────────────────────────────────────────────

export function PlusIcon({ className = "mr-1.5 h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

export function ListIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 5.25h16.5m-16.5 6.75h16.5m-16.5 6.75h16.5"
      />
    </svg>
  );
}

export function ShieldIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M9 4.5h6a3 3 0 013 3v9a3 3 0 01-3 3h-6a3 3 0 01-3-3v-9a3 3 0 013-3z"
      />
    </svg>
  );
}

export function ClockIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export function AlertIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

export function FlameIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
      />
    </svg>
  );
}

export function UserGroupIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

export function FileIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

export function SortIcon({ direction }: { direction?: SortDir | null }) {
  return (
    <svg
      className={`h-3.5 w-3.5 ${direction ? "text-blue-600" : "text-neutral-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {direction === "asc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : direction === "desc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      )}
    </svg>
  );
}

export function SpinnerIcon() {
  return (
    <svg className="h-6 w-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
