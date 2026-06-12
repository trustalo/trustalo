/**
 * People directory routes. Mounted at /api/v1/people AFTER the JWT
 * `authenticate` middleware.
 *
 * Two surfaces:
 *  - Admin directory (people:read / people:write): list, profile, create,
 *    invite, edit, role/status change, delete + Phase B/C sub-resources.
 *  - Self-portal (self:read / self:write): /people/me/* — the default
 *    `member` role's only People access. Every self route is scoped to the
 *    caller's own userId; a member can never read or mutate another person.
 *
 * The /me routes are registered BEFORE /:id so "me" is never parsed as an id.
 */
import { Router, type Request } from "express";
import { z } from "zod";
import { authorize } from "../../middleware/authorize.js";
import { authService } from "../auth/service.js";
import {
  ASSIGNABLE_PERSON_ROLES,
  PeopleError,
  acknowledgeMyPolicy,
  completeMyTraining,
  createPerson,
  deletePerson,
  getMyPerson,
  getPersonStats,
  listMyPolicies,
  listMyTraining,
  promoteVendorContact,
  updatePerson,
  updatePersonRole,
  updatePersonStatus,
} from "./service.js";
import {
  createBackgroundCheck,
  listBackgroundChecks,
  updateBackgroundCheck,
  backgroundCheckCreateSchema,
  backgroundCheckUpdateSchema,
} from "./background-checks.js";
import {
  completeChecklistItem,
  getPersonChecklist,
  onPersonStatusChanged,
  seedChecklist,
} from "./checklists.js";
import { getPersonProfile, listPeopleWithRollup } from "./rollup.js";

export const peopleRouter: Router = Router();

function authCtx(req: Request): { userId: string; tenantId: string } {
  return (req as Request & { auth: { userId: string; tenantId: string } }).auth;
}

function handle(
  res: import("express").Response,
  err: unknown,
  next: import("express").NextFunction,
) {
  if (err instanceof PeopleError) {
    res
      .status(err.status)
      .json({ success: false, error: { code: err.code, message: err.message } });
    return;
  }
  next(err);
}

const personRole = z.enum(ASSIGNABLE_PERSON_ROLES);
const personKind = z.enum(["employee", "contractor", "vendor_contact", "service_account", "other"]);
const personStatus = z.enum(["invited", "active", "suspended", "offboarded"]);
const idParam = z.object({ id: z.string().min(1) });
const dateish = z.coerce.date().nullable().optional();

// ── Self-portal: /people/me/* (member self-service) ─────────────────────

peopleRouter.get("/me", authorize("self:read"), async (req, res, next) => {
  try {
    const { userId, tenantId } = authCtx(req);
    res.json({ success: true, data: await getMyPerson(tenantId, userId) });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.get("/me/policies", authorize("self:read"), async (req, res, next) => {
  try {
    const { userId, tenantId } = authCtx(req);
    res.json({ success: true, data: { items: await listMyPolicies(tenantId, userId) } });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.post(
  "/me/policies/:id/acknowledge",
  authorize("self:write"),
  async (req, res, next) => {
    try {
      const { userId, tenantId } = authCtx(req);
      const { id } = idParam.parse(req.params);
      res.json({ success: true, data: await acknowledgeMyPolicy(tenantId, userId, id) });
    } catch (err) {
      handle(res, err, next);
    }
  },
);

peopleRouter.get("/me/training", authorize("self:read"), async (req, res, next) => {
  try {
    const { userId, tenantId } = authCtx(req);
    res.json({ success: true, data: { items: await listMyTraining(tenantId, userId) } });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.post("/me/training/:id/complete", authorize("self:write"), async (req, res, next) => {
  try {
    const { userId, tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    res.json({ success: true, data: await completeMyTraining(tenantId, userId, id) });
  } catch (err) {
    handle(res, err, next);
  }
});

// ── Admin directory ─────────────────────────────────────────────────────

const listQuery = z.object({
  status: personStatus.optional(),
  kind: personKind.optional(),
  role: personRole.optional(),
  department: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

peopleRouter.get("/", authorize("people:read"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const q = listQuery.parse(req.query);
    res.json({ success: true, data: await listPeopleWithRollup(tenantId, q) });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.get("/stats", authorize("people:read"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    res.json({ success: true, data: await getPersonStats(tenantId) });
  } catch (err) {
    handle(res, err, next);
  }
});

const createBody = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(200),
  kind: personKind.optional(),
  role: personRole.optional(),
  jobTitle: z.string().max(200).nullable().optional(),
  department: z.string().max(200).nullable().optional(),
  employmentType: z.string().max(100).nullable().optional(),
  managerId: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  startDate: dateish,
});

peopleRouter.post("/", authorize("people:write"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const body = createBody.parse(req.body);
    const person = await createPerson(tenantId, body);
    res.status(201).json({ success: true, data: person });
  } catch (err) {
    handle(res, err, next);
  }
});

const inviteBody = z.object({
  email: z.string().email(),
  role: personRole.default("member"),
});

// Invite a person with a login. Delegates to the auth service (which
// provisions the User via the active provider and creates the linked Person),
// so SSO/Cognito provisioning stays in exactly one place.
peopleRouter.post("/invite", authorize("people:write"), async (req, res, next) => {
  try {
    const { userId, tenantId } = authCtx(req);
    const body = inviteBody.parse(req.body);
    const result = await authService.inviteUser(tenantId, userId, {
      email: body.email,
      role: body.role,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    handle(res, err, next);
  }
});

// Promote a vendor contact into a vetted Person (Phase D).
peopleRouter.post(
  "/from-vendor-contact/:contactId",
  authorize("people:write"),
  async (req, res, next) => {
    try {
      const { tenantId } = authCtx(req);
      const contactId = String(req.params["contactId"]);
      const person = await promoteVendorContact(tenantId, contactId);
      res.status(201).json({ success: true, data: person });
    } catch (err) {
      handle(res, err, next);
    }
  },
);

peopleRouter.get("/:id", authorize("people:read"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    res.json({ success: true, data: await getPersonProfile(tenantId, id) });
  } catch (err) {
    handle(res, err, next);
  }
});

const updateBody = z.object({
  fullName: z.string().min(1).max(200).optional(),
  kind: personKind.optional(),
  jobTitle: z.string().max(200).nullable().optional(),
  department: z.string().max(200).nullable().optional(),
  employmentType: z.string().max(100).nullable().optional(),
  managerId: z.string().nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  startDate: dateish,
  endDate: dateish,
});

peopleRouter.patch("/:id", authorize("people:write"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    const body = updateBody.parse(req.body);
    res.json({ success: true, data: await updatePerson(tenantId, id, body) });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.patch("/:id/role", authorize("people:write"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    const { role } = z.object({ role: personRole }).parse(req.body);
    res.json({ success: true, data: await updatePersonRole(tenantId, id, role) });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.post("/:id/status", authorize("people:write"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    const { status } = z.object({ status: personStatus }).parse(req.body);
    const { person, previousStatus } = await updatePersonStatus(tenantId, id, status);
    // Checklist seeding + offboarding side-effects live outside the service to
    // avoid an import cycle (checklists.ts → service.ts for PeopleError).
    await onPersonStatusChanged(
      tenantId,
      { id: person.id, fullName: person.fullName },
      previousStatus,
      person.status,
    );
    res.json({ success: true, data: person });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.delete("/:id", authorize("people:write"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    res.json({ success: true, data: await deletePerson(tenantId, id) });
  } catch (err) {
    handle(res, err, next);
  }
});

// ── Background checks (Phase B) ──────────────────────────────────────────

peopleRouter.get("/:id/background-checks", authorize("people:read"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    res.json({ success: true, data: { items: await listBackgroundChecks(tenantId, id) } });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.post("/:id/background-checks", authorize("people:write"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    const body = backgroundCheckCreateSchema.parse(req.body);
    const check = await createBackgroundCheck(tenantId, id, body);
    res.status(201).json({ success: true, data: check });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.patch(
  "/:id/background-checks/:checkId",
  authorize("people:write"),
  async (req, res, next) => {
    try {
      const { tenantId } = authCtx(req);
      const { id } = idParam.parse(req.params);
      const checkId = String(req.params["checkId"]);
      const body = backgroundCheckUpdateSchema.parse(req.body);
      res.json({
        success: true,
        data: await updateBackgroundCheck(tenantId, id, checkId, body),
      });
    } catch (err) {
      handle(res, err, next);
    }
  },
);

// ── Onboarding / offboarding checklists (Phase B) ────────────────────────

peopleRouter.get("/:id/checklist", authorize("people:read"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    res.json({ success: true, data: { items: await getPersonChecklist(tenantId, id) } });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.post("/:id/checklist/seed", authorize("people:write"), async (req, res, next) => {
  try {
    const { tenantId } = authCtx(req);
    const { id } = idParam.parse(req.params);
    const { kind } = z.object({ kind: z.enum(["onboarding", "offboarding"]) }).parse(req.body);
    res.json({ success: true, data: { items: await seedChecklist(tenantId, id, kind) } });
  } catch (err) {
    handle(res, err, next);
  }
});

peopleRouter.post(
  "/:id/checklist/:itemId/complete",
  authorize("people:write"),
  async (req, res, next) => {
    try {
      const { tenantId } = authCtx(req);
      const { id } = idParam.parse(req.params);
      const itemId = String(req.params["itemId"]);
      const { status } = z
        .object({ status: z.enum(["done", "na", "pending"]).default("done") })
        .parse(req.body ?? {});
      res.json({ success: true, data: await completeChecklistItem(tenantId, id, itemId, status) });
    } catch (err) {
      handle(res, err, next);
    }
  },
);
