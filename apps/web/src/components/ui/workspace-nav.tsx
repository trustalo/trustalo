"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export interface WorkspaceTab {
  label: string;
  href: string;
  // Optional badge (e.g. count) shown to the right of the label.
  badge?: number | string;
  // Optional flag for not-yet-built tabs. They render with a "Soon" pill and
  // are still navigable so users can see what is coming.
  comingSoon?: boolean;
}

export interface WorkspaceNavProps {
  // Workspace title shown above the tabs (e.g. "Business Continuity").
  title: string;
  // Optional subtitle shown under the title (e.g. "ISO 22301").
  subtitle?: string;
  // Optional right-aligned action (e.g. a CTA button).
  action?: ReactNode;
  tabs: WorkspaceTab[];
}

// The most-specific tab whose href matches the pathname is considered active.
// This handles both `/business-continuity` (root tab, e.g. Plans) and
// `/business-continuity/<id>` (still part of the Plans tab) correctly while
// keeping `/business-continuity/bia` separate.
function findActiveTab(pathname: string, tabs: WorkspaceTab[]): WorkspaceTab | undefined {
  let match: WorkspaceTab | undefined;
  for (const tab of tabs) {
    const isMatch = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
    if (!isMatch) continue;
    if (!match || tab.href.length > match.href.length) {
      match = tab;
    }
  }
  return match;
}

export function WorkspaceNav({ title, subtitle, action, tabs }: WorkspaceNavProps) {
  const pathname = usePathname();
  const activeTab = findActiveTab(pathname, tabs);

  return (
    <div className="-mx-6 -mt-6 mb-6 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex flex-wrap items-start justify-between gap-3 px-6 pb-2 pt-5">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
      <nav className="flex flex-wrap gap-1 px-4" aria-label={`${title} sections`}>
        {tabs.map((tab) => {
          const isActive = activeTab?.href === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`relative -mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                  : "border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-200"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {tab.comingSoon && (
                <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
