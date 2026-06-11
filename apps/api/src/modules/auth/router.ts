import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { AuthError, authService } from "./service.js";
import { authenticate } from "../../middleware/authenticate.js";
import { getJwtSecret, getOauthStateSecret } from "../../config/security.js";

export const authRouter: Router = Router();

const authAttemptBuckets = new Map<string, { count: number; resetAt: number }>();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX_ATTEMPTS = 20;

function authRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const key = `${req.path}::${String(ip)}`;
  const now = Date.now();
  const bucket = authAttemptBuckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    authAttemptBuckets.set(key, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    next();
    return;
  }

  if (bucket.count >= AUTH_MAX_ATTEMPTS) {
    res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000).toString());
    res.status(429).json({
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many authentication attempts. Try again later.",
      },
    });
    return;
  }

  bucket.count += 1;
  next();
}

// ──────────────────────────────────────────────────────────────────────────
// Schemas
// ──────────────────────────────────────────────────────────────────────────

const registerBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  organizationName: z.string().min(1),
});

const loginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const oauthStartQuery = z.object({
  redirectUri: z.string().url(),
});

const oauthCallbackQuery = z
  .object({
    state: z.string().min(1),
    redirectUri: z.string().url(),
  })
  .passthrough();

const logoutBody = z
  .object({
    postLogoutRedirectUri: z.string().url().optional(),
  })
  .optional();

const inviteBody = z.object({
  email: z.string().email(),
  role: z.enum(["owner", "admin", "compliance_manager", "auditor", "viewer", "integration_admin"]),
});

// ──────────────────────────────────────────────────────────────────────────
// OAuth state: stateless signed JWT carrying CSRF + PKCE verifier + nonce.
// 5-minute lifetime; the IdP roundtrips it via the `state` query parameter.
// ──────────────────────────────────────────────────────────────────────────

const OAUTH_STATE_SECRET = getOauthStateSecret(getJwtSecret());

function packState(callbackContext: Record<string, string>): string {
  return jwt.sign({ ctx: callbackContext }, OAUTH_STATE_SECRET, {
    expiresIn: "5m",
  });
}

function unpackState(state: string): Record<string, string> {
  const decoded = jwt.verify(state, OAUTH_STATE_SECRET) as { ctx?: Record<string, string> };
  return decoded.ctx ?? {};
}

// ──────────────────────────────────────────────────────────────────────────
// Public routes
// ──────────────────────────────────────────────────────────────────────────

/** Tells the web app what kind of login UI to render. */
authRouter.get("/config", async (_req, res, next) => {
  try {
    const descriptor = await authService.getProviderDescriptor();
    res.json({ success: true, data: descriptor });
  } catch (err) {
    next(err);
  }
});

/** Credential providers only. */
authRouter.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const body = loginBody.parse(req.body);
    const result = await authService.login(body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/** Credential providers with capabilities.register only. */
authRouter.post("/register", authRateLimit, async (req, res, next) => {
  try {
    const body = registerBody.parse(req.body);
    const result = await authService.register(body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/** Redirect providers: returns the upstream authorize URL. */
authRouter.get("/oauth/start", authRateLimit, async (req, res, next) => {
  try {
    const { redirectUri } = oauthStartQuery.parse(req.query);
    const result = await authService.startRedirectFlow({ redirectUri });
    // Bundle the provider's callbackContext into the signed state so we don't
    // need server-side storage between start and callback.
    const packedState = packState({
      ...result.callbackContext,
      __csrf: result.state,
    });
    res.json({
      success: true,
      data: {
        authorizationUrl: replaceStateInUrl(result.authorizationUrl, packedState),
        state: packedState,
      },
    });
  } catch (err) {
    next(err);
  }
});

/** Redirect providers: exchanges the auth code and mints Trustalo's JWT. */
authRouter.get("/oauth/callback", authRateLimit, async (req, res, next) => {
  try {
    const parsed = oauthCallbackQuery.parse(req.query);
    let callbackContext: Record<string, string>;
    try {
      callbackContext = unpackState(parsed.state);
    } catch {
      throw new AuthError(400, "INVALID_OAUTH_STATE", "OAuth state is invalid or expired");
    }

    // Strip our control fields out before passing to the provider.
    const { __csrf, ...providerContext } = callbackContext;
    void __csrf;

    // Pass through OAuth/OIDC callback parameters to the provider. The
    // key set is whitelisted so we never copy attacker-supplied keys
    // onto the params object (CodeQL `js/prototype-pollution-utility`
    // / remote-property-injection). Anything else from `req.query`
    // is silently dropped.
    const ALLOWED_CALLBACK_PARAMS = new Set([
      "code",
      "state",
      "error",
      "error_description",
      "error_uri",
      "session_state",
      "iss",
      "scope",
      "id_token",
      "access_token",
      "expires_in",
      "token_type",
    ]);
    const params: Record<string, string> = Object.create(null);
    for (const key of ALLOWED_CALLBACK_PARAMS) {
      const value = req.query[key];
      if (typeof value === "string") params[key] = value;
    }

    const result = await authService.completeRedirectFlow({
      params,
      callbackContext: providerContext,
      redirectUri: parsed.redirectUri,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Device-agent browser sign-in (PKCE device-authorization)
// ──────────────────────────────────────────────────────────────────────────

const deviceAuthorizeBody = z.object({
  state: z.string().min(1).max(256),
  codeChallenge: z.string().min(16).max(256),
  redirectUri: z.string().min(1).max(512),
});

/**
 * Authenticated consent step (called from the web /device/authorize page after
 * the user has logged in by whatever mechanism). Mints a single-use code the
 * browser deep-links back to the waiting agent.
 */
authRouter.post("/device/authorize", authenticate, async (req, res, next) => {
  try {
    const { state, codeChallenge, redirectUri } = deviceAuthorizeBody.parse(req.body);
    const { userId, tenantId } = (req as any).auth;
    const result = await authService.createDeviceAuthCode({
      userId,
      tenantId,
      codeChallenge,
      redirectUri,
    });
    res.status(201).json({ success: true, data: { ...result, state } });
  } catch (err) {
    next(err);
  }
});

const deviceTokenBody = z.object({
  code: z.string().min(1).max(512),
  codeVerifier: z.string().min(16).max(256),
});

/** Public exchange: device code + PKCE verifier → device JWT. */
authRouter.post("/device/token", authRateLimit, async (req, res, next) => {
  try {
    const { code, codeVerifier } = deviceTokenBody.parse(req.body);
    const result = await authService.exchangeDeviceAuthCode({ code, codeVerifier });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Authenticated routes
// ──────────────────────────────────────────────────────────────────────────

authRouter.get("/me", authenticate, async (req, res, next) => {
  try {
    const { userId, tenantId } = (req as any).auth;
    const result = await authService.getMe(userId, tenantId);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", authenticate, async (req, res, next) => {
  try {
    const body = logoutBody.parse(req.body) ?? {};
    const auth = (req as any).auth;
    const fallback = `${req.protocol}://${req.get("host")}/login`;
    const url = await authService.getLogoutUrl({
      payload: auth,
      postLogoutRedirectUri: body.postLogoutRedirectUri ?? fallback,
    });
    res.json({ success: true, data: { logoutUrl: url } });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/invite", authenticate, async (req, res, next) => {
  try {
    const body = inviteBody.parse(req.body);
    const { userId, tenantId } = (req as any).auth;
    const result = await authService.inviteUser(tenantId, userId, body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

/**
 * Re-write the `state` parameter in an authorize URL after we've packed the
 * provider's CSRF token + PKCE verifier into a signed JWT. The provider's
 * own state value goes inside the JWT as `__csrf`; the URL carries only the
 * signed JWT so the IdP roundtrips it for us.
 */
function replaceStateInUrl(url: string, packedState: string): string {
  const parsed = new URL(url);
  parsed.searchParams.set("state", packedState);
  return parsed.toString();
}
