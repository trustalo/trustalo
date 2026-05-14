import type { ReactNode } from "react";
import { WorkspaceNav, type WorkspaceTab } from "@/components/ui/workspace-nav";

// "Use Cases" was intentionally collapsed into AISystem.purpose for v1 to
// avoid a half-built M:M model; revisit when teams need many use cases per
// system. "Monitoring" was renamed to "Incidents" because what we ship today
// is operational logging, not live ML telemetry.
const TABS: WorkspaceTab[] = [
  { label: "AI Inventory", href: "/ai-governance" },
  { label: "Risk Assessments", href: "/ai-governance/risk-assessments" },
  { label: "Impact Assessments", href: "/ai-governance/impact-assessments" },
  { label: "Incidents", href: "/ai-governance/incidents" },
];

export default function AIGovernanceLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <WorkspaceNav
        title="AI Governance"
        subtitle="ISO 42001 + EU AI Act — AI inventory, risk, impact, and incidents"
        tabs={TABS}
      />
      {children}
    </div>
  );
}
