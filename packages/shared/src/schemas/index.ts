import { z } from "zod";

// ──────────────────────────────────────────────
// Reusable base schemas
// ──────────────────────────────────────────────

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .max(255)
  .transform((v) => v.toLowerCase().trim());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const slugSchema = z
  .string()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CUID_REGEX = /^c[a-z0-9]{24,}$/;

export const idParamSchema = z.object({
  id: z
    .string()
    .refine(
      (val) => UUID_REGEX.test(val) || CUID_REGEX.test(val),
      "ID must be a valid UUID or CUID",
    ),
});

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

// ──────────────────────────────────────────────
// Organization
// ──────────────────────────────────────────────

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  slug: slugSchema,
  plan: z.string().optional().default("free"),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: slugSchema.optional(),
  plan: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(100),
  organizationName: z.string().min(2).max(100),
});

// ──────────────────────────────────────────────
// Inferred types (for convenience)
// ──────────────────────────────────────────────

export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type IdParam = z.infer<typeof idParamSchema>;
