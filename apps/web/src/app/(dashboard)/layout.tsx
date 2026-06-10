"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Sidebar, type NavItem, type NavSection } from "@/components/ui/sidebar";
import { SidebarUserMenu } from "@/components/sidebar-user-menu";
import { apiClient, type FrameworkType } from "@/lib/api-client";
import { usePermissions, NAV_PERMISSIONS } from "@/lib/use-permissions";
import { useEnterpriseGated } from "@/lib/enterprise-license";
import { ChatProvider } from "@/components/chat/chat-provider";
import { ChatFab } from "@/components/chat/chat-fab";
import { ChatDrawer } from "@/components/chat/chat-drawer";

// Nav-item labels that the layout post-processes after permission
// filtering to apply EE gating. Listed here (rather than inline) so
// the set is easy to discover and extend as more EE-only surfaces
// graduate into the sidebar.
const ENTERPRISE_NAV_LABELS = new Set<string>(["Trust Center"]);

function Icon({ d }: { d: string }) {
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

// ── Section: Workspace ─────────────────────────────────────────────────
const WORKSPACE_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <Icon d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
    ),
  },
  {
    label: "Tasks",
    href: "/tasks",
    icon: (
      <Icon d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    ),
  },
  {
    label: "My Compliance",
    href: "/my-compliance",
    icon: <Icon d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  // "AI usage" used to live here. It's an admin/observability surface
  // rather than a daily-driver workflow, so it now lives as a tab
  // under Settings → AI Usage. The legacy /dashboard/ai-usage route
  // server-redirects to /settings to preserve existing bookmarks.
  // The compliance assistant is reachable from any dashboard route
  // via the floating chat button + drawer (see <ChatFab /> / <ChatDrawer />
  // mounted at the layout root). No standalone nav entry needed.
];

// ── Section: Compliance ────────────────────────────────────────────────
const COMPLIANCE_ITEMS: NavItem[] = [
  {
    label: "Frameworks",
    href: "/frameworks",
    icon: (
      <Icon d="M9 12h6m-3-3v6m-7 4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
  },
  {
    label: "Controls",
    href: "/controls",
    icon: (
      <Icon d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    ),
  },
  {
    label: "Policies",
    href: "/policies",
    icon: (
      <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    label: "Evidence",
    href: "/evidence",
    icon: (
      <Icon d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    ),
  },
  {
    label: "Audits",
    href: "/audits",
    icon: (
      <Icon d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    ),
  },
];

// ── Section: Risk & Trust ──────────────────────────────────────────────
const RISK_TRUST_ITEMS: NavItem[] = [
  {
    label: "Risks",
    href: "/risks",
    icon: (
      <Icon d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
  },
  {
    label: "Vendors",
    href: "/vendors",
    icon: (
      <Icon d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
  },
  {
    label: "People",
    href: "/people",
    icon: (
      <Icon d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 10-3-7" />
    ),
  },
  {
    label: "Assets",
    href: "/assets",
    icon: (
      <Icon d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
    ),
  },
  {
    label: "Incidents",
    href: "/incidents",
    icon: (
      <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    ),
  },
  {
    label: "Trust Center",
    href: "/trust-center",
    icon: (
      <Icon d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    label: "Questionnaires",
    href: "/questionnaires",
    icon: (
      <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2zM12 11h.01" />
    ),
  },
];

// ── Section: Domains (framework-gated) ─────────────────────────────────
// Items in this section are *always* shown so users can discover the feature.
// When the underlying framework hasn't been adopted, the item is rendered
// locked (greyed out, tooltip explains why) and clicking it routes to the
// Frameworks page so the user can adopt it.
interface DomainNavItem extends NavItem {
  requiredFramework: FrameworkType;
  requiredFrameworkLabel: string;
}

const DOMAIN_ITEMS: DomainNavItem[] = [
  {
    label: "Business Continuity",
    href: "/business-continuity",
    icon: (
      <Icon d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    ),
    requiredFramework: "iso22301",
    requiredFrameworkLabel: "ISO 22301",
  },
  {
    label: "AI Governance",
    href: "/ai-governance",
    icon: (
      <Icon d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    ),
    requiredFramework: "iso42001",
    requiredFrameworkLabel: "ISO 42001",
  },
  {
    label: "Privacy",
    href: "/privacy",
    icon: (
      <Icon d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
    ),
    requiredFramework: "gdpr",
    requiredFrameworkLabel: "GDPR",
  },
];

// MARKETPLACE_ITEMS was scaffolded for a Partners directory entry but is
// not currently rendered by the sidebar. Removed to keep noUnusedLocals
// happy; reintroduce when the Partners page is wired up to navigation.

// ── Section: Program ───────────────────────────────────────────────────
const PROGRAM_ITEMS: NavItem[] = [
  {
    label: "Training",
    href: "/training",
    icon: (
      <Icon d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    ),
  },
  {
    label: "Integrations",
    href: "/integrations",
    icon: (
      <Icon d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    ),
  },
  {
    label: "Settings",
    href: "/settings",
    icon: (
      <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    ),
  },
];

function filterByPermission(items: NavItem[], hasPermission: (p: string) => boolean): NavItem[] {
  return items.filter((item) => {
    const requiredPerm = NAV_PERMISSIONS[item.label];
    if (requiredPerm === undefined || requiredPerm === null) return true;
    return hasPermission(requiredPerm);
  });
}

/**
 * Mark each EE-only nav item as `locked` when the deployment doesn't
 * hold a valid Enterprise license. Items stay visible (so users can
 * discover them and see the upgrade prompt) but render greyed-out
 * with a lock icon and an explanatory tooltip; the click is a no-op
 * because `lockedFallbackHref` is omitted.
 */
function applyEnterpriseGating(items: NavItem[], enterpriseGated: boolean): NavItem[] {
  if (!enterpriseGated) return items;
  return items.map((item) => {
    if (!ENTERPRISE_NAV_LABELS.has(item.label)) return item;
    return {
      ...item,
      locked: true,
      lockedTooltip: `${item.label} is a Trustalo Enterprise feature.`,
    };
  });
}

function buildDomainItems(
  enabled: Set<FrameworkType>,
  hasPermission: (p: string) => boolean,
): NavItem[] {
  return DOMAIN_ITEMS.filter((item) => {
    const requiredPerm = NAV_PERMISSIONS[item.label];
    if (requiredPerm && !hasPermission(requiredPerm)) return false;
    return true;
  }).map((item) => {
    if (enabled.has(item.requiredFramework)) {
      return {
        label: item.label,
        href: item.href,
        icon: item.icon,
      };
    }
    return {
      label: item.label,
      href: item.href,
      icon: item.icon,
      locked: true,
      lockedTooltip: `Adopt ${item.requiredFrameworkLabel} in Frameworks to enable ${item.label}.`,
      lockedFallbackHref: "/frameworks",
    };
  });
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  // Gate the entire dashboard tree behind a synchronous auth check so the
  // shell never flashes for unauthenticated users. The check runs on first
  // mount; while it's pending (or while we're navigating to /login) we
  // render nothing. apiClient.isAuthenticated() is synchronous so this
  // resolves within a single render frame for the happy path.
  const [authChecked, setAuthChecked] = useState(false);
  const [enabledFrameworkTypes, setEnabledFrameworkTypes] = useState<Set<FrameworkType>>(new Set());
  const [orgName, setOrgName] = useState<string>("");
  const [userInitials, setUserInitials] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const { hasPermission } = usePermissions();
  const enterpriseGated = useEnterpriseGated();

  useEffect(() => {
    if (!apiClient.isAuthenticated()) {
      window.location.href = "/login";
      return;
    }
    setAuthChecked(true);

    apiClient
      .listFrameworkInstances()
      .then((res) => {
        const types = new Set<FrameworkType>(
          res.data.filter((fi) => fi.isEnabled).map((fi) => fi.framework.frameworkType),
        );
        setEnabledFrameworkTypes(types);
      })
      .catch(() => {});

    apiClient
      .getOrganization()
      .then((res) => setOrgName(res.data.name))
      .catch(() => {});

    apiClient
      .getMe()
      .then((res) => {
        const user = res.user as { name?: string; email?: string } | undefined;
        if (user?.name) {
          setUserName(user.name);
          setUserInitials(
            user.name
              .split(" ")
              .map((n: string) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
          );
        }
        if (user?.email) {
          setUserEmail(user.email);
          // Fall back to email-derived initials when no display name is set.
          if (!user.name) {
            setUserInitials(user.email.slice(0, 2).toUpperCase());
          }
        }
      })
      .catch(() => {});
  }, []);

  const sections: NavSection[] = useMemo(() => {
    const domainItems = buildDomainItems(enabledFrameworkTypes, hasPermission);
    return [
      {
        // First section has no header — it sits directly under the logo.
        items: filterByPermission(WORKSPACE_ITEMS, hasPermission),
      },
      {
        label: "Compliance",
        items: filterByPermission(COMPLIANCE_ITEMS, hasPermission),
      },
      {
        label: "Risk & Trust",
        items: applyEnterpriseGating(
          filterByPermission(RISK_TRUST_ITEMS, hasPermission),
          enterpriseGated,
        ),
      },
      ...(domainItems.length > 0 ? [{ label: "Domains", items: domainItems }] : []),
      // Hidden until launch — restore when the marketplace is ready to ship.
      // {
      //   label: "Marketplace",
      //   items: filterByPermission(MARKETPLACE_ITEMS, hasPermission),
      // },
      {
        label: "Program",
        items: filterByPermission(PROGRAM_ITEMS, hasPermission),
      },
    ].filter((section) => section.items.length > 0);
  }, [enabledFrameworkTypes, hasPermission, enterpriseGated]);

  // Render-block until we've confirmed an active session. This prevents the
  // dashboard shell from flashing on screen for an unauthenticated user
  // before window.location.href has a chance to redirect to /login.
  if (!authChecked) return null;

  return (
    <ChatProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar
          sections={sections}
          footer={({ collapsed }) => (
            <SidebarUserMenu
              collapsed={collapsed}
              initials={userInitials}
              name={userName}
              email={userEmail}
              orgName={orgName}
            />
          )}
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-neutral-50 p-6 dark:bg-neutral-950">
            {children}
          </main>
        </div>
      </div>

      {/* Global chat affordances: floating button + slide-in drawer.
          Mounted once per layout so they survive client-side navigation. */}
      <ChatFab />
      <ChatDrawer />
    </ChatProvider>
  );
}
