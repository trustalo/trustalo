"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  // When true, the item is rendered greyed-out and not clickable. Used for
  // surfaces that depend on something the org hasn't adopted yet (e.g. a
  // framework). Clicking it routes to `lockedFallbackHref` if provided so the
  // user can take action, otherwise it does nothing.
  locked?: boolean;
  lockedTooltip?: string;
  lockedFallbackHref?: string;
}

interface NavSection {
  // When omitted, the section renders without a header (useful for the first
  // section right under the logo).
  label?: string;
  items: NavItem[];
}

interface SidebarProps {
  sections: NavSection[];
  // Optional content rendered at the bottom of the sidebar (e.g. user menu).
  // The footer receives `collapsed` so it can adapt its layout to the
  // narrow rail when the sidebar is collapsed.
  footer?: (props: { collapsed: boolean }) => ReactNode;
}

function isActiveItem(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/dashboard") return false;
  return pathname.startsWith(`${href}/`);
}

function SidebarInner({ sections, footer }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`flex h-screen flex-col border-r border-neutral-200 bg-white transition-[width] duration-200 dark:border-neutral-800 dark:bg-neutral-900 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-4 dark:border-neutral-800">
        {!collapsed && (
          <Link href="/dashboard" className="text-lg font-bold text-neutral-900 dark:text-white">
            Trust<span className="text-blue-600">alo</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 overflow-y-auto p-2">
        {sections.map((section, sectionIdx) => (
          <div key={section.label ?? `section-${sectionIdx}`} className="space-y-0.5">
            {section.label && !collapsed && (
              <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {section.label}
              </div>
            )}
            {section.label && collapsed && sectionIdx > 0 && (
              <div className="mx-2 mb-1 mt-2 border-t border-neutral-200 dark:border-neutral-800" />
            )}
            {section.items.map((item) => (
              <SidebarLink
                key={item.href}
                item={item}
                collapsed={collapsed}
                isActive={!item.locked && isActiveItem(pathname, item.href)}
              />
            ))}
          </div>
        ))}
      </nav>

      {footer && (
        <div className="shrink-0 border-t border-neutral-200 p-2 dark:border-neutral-800">
          {footer({ collapsed })}
        </div>
      )}
    </aside>
  );
}

interface SidebarLinkProps {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
}

function SidebarLink({ item, collapsed, isActive }: SidebarLinkProps) {
  const titleAttr = item.locked
    ? (item.lockedTooltip ?? `${item.label} is unavailable`)
    : collapsed
      ? item.label
      : undefined;

  // Locked items still need to be reachable for users to discover the feature.
  // If a fallback href is provided we route there (e.g. /frameworks to adopt
  // the required framework); otherwise the item is rendered as a non-link with
  // the tooltip explaining why.
  const href = item.locked ? item.lockedFallbackHref : item.href;

  const baseClasses =
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

  const stateClasses = item.locked
    ? "cursor-not-allowed text-neutral-400 hover:bg-neutral-50 dark:text-neutral-600 dark:hover:bg-neutral-800/50"
    : isActive
      ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100";

  const content = (
    <>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.locked && <LockIcon />}
        </>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        title={titleAttr}
        aria-disabled={item.locked || undefined}
        className={`${baseClasses} ${stateClasses}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div title={titleAttr} aria-disabled className={`${baseClasses} ${stateClasses}`}>
      {content}
    </div>
  );
}

function LockIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 11c0-1.657-1.343-3-3-3s-3 1.343-3 3m6 0v6m-6-6v6m9-9V7a4 4 0 00-8 0v0M5 11h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z"
      />
    </svg>
  );
}

const Sidebar = dynamic(() => Promise.resolve(SidebarInner), {
  ssr: false,
  loading: () => (
    <aside className="flex h-screen w-60 flex-col border-r border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900" />
  ),
});

export { Sidebar, type NavItem, type NavSection, type SidebarProps };
