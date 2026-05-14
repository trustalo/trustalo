"use client";

/**
 * Sidebar user-menu pill.
 *
 * Renders the user's avatar (and, when expanded, name + organisation) at the
 * bottom of the dashboard sidebar. Hovering or focusing the pill reveals a
 * popover with secondary actions (theme toggle, help, sign out) so they no
 * longer take up space in the top header.
 *
 * Behaviour notes:
 *   • The popover is anchored above the pill (sidebar grows downward).
 *   • A small invisible padding strip bridges the trigger and the popover
 *     so moving the cursor between them never closes the menu.
 *   • Uses `group-hover` + `group-focus-within` so keyboard users can reach
 *     the menu via Tab without needing extra state plumbing.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

interface SidebarUserMenuProps {
  collapsed: boolean;
  initials: string;
  name?: string;
  email?: string;
  orgName?: string;
}

export function SidebarUserMenu({
  collapsed,
  initials,
  name,
  email,
  orgName,
}: SidebarUserMenuProps) {
  return (
    <div className="group relative">
      <UserPill
        collapsed={collapsed}
        initials={initials}
        name={name}
        email={email}
        orgName={orgName}
      />
      <UserMenuPopover collapsed={collapsed} />
    </div>
  );
}

function UserPill({
  collapsed,
  initials,
  name,
  email,
  orgName,
}: Omit<SidebarUserMenuProps, "collapsed"> & { collapsed: boolean }) {
  const displayInitials = initials || "--";
  const primary = name || email || "Account";
  const secondary = orgName;

  if (collapsed) {
    return (
      <button
        type="button"
        className="flex w-full items-center justify-center rounded-lg p-1 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800"
        title={primary}
        aria-haspopup="menu"
      >
        <Avatar initials={displayInitials} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:bg-neutral-800"
      aria-haspopup="menu"
    >
      <Avatar initials={displayInitials} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {primary}
        </div>
        {secondary && (
          <div className="truncate text-xs text-neutral-500 dark:text-neutral-400">{secondary}</div>
        )}
      </div>
      <ChevronUpIcon />
    </button>
  );
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
      {initials}
    </div>
  );
}

function UserMenuPopover({ collapsed }: { collapsed: boolean }) {
  // When collapsed the sidebar is a 64px rail, so the popover floats out to
  // the right of the pill rather than above it (otherwise it would clip).
  const positionClasses = collapsed ? "bottom-0 left-full pl-2" : "bottom-full left-0 right-0 pb-2";

  return (
    <div
      role="menu"
      className={`pointer-events-none absolute z-40 ${positionClasses} opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100`}
    >
      <div
        className={`overflow-hidden rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 ${
          collapsed ? "w-56" : ""
        }`}
      >
        <ThemeMenuItem />
        <HelpMenuItem />
        <MenuDivider />
        <SignOutMenuItem />
      </div>
    </div>
  );
}

function ThemeMenuItem() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Avoid SSR mismatch: render a neutral label until next-themes has resolved.
  const isDark = mounted ? resolvedTheme === "dark" : false;
  const label = mounted
    ? isDark
      ? "Switch to light mode"
      : "Switch to dark mode"
    : "Toggle theme";

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      <span>{label}</span>
    </button>
  );
}

function HelpMenuItem() {
  // No dedicated /help route yet; settings is the closest landing page that
  // surfaces account + workspace configuration. Swap for a docs URL or a
  // help dialog when one is available.
  return (
    <Link
      href="/settings"
      role="menuitem"
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 focus:bg-neutral-100 focus:outline-none dark:text-neutral-200 dark:hover:bg-neutral-800 dark:focus:bg-neutral-800"
    >
      <HelpIcon />
      <span>Help &amp; settings</span>
    </Link>
  );
}

function SignOutMenuItem() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      // Best-effort server logout; ignore network errors so the client-side
      // session is always cleared even if the API is unreachable.
      await apiClient.logout().catch(() => {});
    } finally {
      apiClient.clearToken();
      router.replace("/login");
    }
  };

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleSignOut}
      disabled={signingOut}
      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40"
    >
      <SignOutIcon />
      <span>{signingOut ? "Signing out..." : "Sign out"}</span>
    </button>
  );
}

function MenuDivider() {
  return <div className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />;
}

// ── Icons ────────────────────────────────────────────────────────────────

function ChevronUpIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0 text-neutral-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093M12 17h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}
