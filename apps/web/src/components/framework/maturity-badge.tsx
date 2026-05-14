import { Badge } from "@/components/ui/badge";

// Frameworks whose content + control coverage have been hardened against
// real audit cycles. Everything else is still considered experimental
// (full requirement set is seeded, but mappings + evidence guidance have
// not yet been validated by a third-party auditor).
//
// Keep this list as `frameworkType` enum values from `apps/api/prisma/schema/framework.prisma`.
const MATURE_FRAMEWORKS: ReadonlySet<string> = new Set(["iso27001", "soc2"]);

export function isExperimentalFramework(frameworkType: string): boolean {
  return !MATURE_FRAMEWORKS.has(frameworkType);
}

interface MaturityBadgeProps {
  frameworkType: string;
  className?: string;
}

/**
 * Renders an "Experimental" badge for frameworks that have not yet been
 * audit-validated. Returns null for mature frameworks so callers can drop
 * this component into any layout without conditional wrapping.
 */
export function MaturityBadge({ frameworkType, className }: MaturityBadgeProps) {
  if (!isExperimentalFramework(frameworkType)) return null;

  return (
    <Badge
      variant="pink"
      title="Experimental: control set is seeded but has not yet been audit-validated."
      className={className}
    >
      Experimental
    </Badge>
  );
}
