import { z } from "zod";

const frameworkTypeEnum = z.enum([
  "iso27001",
  "iso27017",
  "iso27018",
  "iso22301",
  "iso42001",
  "soc2",
  "essential8",
  "nist_csf_2",
  "gdpr",
]);

export const listFrameworksQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: frameworkTypeEnum.optional(),
  active: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
});

const adoptFrameworkBodyBase = z.object({
  frameworkId: z.string().min(1),
  targetDate: z.coerce.date().optional(),
});

export const frameworkInstanceParams = z.object({
  id: z.string().min(1),
});

export const toggleInstanceBody = z.object({
  isEnabled: z.boolean(),
});

// Free-form maturity/tier value. Validated against TIERED_FRAMEWORK_LEVELS in
// the service layer once we know which framework the instance belongs to.
const maturityLevelValue = z
  .string()
  .min(1)
  .max(32)
  .regex(/^[a-z0-9_-]+$/i, "Invalid maturity level");

export const updateInstanceBody = z.object({
  status: z.enum(["not_started", "in_progress", "ready_for_audit", "certified"]).optional(),
  targetDate: z.coerce.date().nullable().optional(),
  isEnabled: z.boolean().optional(),
  targetMaturityLevel: maturityLevelValue.nullable().optional(),
});

export const adoptFrameworkBody = adoptFrameworkBodyBase.extend({
  targetMaturityLevel: maturityLevelValue.nullable().optional(),
});

export const requirementMappingsQuery = z.object({
  source: frameworkTypeEnum.optional(),
  target: frameworkTypeEnum.optional(),
  relationship: z.enum(["equivalent", "partial", "informs"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export type ListFrameworksQuery = z.infer<typeof listFrameworksQuery>;
export type AdoptFrameworkBody = z.infer<typeof adoptFrameworkBody>;
export type ToggleInstanceBody = z.infer<typeof toggleInstanceBody>;
export type UpdateInstanceBody = z.infer<typeof updateInstanceBody>;
export type RequirementMappingsQuery = z.infer<typeof requirementMappingsQuery>;
