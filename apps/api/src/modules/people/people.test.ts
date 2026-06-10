/**
 * People module — pure-unit tests (no DB), matching the repo's bun:test
 * convention. Covers the RBAC contract for the new `member` role + `self:*`
 * scope, the per-person readiness rollup logic, the advisory-evidence framework
 * mapping, onboarding/offboarding templates, and the background-check schema.
 */
import { describe, expect, test } from "bun:test";
import { getPermissionsForRole, ROLE_PERMISSIONS } from "@trustalo/auth";
import { deriveReadiness } from "./rollup.js";
import { PEOPLE_EVIDENCE } from "./evidence.js";
import { ONBOARDING_TEMPLATE, OFFBOARDING_TEMPLATE } from "./checklists.js";
import { backgroundCheckCreateSchema } from "./background-checks.js";
import { ASSIGNABLE_PERSON_ROLES } from "./service.js";

describe("RBAC: member role + self scope (auth swap, A2)", () => {
  test("member gets exactly the self-service scope", () => {
    expect(getPermissionsForRole("member")).toEqual(["self:read", "self:write"]);
  });

  test("member cannot read or manage the people directory", () => {
    const perms = getPermissionsForRole("member");
    expect(perms).not.toContain("people:read");
    expect(perms).not.toContain("people:write");
  });

  test("owner holds the full People + self permission set", () => {
    const owner = ROLE_PERMISSIONS.owner!;
    for (const p of ["people:read", "people:write", "self:read", "self:write"]) {
      expect(owner).toContain(p);
    }
  });

  test("compliance_manager can manage People", () => {
    expect(ROLE_PERMISSIONS.compliance_manager).toContain("people:read");
    expect(ROLE_PERMISSIONS.compliance_manager).toContain("people:write");
  });

  test("read-only roles get self:read (via the :read suffix) but not self:write", () => {
    expect(ROLE_PERMISSIONS.viewer).toContain("self:read");
    expect(ROLE_PERMISSIONS.viewer).not.toContain("self:write");
    expect(ROLE_PERMISSIONS.auditor).toContain("self:read");
  });

  test("unknown role resolves to no permissions (login fallback is safe)", () => {
    expect(getPermissionsForRole("does_not_exist")).toEqual([]);
  });
});

describe("assignable roles", () => {
  test("owner is never assignable through the People UI", () => {
    expect(ASSIGNABLE_PERSON_ROLES).not.toContain("owner");
  });
  test("member is the default-assignable role", () => {
    expect(ASSIGNABLE_PERSON_ROLES).toContain("member");
  });
});

describe("deriveReadiness (per-person rollup)", () => {
  const clean = {
    devicesAtRisk: 0,
    trainingPct: 100,
    policyPct: 100,
    backgroundCheckStatus: "cleared" as string | null,
  };

  test("non-active statuses pass through verbatim", () => {
    expect(deriveReadiness("invited", clean)).toBe("invited");
    expect(deriveReadiness("suspended", clean)).toBe("suspended");
    expect(deriveReadiness("offboarded", clean)).toBe("offboarded");
  });

  test("active + everything green → ready", () => {
    expect(deriveReadiness("active", clean)).toBe("ready");
  });

  test("active + no background check (null) is still ready", () => {
    expect(deriveReadiness("active", { ...clean, backgroundCheckStatus: null })).toBe("ready");
  });

  test("a device at risk flips to at_risk", () => {
    expect(deriveReadiness("active", { ...clean, devicesAtRisk: 1 })).toBe("at_risk");
  });

  test("incomplete training or policies flips to at_risk", () => {
    expect(deriveReadiness("active", { ...clean, trainingPct: 80 })).toBe("at_risk");
    expect(deriveReadiness("active", { ...clean, policyPct: 50 })).toBe("at_risk");
  });

  test("a flagged or expired background check flips to at_risk", () => {
    expect(deriveReadiness("active", { ...clean, backgroundCheckStatus: "flagged" })).toBe(
      "at_risk",
    );
    expect(deriveReadiness("active", { ...clean, backgroundCheckStatus: "expired" })).toBe(
      "at_risk",
    );
  });
});

describe("advisory evidence framework mapping", () => {
  test("background check cleared → ISO 27001 A.6.1 (screening)", () => {
    expect(PEOPLE_EVIDENCE.background_check_cleared.refs).toContainEqual({
      framework: "iso27001",
      requirement: "A.6.1",
    });
  });

  test("training completed → ISO A.6.3 + SOC 2 CC1.4 (awareness)", () => {
    const refs = PEOPLE_EVIDENCE.training_completed.refs;
    expect(refs).toContainEqual({ framework: "iso27001", requirement: "A.6.3" });
    expect(refs).toContainEqual({ framework: "soc2", requirement: "CC1.4" });
  });

  test("offboarding completed → ISO A.6.5 (termination)", () => {
    expect(PEOPLE_EVIDENCE.offboarding_completed.refs).toContainEqual({
      framework: "iso27001",
      requirement: "A.6.5",
    });
  });

  test("every mapped event is advisory (info severity, never a verdict)", () => {
    for (const def of Object.values(PEOPLE_EVIDENCE)) {
      expect(def.severity).toBe("info");
    }
  });
});

describe("onboarding / offboarding checklist templates", () => {
  test("onboarding covers screening, policies, training and access provisioning", () => {
    const keys = ONBOARDING_TEMPLATE.map((i) => i.key);
    expect(keys).toContain("background_check");
    expect(keys).toContain("sign_policies");
    expect(keys).toContain("security_training");
    expect(keys).toContain("provision_accounts");
  });

  test("offboarding covers access revocation, device collection and login disable", () => {
    const keys = OFFBOARDING_TEMPLATE.map((i) => i.key);
    expect(keys).toContain("revoke_access");
    expect(keys).toContain("collect_device");
    expect(keys).toContain("disable_login");
  });

  test("template keys are unique within each set (seeding is idempotent)", () => {
    for (const tmpl of [ONBOARDING_TEMPLATE, OFFBOARDING_TEMPLATE]) {
      const keys = tmpl.map((i) => i.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("backgroundCheckCreateSchema", () => {
  test("defaults to an identity check that hasn't started", () => {
    const parsed = backgroundCheckCreateSchema.parse({});
    expect(parsed.type).toBe("identity");
    expect(parsed.status).toBe("not_started");
  });

  test("coerces ISO date strings to Date", () => {
    const parsed = backgroundCheckCreateSchema.parse({
      status: "cleared",
      completedAt: "2026-01-15T00:00:00.000Z",
    });
    expect(parsed.completedAt).toBeInstanceOf(Date);
    expect(parsed.status).toBe("cleared");
  });

  test("rejects an unknown status", () => {
    expect(() => backgroundCheckCreateSchema.parse({ status: "bogus" })).toThrow();
  });
});
