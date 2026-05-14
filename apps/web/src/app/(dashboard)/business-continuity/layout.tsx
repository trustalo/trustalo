import type { ReactNode } from "react";
import { WorkspaceNav, type WorkspaceTab } from "@/components/ui/workspace-nav";

const TABS: WorkspaceTab[] = [
  { label: "Plans", href: "/business-continuity" },
  { label: "BIA", href: "/business-continuity/bia" },
  { label: "Exercises", href: "/business-continuity/exercises" },
];

export default function BusinessContinuityLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <WorkspaceNav
        title="Business Continuity"
        subtitle="ISO 22301 — plans, impact analyses, and recovery exercises"
        tabs={TABS}
      />
      {children}
    </div>
  );
}
