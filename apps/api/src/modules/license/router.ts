/**
 * /api/v1/license — read-only license-status surface for the web client.
 *
 * Purpose: the SPA needs to know up-front whether the deployment holds a
 * valid Trustalo Enterprise License so it can pre-disable AI controls
 * (and other EE-only affordances) instead of waiting for the first
 * blocked call to return 402. Without this endpoint, the only way for
 * the client to learn the license state is to *try* a gated action and
 * observe the failure — a poor UX for monetisation messaging.
 *
 * The response is deliberately minimal. It exposes:
 *   - `enterprise`  whether a valid Enterprise / developer-tier license is loaded
 *   - `tier`        the license tier (or null when no license is loaded)
 *   - `features`    the entitled feature ids (so the client can render
 *                   per-feature affordances; AI is the only one we
 *                   currently use, but more will follow)
 *
 * What it does NOT expose: the raw token, subject (sub), license id
 * (lid), expiry timestamps, max_users, or any signing material — all
 * operator-only information that has no business on the client.
 *
 * The endpoint sits behind `authenticate` (mounted globally at
 * `/api/v1`), so unauthenticated callers cannot probe the license state
 * of a deployment.
 */

import { Router } from "express";
import { getLicenseClaims } from "@trustalo/license";

export const licenseRouter: Router = Router();

interface LicenseStatusResponse {
  enterprise: boolean;
  tier: "enterprise" | "developer" | null;
  features: string[];
}

licenseRouter.get("/status", async (_req, res, next) => {
  try {
    const claims = await getLicenseClaims();

    // No license loaded: the workspace is on the free tier. Return a
    // stable "disabled" shape rather than 404 so the client can treat
    // the response uniformly.
    if (!claims) {
      const body: LicenseStatusResponse = {
        enterprise: false,
        tier: null,
        features: [],
      };
      res.json({ success: true, data: body });
      return;
    }

    // A `developer` tier (issued for internal/dev use) implicitly
    // entitles AI features; we treat it as enterprise-equivalent for
    // gating purposes so dev builds don't false-positive the upgrade
    // banner. The actual `tier` is still returned so the UI could
    // distinguish if it ever wants to.
    const body: LicenseStatusResponse = {
      enterprise: claims.tier === "enterprise" || claims.tier === "developer",
      tier: claims.tier,
      features: claims.features,
    };
    res.json({ success: true, data: body });
  } catch (err) {
    next(err);
  }
});
