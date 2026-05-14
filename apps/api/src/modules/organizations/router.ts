import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "../../../generated/prisma/client/index.js";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import { authorize } from "../../middleware/authorize.js";
import { authService } from "../auth/service.js";

const patchOrgBody = z.object({
  name: z.string().min(1),
});

const securityDefaultsSchema = z
  .object({
    mfaRequired: z.boolean().optional(),
    sessionTimeoutMinutes: z.number().min(5).max(43200).optional(),
    passwordMinLength: z.number().min(8).max(128).optional(),
    passwordRequireUppercase: z.boolean().optional(),
    passwordRequireLowercase: z.boolean().optional(),
    passwordRequireNumbers: z.boolean().optional(),
    passwordRequireSymbols: z.boolean().optional(),
  })
  .optional()
  .nullable();

const patchSettingsBody = z.object({
  companySize: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  timezone: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  defaults: securityDefaultsSchema,
});

const inviteMemberBody = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "compliance_manager", "auditor", "viewer", "integration_admin"]),
});

const updateMemberRoleBody = z.object({
  role: z.enum(["admin", "compliance_manager", "auditor", "viewer", "integration_admin"]),
});

export const organizationsRouter: Router = Router();

organizationsRouter.get("/", authorize("settings:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;

    const org = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!org) {
      res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Organization not found" },
      });
      return;
    }

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

organizationsRouter.patch("/", authorize("settings:write"), async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = patchOrgBody.parse(req.body);

    const org = await prisma.tenant.update({
      where: { id: tenantId },
      data: { name: body.name },
    });

    res.json({ success: true, data: org });
  } catch (err) {
    next(err);
  }
});

organizationsRouter.get("/members", authorize("users:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;

    const memberships = await prisma.membership.findMany({
      where: { tenantId, status: "active" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    });

    const members = memberships.map((m: any) => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
    }));

    res.json({ success: true, data: members });
  } catch (err) {
    next(err);
  }
});

organizationsRouter.post("/members/invite", authorize("users:manage"), async (req, res, next) => {
  try {
    const auth = (req as any).auth as { userId: string; tenantId: string };
    const body = inviteMemberBody.parse(req.body);

    // Reject duplicate memberships up-front so the (per-provider) admin-create
    // call below is never attempted for users who already have access.
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      select: { id: true },
    });
    if (existingUser) {
      const existingMembership = await prisma.membership.findUnique({
        where: {
          userId_tenantId: {
            userId: existingUser.id,
            tenantId: auth.tenantId,
          },
        },
      });
      if (existingMembership) {
        res.status(409).json({
          success: false,
          error: {
            code: "CONFLICT",
            message: "User is already a member of this organization",
          },
        });
        return;
      }
    }

    // Delegate to the active auth provider so Cognito (or any plugin that
    // implements adminCreateUser) provisions the upstream identity. For the
    // local provider this just creates the User row + Membership(invited).
    const result = await authService.inviteUser(auth.tenantId, auth.userId, {
      email: body.email,
      role: body.role,
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

organizationsRouter.patch(
  "/members/:memberId",
  authorize("users:manage"),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).auth.tenantId as string;
      // Coerce to plain string: Express v5 widens `req.params[key]` to
      // `string | string[] | undefined`, which silently degrades Prisma
      // include-type propagation when fed into a `where` clause.
      const memberId = String(req.params["memberId"]);
      const body = updateMemberRoleBody.parse(req.body);

      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, tenantId },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      if (!membership) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Membership not found" },
        });
        return;
      }

      if (membership.role === "owner") {
        res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Cannot change the owner's role" },
        });
        return;
      }

      await prisma.membership.update({
        where: { id: membership.id },
        data: { role: body.role as any },
      });

      res.json({
        success: true,
        data: {
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          role: body.role,
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

organizationsRouter.delete(
  "/members/:memberId",
  authorize("users:manage"),
  async (req, res, next) => {
    try {
      const tenantId = (req as any).auth.tenantId as string;
      const memberId = String(req.params["memberId"]);

      const membership = await prisma.membership.findFirst({
        where: { userId: memberId, tenantId },
      });

      if (!membership) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Membership not found" },
        });
        return;
      }

      if (membership.role === "owner") {
        res.status(403).json({
          success: false,
          error: { code: "FORBIDDEN", message: "Cannot remove the organization owner" },
        });
        return;
      }

      await prisma.membership.delete({ where: { id: membership.id } });

      res.json({ success: true, data: { id: memberId } });
    } catch (err) {
      next(err);
    }
  },
);

organizationsRouter.get("/settings", authorize("settings:read"), async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);

    let settings = await db.tenantSettings.findFirst({});

    if (!settings) {
      settings = await db.tenantSettings.create({
        data: {
          tenantId,
          defaults: {
            mfaRequired: false,
            sessionTimeoutMinutes: 720,
            passwordMinLength: 12,
            passwordRequireUppercase: true,
            passwordRequireLowercase: true,
            passwordRequireNumbers: true,
            passwordRequireSymbols: true,
          },
        } as Prisma.TenantSettingsUncheckedCreateInput,
      });
    }

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});

organizationsRouter.patch("/settings", authorize("settings:write"), async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = patchSettingsBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.tenantSettings.findFirst({});
    const settings = existing
      ? await db.tenantSettings.update({
          where: { id: existing.id },
          data: body as Prisma.TenantSettingsUpdateInput,
        })
      : await db.tenantSettings.create({
          data: { ...body, tenantId } as Prisma.TenantSettingsUncheckedCreateInput,
        });

    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
});
