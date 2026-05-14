import type { ReactNode } from "react";
import { WorkspaceNav, type WorkspaceTab } from "@/components/ui/workspace-nav";

/**
 * Tabs for the Privacy / GDPR workspace. Order is intentional and mirrors the
 * mental model used by Vanta / Drata / OneTrust:
 *
 *   1. RoPA (Records of Processing) — the foundation; everything else binds back to it.
 *   2. DPIAs                          — risk assessment for high-risk processing.
 *   3. Data breaches                  — Art. 33/34 register with 72-hour clock.
 *   4. DSARs                          — subject-rights queue with SLA tracking.
 *   5. Sub-processors                 — saved view over Vendors filtered for GDPR processors.
 *
 * RoPA acts as the workspace landing page (`/privacy`) because it is what
 * auditors most often ask for first.
 */
const TABS: WorkspaceTab[] = [
  { label: "Records of Processing", href: "/privacy" },
  { label: "DPIAs", href: "/privacy/dpias" },
  { label: "Data Breaches", href: "/privacy/data-breaches" },
  { label: "DSAR Requests", href: "/privacy/dsars" },
  { label: "Sub-processors", href: "/privacy/sub-processors" },
];

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <WorkspaceNav
        title="Privacy"
        subtitle="GDPR — Records of Processing, DPIAs, breaches, and data-subject requests"
        tabs={TABS}
      />
      {children}
    </div>
  );
}
