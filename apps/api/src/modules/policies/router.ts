import { Router } from "express";
import { z } from "zod";
import { prisma, prismaWithTenant } from "../../db/prisma.js";
import multer from "multer";
import mammoth from "mammoth";
import { authorizeResource } from "../../middleware/authorize.js";
import { resolveOrgAI } from "../../config/ai.js";
import { audit } from "../../lib/audit.js";

export const policiesRouter: Router = Router();
policiesRouter.use(authorizeResource("policies:read", "policies:write"));

const policyStatus = z.enum(["draft", "pending_approval", "approved", "published", "archived"]);

const listPoliciesQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: policyStatus.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
});

const policyIdParams = z.object({ id: z.string().min(1) });

const frameworkTypeFilter = z.enum([
  "iso27001",
  "iso27017",
  "iso27018",
  "iso22301",
  "iso42001",
  "soc2",
  "essential8",
  "nist_csf_2",
  "gdpr",
  "cps234",
]);

const createPolicyBody = z.object({
  title: z.string().min(1),
  ownerId: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  renewalDate: z.coerce.date().optional(),
  /** When set, initial policy version is created from the system template */
  templateId: z.string().optional(),
});

const patchPolicyBody = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    status: policyStatus.optional(),
    category: z.string().nullable().optional(),
    ownerId: z.string().min(1).optional(),
    currentVersionId: z.string().nullable().optional(),
    renewalDate: z.union([z.coerce.date(), z.null()]).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, {
    message: "At least one field is required",
  });

const createVersionBody = z.object({
  content: z.string().min(1),
  changeNotes: z.string().optional(),
});

const requestChangesBody = z.object({
  notes: z.string().min(1),
});

const updateControlsBody = z.object({
  controlIds: z.array(z.string().min(1)),
});

// ─── Includes used across list/detail endpoints ───────────────

const policyListInclude = {
  owner: { select: { id: true, name: true, email: true } },
  _count: { select: { versions: true, acknowledgments: true, policyControls: true } },
} as const;

const policyDetailInclude = {
  owner: { select: { id: true, name: true, email: true } },
  versions: {
    orderBy: { versionNumber: "desc" as const },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
    },
  },
  policyControls: {
    include: {
      control: {
        select: { id: true, title: true, status: true, category: true },
      },
    },
  },
  _count: { select: { acknowledgments: true, versions: true, policyControls: true } },
} as const;

// ─── GET /categories ──────────────────────────────────────────

policiesRouter.get("/categories", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const db = prismaWithTenant(tenantId);
    const results = await db.policy.findMany({
      where: { category: { not: null } },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    });
    const categories = results.map((r) => r.category).filter((c): c is string => !!c);
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// ─── Policy template library (system-wide, not tenant rows) ─────
// Registered before /:id so "templates" is not captured as an id.

const listTemplatesQuery = z.object({
  framework: frameworkTypeFilter.optional(),
});

policiesRouter.get("/templates", async (req, res, next) => {
  try {
    const q = listTemplatesQuery.parse(req.query);
    const rows = await prisma.policyTemplate.findMany({
      where: {
        isActive: true,
        ...(q.framework
          ? {
              OR: [{ frameworkTypes: { isEmpty: true } }, { frameworkTypes: { has: q.framework } }],
            }
          : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        category: true,
        frameworkTypes: true,
        tags: true,
        sortOrder: true,
        updatedAt: true,
      },
    });
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

policiesRouter.get("/templates/:templateId", async (req, res, next) => {
  try {
    const { templateId } = z.object({ templateId: z.string().min(1) }).parse(req.params);
    const row = await prisma.policyTemplate.findFirst({
      where: { id: templateId, isActive: true },
    });
    if (!row) {
      res.status(404).json({ success: false, error: { message: "Template not found" } });
      return;
    }
    res.json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
});

// ─── GET / ────────────────────────────────────────────────────

policiesRouter.get("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const query = listPoliciesQuery.parse(req.query);
    const db = prismaWithTenant(tenantId);

    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      db.policy.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { updatedAt: "desc" },
        include: policyListInclude,
      }),
      db.policy.count({ where }),
    ]);

    res.json({
      success: true,
      data: { items, total, page: query.page, limit: query.limit },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /:id ─────────────────────────────────────────────────

policiesRouter.get("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      include: policyDetailInclude,
    });
    res.json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
});

// ─── POST / ───────────────────────────────────────────────────

policiesRouter.post("/", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const body = createPolicyBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    let initialHtml: string | null = null;
    if (body.templateId) {
      const tpl = await prisma.policyTemplate.findFirst({
        where: { id: body.templateId, isActive: true },
      });
      if (!tpl) {
        res
          .status(400)
          .json({ success: false, error: { message: "Invalid or inactive policy template" } });
        return;
      }
      initialHtml = tpl.contentHtml;
    }

    const policy = await db.policy.create({
      data: {
        tenantId,
        title: body.title,
        ownerId: body.ownerId,
        description: body.description,
        category: body.category,
        renewalDate: body.renewalDate,
      },
      include: policyDetailInclude,
    });

    if (initialHtml !== null) {
      const version = await db.policyVersion.create({
        data: {
          policyId: policy.id,
          versionNumber: 1,
          content: initialHtml,
          changeNotes: "Created from policy template",
          createdById: userId,
        },
        include: {
          createdBy: { select: { id: true, name: true, email: true } },
          approvedBy: { select: { id: true, name: true, email: true } },
        },
      });
      const updated = await db.policy.update({
        where: { id: policy.id },
        data: { currentVersionId: version.id },
        include: policyDetailInclude,
      });
      res.status(201).json({ success: true, data: updated });
      return;
    }

    res.status(201).json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /:id ───────────────────────────────────────────────

policiesRouter.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const body = patchPolicyBody.parse(req.body);
    const db = prismaWithTenant(tenantId);
    const policy = await db.policy.update({
      where: { id },
      data: body,
      include: policyDetailInclude,
    });
    res.json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────

policiesRouter.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);
    const policy = await db.policy.delete({ where: { id } });
    res.json({ success: true, data: policy });
  } catch (err) {
    next(err);
  }
});

// ─── Versions ─────────────────────────────────────────────────

policiesRouter.get("/:id/versions", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    await db.policy.findUniqueOrThrow({ where: { id } });

    const versions = await db.policyVersion.findMany({
      where: { policyId: id },
      orderBy: { versionNumber: "desc" },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { acknowledgments: true } },
      },
    });

    res.json({ success: true, data: versions });
  } catch (err) {
    next(err);
  }
});

policiesRouter.post("/:id/versions", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = policyIdParams.parse(req.params);
    const body = createVersionBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    await db.policy.findUniqueOrThrow({ where: { id } });

    const latestVersion = await db.policyVersion.findFirst({
      where: { policyId: id },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersion = (latestVersion?.versionNumber ?? 0) + 1;

    const version = await db.policyVersion.create({
      data: {
        policyId: id,
        versionNumber: nextVersion,
        content: body.content,
        changeNotes: body.changeNotes,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    await db.policy.update({
      where: { id },
      data: { currentVersionId: version.id },
    });

    res.status(201).json({ success: true, data: version });
  } catch (err) {
    next(err);
  }
});

// ─── Control Mappings ─────────────────────────────────────────

policiesRouter.get("/:id/controls", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    await db.policy.findUniqueOrThrow({ where: { id } });

    const mappings = await db.policyControl.findMany({
      where: { policyId: id },
      include: {
        control: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.json({ success: true, data: mappings });
  } catch (err) {
    next(err);
  }
});

policiesRouter.put("/:id/controls", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const { controlIds } = updateControlsBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    await db.policy.findUniqueOrThrow({ where: { id } });

    await db.policyControl.deleteMany({ where: { policyId: id } });

    if (controlIds.length > 0) {
      await db.policyControl.createMany({
        data: controlIds.map((controlId) => ({
          policyId: id,
          controlId,
          tenantId,
        })),
      });
    }

    const mappings = await db.policyControl.findMany({
      where: { policyId: id },
      include: {
        control: {
          select: {
            id: true,
            title: true,
            status: true,
            category: true,
            owner: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    res.json({ success: true, data: mappings });
  } catch (err) {
    next(err);
  }
});

// ─── Acknowledgments ──────────────────────────────────────────

policiesRouter.get("/:id/acknowledgments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    await db.policy.findUniqueOrThrow({ where: { id } });

    const acknowledgments = await db.policyAcknowledgment.findMany({
      where: { policyId: id },
      orderBy: { acknowledgedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        policyVersion: { select: { id: true, versionNumber: true } },
      },
    });

    res.json({ success: true, data: acknowledgments });
  } catch (err) {
    next(err);
  }
});

policiesRouter.post("/:id/acknowledge", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      select: { id: true, currentVersionId: true },
    });

    if (!policy.currentVersionId) {
      res.status(400).json({
        success: false,
        error: { message: "Policy has no published version to acknowledge" },
      });
      return;
    }

    const existing = await db.policyAcknowledgment.findFirst({
      where: {
        policyId: id,
        policyVersionId: policy.currentVersionId,
        userId,
      },
    });

    if (existing) {
      res.json({ success: true, data: existing });
      return;
    }

    const ack = await db.policyAcknowledgment.create({
      data: {
        policyId: id,
        policyVersionId: policy.currentVersionId,
        userId,
        tenantId,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        policyVersion: { select: { id: true, versionNumber: true } },
      },
    });

    res.status(201).json({ success: true, data: ack });
  } catch (err) {
    next(err);
  }
});

// ─── Approval Workflow ────────────────────────────────────────

policiesRouter.post("/:id/approve", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      select: { id: true, currentVersionId: true, status: true },
    });

    if (!policy.currentVersionId) {
      res.status(400).json({
        success: false,
        error: { message: "No version to approve — create a version first" },
      });
      return;
    }

    await db.policyVersion.update({
      where: { id: policy.currentVersionId },
      data: { approvedById: userId, approvedAt: new Date() },
    });

    const updated = await db.policy.update({
      where: { id },
      data: { status: "approved" },
      include: policyDetailInclude,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

policiesRouter.post("/:id/request-changes", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const body = requestChangesBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      select: { id: true, currentVersionId: true },
    });

    if (policy.currentVersionId) {
      await db.policyVersion.update({
        where: { id: policy.currentVersionId },
        data: { changeNotes: body.notes, approvedById: null, approvedAt: null },
      });
    }

    const updated = await db.policy.update({
      where: { id },
      data: { status: "draft" },
      include: policyDetailInclude,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

policiesRouter.post("/:id/publish", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      select: { id: true, currentVersionId: true, status: true },
    });

    if (policy.status !== "approved") {
      res.status(400).json({
        success: false,
        error: { message: "Policy must be approved before publishing" },
      });
      return;
    }

    const updated = await db.policy.update({
      where: { id },
      data: { status: "published" },
      include: policyDetailInclude,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── Save draft content (auto-save for editor) ───────────────
// Only allowed when policy status is "draft"

policiesRouter.put("/:id/content", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = policyIdParams.parse(req.params);
    const { content } = z.object({ content: z.string() }).parse(req.body);
    const db = prismaWithTenant(tenantId);

    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      select: { id: true, currentVersionId: true, status: true },
    });

    if (policy.status !== "draft") {
      res.status(403).json({
        success: false,
        error: {
          message:
            "Content can only be edited when the policy is in draft status. Use Duplicate to create a new draft.",
        },
      });
      return;
    }

    if (policy.currentVersionId) {
      await db.policyVersion.update({
        where: { id: policy.currentVersionId },
        data: { content },
      });
    } else {
      const version = await db.policyVersion.create({
        data: {
          policyId: id,
          versionNumber: 1,
          content,
          createdById: userId,
        },
      });
      await db.policy.update({
        where: { id },
        data: { currentVersionId: version.id },
      });
    }

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── Duplicate (create editable draft from current version) ──

policiesRouter.post("/:id/duplicate", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      select: { id: true, currentVersionId: true, status: true },
    });

    if (policy.status === "draft") {
      res.status(400).json({
        success: false,
        error: { message: "Policy is already in draft — edit it directly." },
      });
      return;
    }

    const sourceVersion = policy.currentVersionId
      ? await db.policyVersion.findUnique({ where: { id: policy.currentVersionId } })
      : null;

    const latestVersion = await db.policyVersion.findFirst({
      where: { policyId: id },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const nextVersion = (latestVersion?.versionNumber ?? 0) + 1;

    const draft = await db.policyVersion.create({
      data: {
        policyId: id,
        versionNumber: nextVersion,
        content: sourceVersion?.content ?? "",
        changeNotes: `Duplicated from Version ${sourceVersion ? (latestVersion?.versionNumber ?? 0) : 0}`,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    const updated = await db.policy.update({
      where: { id },
      data: { currentVersionId: draft.id, status: "draft" },
      include: policyDetailInclude,
    });

    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── Submit for Review (draft → pending_approval) ────────────

policiesRouter.post("/:id/submit-for-review", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      select: { id: true, status: true, currentVersionId: true },
    });

    if (policy.status !== "draft") {
      res.status(400).json({
        success: false,
        error: { message: "Only draft policies can be submitted for review." },
      });
      return;
    }

    if (!policy.currentVersionId) {
      res.status(400).json({
        success: false,
        error: { message: "Write some content before submitting for review." },
      });
      return;
    }

    const updated = await db.policy.update({
      where: { id },
      data: { status: "pending_approval" },
      include: policyDetailInclude,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

// ─── Comments ─────────────────────────────────────────────────

const commentInclude = {
  user: { select: { id: true, name: true, email: true } },
  resolvedBy: { select: { id: true, name: true, email: true } },
  replies: {
    orderBy: { createdAt: "asc" as const },
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} as const;

const createCommentBody = z.object({
  content: z.string().min(1),
  policyVersionId: z.string().optional(),
  highlightedText: z.string().optional(),
  fromPos: z.number().int().optional(),
  toPos: z.number().int().optional(),
  parentId: z.string().optional(),
});

policiesRouter.get("/:id/comments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const db = prismaWithTenant(tenantId);

    const comments = await db.policyComment.findMany({
      where: { policyId: id, parentId: null },
      orderBy: { createdAt: "desc" },
      include: commentInclude,
    });

    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
});

policiesRouter.post("/:id/comments", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id } = policyIdParams.parse(req.params);
    const body = createCommentBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    await db.policy.findUniqueOrThrow({ where: { id } });

    const comment = await db.policyComment.create({
      data: {
        policyId: id,
        policyVersionId: body.policyVersionId,
        userId,
        tenantId,
        content: body.content,
        highlightedText: body.highlightedText,
        fromPos: body.fromPos,
        toPos: body.toPos,
        parentId: body.parentId,
      },
      include: commentInclude,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
});

policiesRouter.post("/:id/comments/:commentId/resolve", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id, commentId } = z.object({ id: z.string(), commentId: z.string() }).parse(req.params);
    const db = prismaWithTenant(tenantId);

    const comment = await db.policyComment.update({
      where: { id: commentId, policyId: id },
      data: { resolved: true, resolvedById: userId, resolvedAt: new Date() },
      include: commentInclude,
    });

    res.json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
});

policiesRouter.patch("/:id/comments/:commentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id, commentId } = z.object({ id: z.string(), commentId: z.string() }).parse(req.params);
    const body = z.object({ content: z.string().min(1) }).parse(req.body);
    const db = prismaWithTenant(tenantId);

    const existing = await db.policyComment.findUniqueOrThrow({
      where: { id: commentId, policyId: id },
    });
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, error: "You can only edit your own comments" });
      return;
    }

    const updated = await db.policyComment.update({
      where: { id: commentId },
      data: { content: body.content },
      include: commentInclude,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

policiesRouter.delete("/:id/comments/:commentId", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const userId = (req as any).auth.userId as string;
    const { id, commentId } = z.object({ id: z.string(), commentId: z.string() }).parse(req.params);
    const db = prismaWithTenant(tenantId);

    const existing = await db.policyComment.findUniqueOrThrow({
      where: { id: commentId, policyId: id },
    });
    if (existing.userId !== userId) {
      res.status(403).json({ success: false, error: "You can only delete your own comments" });
      return;
    }

    await db.policyComment.deleteMany({ where: { parentId: commentId } });
    await db.policyComment.delete({ where: { id: commentId } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ─── AI Content Generation ────────────────────────────────────

const aiGenerateBody = z.object({
  prompt: z.string().min(1).max(2000),
  context: z.string().optional(),
  action: z.enum(["generate", "rewrite", "expand", "summarize", "improve"]).default("generate"),
});

policiesRouter.post("/:id/ai/generate", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const body = aiGenerateBody.parse(req.body);

    // Resolve via the operator → org → feature precedence rather than
    // reading OPENAI_API_KEY directly. This is the C2 constraint
    // applied retroactively: a Bedrock-only self-hosted deployment now
    // works with no env keys, and a SaaS tenant can pick its own model.
    const ai = await resolveOrgAI(tenantId, "policy_generation");

    const systemPrompts: Record<string, string> = {
      generate:
        "You are a security policy expert. Generate professional, compliant policy content based on the user's request. Output clean HTML suitable for a rich text editor (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags). Do not wrap in code blocks.",
      rewrite:
        "Rewrite the provided content to be clearer, more professional, and compliance-ready. Maintain the original meaning. Output clean HTML.",
      expand:
        "Expand the provided content with more detail, examples, and compliance language. Output clean HTML.",
      summarize:
        "Summarize the provided content concisely while keeping key policy requirements. Output clean HTML.",
      improve:
        "Improve the provided content for clarity, professionalism, and compliance standards. Fix grammar and formatting. Output clean HTML.",
    };

    const systemContent = systemPrompts[body.action] || systemPrompts.generate!;
    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemContent },
    ];
    if (body.context) {
      messages.push({ role: "user", content: `Current content:\n${body.context}` });
    }
    messages.push({ role: "user", content: body.prompt });

    const completion = await ai.client.chat({
      messages,
      maxTokens: 2000,
      temperature: 0.7,
    });

    await audit(req, "create", "PolicyAIDraft", req.params.id, {
      action: body.action,
      provider: ai.provider,
      model: ai.model,
      source: ai.source,
      promptLength: body.prompt.length,
      tokens: completion.usage?.totalTokens,
    });

    res.json({ success: true, data: { content: completion.content } });
  } catch (err) {
    next(err);
  }
});

// ─── AI Draft From Organisation Context ────────────────────────
//
// Phase 1 of the AI accelerators plan: turn `[[PLACEHOLDER]]` policy
// templates into a tailored first draft by feeding the org's saved
// `TenantContext` rows + the org's adopted frameworks into the
// LLM. The handler never auto-saves — the caller renders a diff
// against the current `PolicyVersion.content` and asks the user to
// accept before writing a new version.

const draftFromContextBody = z.object({
  /** Optional override; defaults to the policy's source template via slug. */
  templateSlug: z.string().min(1).max(200).optional(),
  /** Free-text user override appended to the system prompt. */
  instructions: z.string().max(4000).optional(),
});

interface DraftReplacement {
  placeholder: string;
  source: "context" | "template" | "policy" | "framework" | "default";
  value: string;
}

/** Pull `[[PLACEHOLDER]]` tokens out of a template HTML blob. */
function extractPlaceholders(html: string): string[] {
  const matches = html.matchAll(/\[\[([A-Z0-9_\-\s]+?)\]\]/g);
  const seen = new Set<string>();
  for (const m of matches) {
    const token = m[1]?.trim();
    if (token) seen.add(token);
  }
  return [...seen];
}

policiesRouter.post("/:id/ai/draft-from-context", async (req, res, next) => {
  try {
    const tenantId = (req as any).auth.tenantId as string;
    const { id } = policyIdParams.parse(req.params);
    const body = draftFromContextBody.parse(req.body);
    const db = prismaWithTenant(tenantId);

    // 1. Load the policy + current version + linked controls so we can
    //    enumerate the frameworks the policy is asked to satisfy.
    const policy = await db.policy.findUniqueOrThrow({
      where: { id },
      include: {
        policyControls: {
          include: {
            control: {
              select: {
                id: true,
                title: true,
                controlRequirementAssignments: {
                  select: {
                    requirement: {
                      select: { framework: { select: { frameworkType: true, name: true } } },
                    },
                  },
                },
              },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: "desc" as const },
          take: 1,
          select: { id: true, content: true, versionNumber: true },
        },
      },
    });

    // 2. Resolve the source template. If the caller provided a slug we
    //    use that; otherwise fall back to the most likely template by
    //    slugifying the policy title — the seed assigns slugs that match
    //    titles, so this is the right guess for "fill the placeholders
    //    in the template I started from".
    const slugCandidate =
      body.templateSlug ??
      policy.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    const template = await prisma.policyTemplate.findFirst({
      where: { slug: slugCandidate, isActive: true },
    });

    // No template? Fall back to the current policy content so this still
    // produces a usable rewrite. We log the source in the response so the
    // UI can warn the user.
    const sourceHtml = template?.contentHtml ?? policy.versions[0]?.content ?? "";
    const sourceLabel: "template" | "current_version" | "empty" = template
      ? "template"
      : policy.versions[0]
        ? "current_version"
        : "empty";

    if (!sourceHtml) {
      res.status(400).json({
        success: false,
        error: {
          message: "Policy has neither a matching template nor an existing version to draft from",
        },
      });
      return;
    }

    const placeholders = extractPlaceholders(sourceHtml);

    // 3. Pull the org context. We segment by category so the prompt can
    //    show the LLM only the relevant facts per section — the wizard
    //    UI captures ~18 Q&A pairs across 6 categories, well within
    //    Sonnet's context window even when fully loaded.
    const contextRows = await db.tenantContext.findMany({
      // Filter to `active` so generated policies don't reference
      // superseded facts (e.g. an old hosting region). Pre-existing
      // rows were backfilled as `active` by the ongoing_context_v1
      // migration.
      where: { status: "active" },
      orderBy: [{ category: "asc" }, { createdAt: "asc" }],
    });

    // 4. Frameworks the policy must comply with — derived from the
    //    requirements behind the linked controls. Surfaces unique
    //    framework labels for the prompt's "must satisfy" list.
    const frameworks = new Map<string, string>();
    for (const pc of policy.policyControls) {
      for (const rm of pc.control.controlRequirementAssignments) {
        frameworks.set(rm.requirement.framework.frameworkType, rm.requirement.framework.name);
      }
    }

    // 5. Resolve provider via the operator → org → feature chain.
    const ai = await resolveOrgAI(tenantId, "policy_generation");

    // 6. Build a strict prompt. The model is instructed to emit JSON so
    //    we get structured `replacements`/`unfilled` arrays back; the
    //    UI uses these to highlight which sections were AI-tailored vs
    //    left as visible placeholders for the user to complete.
    const contextForPrompt = contextRows.map((r) => ({
      category: r.category,
      question: r.question,
      answer: r.answer,
    }));

    const systemPrompt = [
      "You are a senior compliance writer drafting an organisation-specific policy.",
      "You will be given an HTML policy template containing [[PLACEHOLDER]] tokens.",
      "Replace every placeholder with content tailored to the organisation, drawn from the supplied context.",
      "Hard rules:",
      "1. Preserve all HTML structure (headings, lists, tables) verbatim — only replace placeholder text.",
      "2. If a placeholder cannot be filled from the supplied context, leave it visible as `[[PLACEHOLDER]]` so the user can fill it in.",
      "3. Do not invent facts. Prefer leaving a placeholder over fabricating a control statement.",
      "4. Match the tone and structure of the supplied context answers.",
      "5. Output ONLY a single JSON object — no markdown fences, no commentary.",
      'JSON shape: { "draftHtml": string, "replacements": [{ "placeholder": string, "source": "context"|"template"|"policy"|"framework"|"default", "value": string }], "unfilled": string[] }',
    ].join("\n");

    const userPrompt = [
      `# Source label\n${sourceLabel}`,
      `# Frameworks this policy must satisfy\n${[...frameworks.values()].join(", ") || "(none mapped — use generic best-practice language)"}`,
      `# Detected placeholders\n${placeholders.length ? placeholders.join(", ") : "(none — improve clarity instead)"}`,
      `# Organisation context\n${JSON.stringify(contextForPrompt, null, 2)}`,
      body.instructions ? `# Additional instructions from operator\n${body.instructions}` : "",
      `# Template HTML\n${sourceHtml}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const completion = await ai.client.chat({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      maxTokens: 4000,
      temperature: 0.4,
      responseFormat: "json",
    });

    // 7. Defensive parsing — some providers will still wrap JSON in
    //    code fences despite the instruction. Strip and try again.
    type DraftPayload = { draftHtml: string; replacements: DraftReplacement[]; unfilled: string[] };
    let payload: DraftPayload | null = null;
    const cleaned = completion.content
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();
    try {
      payload = JSON.parse(cleaned) as DraftPayload;
    } catch {
      // Fallback: treat the whole response as the draft and skip metadata.
      payload = { draftHtml: cleaned, replacements: [], unfilled: placeholders };
    }

    // 8. Bookkeep: bump `lastUsedAt` on every context row we shipped to
    //    the model. Lets the wizard surface "stale" rows the user
    //    hasn't reviewed in a while.
    if (contextRows.length) {
      await db.tenantContext.updateMany({
        where: { id: { in: contextRows.map((r) => r.id) } },
        data: { lastUsedAt: new Date() },
      });
    }

    await audit(req, "create", "PolicyAIDraft", id, {
      mode: "draft-from-context",
      provider: ai.provider,
      model: ai.model,
      source: ai.source,
      sourceLabel,
      templateSlug: template?.slug,
      placeholderCount: placeholders.length,
      replacementCount: payload.replacements.length,
      unfilledCount: payload.unfilled.length,
      contextRowsUsed: contextRows.length,
      tokens: completion.usage?.totalTokens,
    });

    res.json({
      success: true,
      data: {
        draftHtml: payload.draftHtml,
        replacements: payload.replacements,
        unfilled: payload.unfilled,
        sourceLabel,
        templateSlug: template?.slug ?? null,
        baseVersionId: policy.versions[0]?.id ?? null,
        provider: ai.provider,
        model: ai.model,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── File Import (DOCX / PDF) ─────────────────────────────
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

policiesRouter.post("/:id/import", upload.single("file"), async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, error: "No file uploaded" });
      return;
    }

    const ext = file.originalname.split(".").pop()?.toLowerCase();
    let html = "";

    if (ext === "docx" || ext === "doc") {
      const result = await mammoth.convertToHtml(
        { buffer: file.buffer },
        {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1:fresh",
            "r[style-name='Subtle Reference'] => ",
            "r[style-name='Intense Reference'] => ",
          ],
          ignoreEmptyParagraphs: true,
        },
      );
      html = result.value
        .replace(/\s*style="[^"]*"/gi, "")
        .replace(/\s*color="[^"]*"/gi, "")
        .replace(/<span>(.*?)<\/span>/gi, "$1")
        .replace(/<font[^>]*>(.*?)<\/font>/gi, "$1");
      if (result.messages.length > 0) {
        console.warn(
          "[docx-import] warnings:",
          result.messages.map((m) => m.message),
        );
      }
    } else if (ext === "pdf") {
      const { PDFParse } = await import("pdf-parse");
      const pdf = new PDFParse({ data: new Uint8Array(file.buffer) });
      const textResult = await pdf.getText();
      await pdf.destroy();
      const lines = textResult.text.split("\n");
      const paragraphs: string[] = [];
      let current = "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === "") {
          if (current.trim()) {
            paragraphs.push(current.trim());
            current = "";
          }
        } else {
          current += (current ? " " : "") + trimmed;
        }
      }
      if (current.trim()) paragraphs.push(current.trim());
      html = paragraphs
        .map((p) => `<p>${p.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
        .join("");
    } else {
      res
        .status(400)
        .json({ success: false, error: `Unsupported file type: .${ext}. Use .docx or .pdf` });
      return;
    }

    res.json({ success: true, data: { html, filename: file.originalname } });
  } catch (err) {
    next(err);
  }
});
