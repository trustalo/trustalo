// Provider-agnostic auth service.
//
// Every authentication flow (credential login, OAuth callback, register,
// invite) ends in `completeLogin(profile)`, which:
//   1. Finds-or-creates the User row keyed by (authProvider, externalId)
//      with verified-email fallback to email-based linking.
//   2. Ensures the user has an active Person in some Tenant, auto-creating
//      the bootstrap tenant for the very first user.
//   3. Mints Trustalo's JWT and returns the standard auth payload.
//
// Provider plugins never write to the User table — that contract is what
// keeps third-party plugins safe and the trust boundary clean.

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "../../db/prisma.js";
import {
  signToken,
  getPermissionsForRole,
  type AuthProvider,
  type ProviderProfile,
} from "@trustalo/auth";
import type { JwtConfig } from "@trustalo/auth";
import { extractLocalCredential } from "@trustalo/auth-provider-local";
import type { PersonRole } from "../../../generated/prisma/client/index.js";
import { getActiveAuthProvider } from "./provider-bootstrap.js";
import { getJwtSecret } from "../../config/security.js";

const jwtConfig: JwtConfig = {
  secret: getJwtSecret(),
  expiresIn: process.env.JWT_EXPIRES_IN || "24h",
};

interface AuthSuccess {
  token: string;
  user: { id: string; email: string; name: string };
  organization: { id: string; name: string; slug: string };
}

export class AuthError extends Error {
  readonly status: number;
  readonly code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "AuthError";
    this.status = status;
    this.code = code;
  }
}

export class AuthService {
  /** Returns the public-safe descriptor of the active provider. */
  async getProviderDescriptor() {
    const provider = await getActiveAuthProvider();
    return {
      providerId: provider.id,
      displayName: provider.displayName,
      kind: provider.kind,
      capabilities: provider.capabilities,
    };
  }

  /** Credential login (kind="credential" providers only). */
  async login(input: { email: string; password: string }): Promise<AuthSuccess> {
    const provider = await getActiveAuthProvider();
    if (provider.kind !== "credential" || !provider.authenticate) {
      throw new AuthError(
        400,
        "PROVIDER_DOES_NOT_SUPPORT_PASSWORD",
        `The active auth provider "${provider.id}" does not accept email/password logins. ` +
          "Use the OAuth flow instead.",
      );
    }

    let profile: ProviderProfile;
    try {
      profile = await provider.authenticate(input);
    } catch (err) {
      throw mapProviderError(err);
    }

    return this.completeLogin(provider, profile, { mode: "login" });
  }

  /**
   * Credential register flow. Bootstrap-only: this is what a brand-new
   * deployment hits to create its first owner + organization. For all
   * subsequent users, the invite flow should be used instead.
   */
  async register(input: {
    email: string;
    password: string;
    name: string;
    organizationName: string;
  }): Promise<AuthSuccess> {
    const provider = await getActiveAuthProvider();
    if (provider.kind !== "credential" || !provider.register) {
      throw new AuthError(
        400,
        "PROVIDER_DOES_NOT_SUPPORT_REGISTRATION",
        `The active auth provider "${provider.id}" does not support self-registration.`,
      );
    }

    let profile: ProviderProfile;
    try {
      profile = await provider.register(input);
    } catch (err) {
      throw mapProviderError(err);
    }

    return this.completeLogin(provider, profile, {
      mode: "register",
      organizationName: input.organizationName,
    });
  }

  /**
   * Builds the upstream authorize URL for redirect-based providers. The
   * caller is responsible for storing `state` + `callbackContext` server-side
   * (e.g. signed cookie) so they can be re-presented at callback time.
   */
  async startRedirectFlow(args: { redirectUri: string }): Promise<{
    authorizationUrl: string;
    state: string;
    callbackContext: Record<string, string>;
  }> {
    const provider = await getActiveAuthProvider();
    if (provider.kind !== "redirect" || !provider.startRedirect) {
      throw new AuthError(
        400,
        "PROVIDER_NOT_REDIRECT_TYPE",
        `The active auth provider "${provider.id}" does not use a redirect flow.`,
      );
    }

    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    const result = await provider.startRedirect({
      state,
      nonce,
      redirectUri: args.redirectUri,
    });

    return {
      authorizationUrl: result.authorizationUrl,
      state: result.state,
      callbackContext: result.callbackContext ?? {},
    };
  }

  /** Completes a redirect callback by exchanging the code and minting a JWT. */
  async completeRedirectFlow(args: {
    params: Record<string, string>;
    callbackContext?: Record<string, string>;
    redirectUri: string;
  }): Promise<AuthSuccess> {
    const provider = await getActiveAuthProvider();
    if (provider.kind !== "redirect" || !provider.handleRedirectCallback) {
      throw new AuthError(
        400,
        "PROVIDER_NOT_REDIRECT_TYPE",
        `The active auth provider "${provider.id}" does not use a redirect flow.`,
      );
    }

    let profile: ProviderProfile;
    try {
      profile = await provider.handleRedirectCallback(args);
    } catch (err) {
      throw mapProviderError(err);
    }

    return this.completeLogin(provider, profile, { mode: "login" });
  }

  /**
   * Returns a logout URL when the active provider supports one (e.g.
   * Cognito's hosted-UI /logout endpoint). Callers should still clear their
   * own session cookies / localStorage regardless.
   */
  async getLogoutUrl(args: {
    payload: { userId: string; tenantId: string; role: string; permissions: string[] };
    postLogoutRedirectUri: string;
  }): Promise<string | null> {
    const provider = await getActiveAuthProvider();
    if (!provider.buildLogoutUrl) return null;
    return provider.buildLogoutUrl({
      payload: args.payload,
      postLogoutRedirectUri: args.postLogoutRedirectUri,
    });
  }

  async getMe(userId: string, tenantId: string) {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    // People replaces Membership: resolve the caller's Person for this tenant.
    // Returned as `membership` to preserve the /auth/me response contract.
    const person = await prisma.person.findFirstOrThrow({
      where: { userId, tenantId },
      include: { tenant: true },
    });

    return { user, membership: person };
  }

  /**
   * Invites a user. When the active provider supports `adminCreateUser`
   * (e.g. Cognito), provisions the user in the upstream IdP first.
   */
  async inviteUser(
    tenantId: string,
    inviterUserId: string,
    input: { email: string; role: PersonRole },
  ) {
    void inviterUserId; // reserved for audit logs
    const provider = await getActiveAuthProvider();
    const email = input.email.toLowerCase();

    let externalId: string | null = null;
    let inviteEmailSent = false;

    if (provider.adminCreateUser) {
      try {
        const result = await provider.adminCreateUser({
          email,
          role: input.role,
        });
        externalId = result.externalId;
        inviteEmailSent = result.inviteEmailSent;
      } catch (err) {
        throw mapProviderError(err);
      }
    } else {
      // Local-only invitation: pre-create the User row with no password set.
      // The user will be onboarded once they pick a password (handled by a
      // future "accept invitation" flow).
      externalId = email;
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: email.split("@")[0] ?? email,
          authProvider: provider.id,
          externalId,
        },
      });
    }

    // Upsert the Person (replaces Membership). findFirst+create rather than an
    // upsert-by-compound-unique because (tenantId, userId) has a nullable
    // userId. `membershipId` in the return keeps the invite response contract.
    let person = await prisma.person.findFirst({ where: { tenantId, userId: user.id } });
    if (!person) {
      person = await prisma.person.create({
        data: {
          tenantId,
          userId: user.id,
          email,
          fullName: user.name,
          role: input.role,
          status: "invited",
          source: "invite",
          invitedAt: new Date(),
        },
      });
    }

    return {
      userId: user.id,
      membershipId: person.id,
      personId: person.id,
      status: "invited",
      inviteEmailSent,
      provider: provider.id,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Device-agent browser sign-in (PKCE device-authorization).
  //
  // A shipped agent signs in against ANY provider by letting the browser own
  // the login (password or SSO) and then deep-linking a short-lived code back.
  // The agent exchanges that code (with its PKCE verifier) for a device JWT,
  // which it uses once to enroll. No agent-side login form, no shared secret.
  // ────────────────────────────────────────────────────────────────────────

  /**
   * Mint a Trustalo JWT for an existing user in a tenant, with the exact same
   * Person-derived claims as a fresh login. Used by the device-code exchange
   * (and reusable by any "issue a session for this already-authenticated user"
   * path).
   */
  async issueTokenForUser(userId: string, tenantId: string): Promise<AuthSuccess> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    const person = await prisma.person.findFirstOrThrow({
      where: { userId, tenantId, status: { in: ["active", "invited"] } },
      include: { tenant: true },
    });
    const permissions =
      person.permissions.length > 0 ? person.permissions : getPermissionsForRole(person.role);
    const token = signToken(
      { userId: user.id, tenantId: person.tenantId, role: person.role, permissions },
      jwtConfig,
    );
    return {
      token,
      user: { id: user.id, email: user.email, name: user.name },
      organization: { id: person.tenant.id, name: person.tenant.name, slug: person.tenant.slug },
    };
  }

  /**
   * Create a short-lived, single-use device-authorization code bound to the
   * authenticated browser user + a PKCE challenge + the agent's deep-link
   * redirect. Called from the web /device/authorize consent step.
   */
  async createDeviceAuthCode(input: {
    userId: string;
    tenantId: string;
    codeChallenge: string;
    redirectUri: string;
  }): Promise<{ code: string; redirectUri: string; expiresAt: Date }> {
    assertAllowedDeviceRedirect(input.redirectUri);
    if (!input.codeChallenge || input.codeChallenge.length < 16) {
      throw new AuthError(400, "INVALID_PKCE", "A PKCE code_challenge is required");
    }
    const code = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + DEVICE_CODE_TTL_MS);
    await prisma.deviceAuthCode.create({
      data: {
        code,
        userId: input.userId,
        tenantId: input.tenantId,
        codeChallenge: input.codeChallenge,
        redirectUri: input.redirectUri,
        expiresAt,
      },
    });
    return { code, redirectUri: input.redirectUri, expiresAt };
  }

  /**
   * Exchange a device code + PKCE verifier for a device JWT. Single-use,
   * TTL-bound, and PKCE-verified so an intercepted code is worthless without
   * the verifier the agent kept locally.
   */
  async exchangeDeviceAuthCode(input: {
    code: string;
    codeVerifier: string;
  }): Promise<AuthSuccess> {
    if (!input.codeVerifier || input.codeVerifier.length < 16) {
      throw new AuthError(400, "INVALID_PKCE", "A PKCE code_verifier is required");
    }
    const row = await prisma.deviceAuthCode.findUnique({ where: { code: input.code } });
    if (!row) throw new AuthError(400, "INVALID_DEVICE_CODE", "Device code is invalid");
    if (row.consumedAt)
      throw new AuthError(400, "DEVICE_CODE_USED", "Device code has already been used");
    if (row.expiresAt.getTime() < Date.now()) {
      throw new AuthError(400, "DEVICE_CODE_EXPIRED", "Device code has expired");
    }

    const computed = createHash("sha256").update(input.codeVerifier).digest("base64url");
    if (!constantTimeEqual(computed, row.codeChallenge)) {
      throw new AuthError(400, "PKCE_MISMATCH", "PKCE verification failed");
    }

    // Single-use: atomically claim the code (guards a double-exchange race).
    const claimed = await prisma.deviceAuthCode.updateMany({
      where: { id: row.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    if (claimed.count !== 1) {
      throw new AuthError(400, "DEVICE_CODE_USED", "Device code has already been used");
    }

    return this.issueTokenForUser(row.userId, row.tenantId);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Internal: convert a verified ProviderProfile into a session.
  // ────────────────────────────────────────────────────────────────────────

  private async completeLogin(
    provider: AuthProvider,
    profile: ProviderProfile,
    flow: { mode: "login" } | { mode: "register"; organizationName: string },
  ): Promise<AuthSuccess> {
    const email = profile.email.toLowerCase();
    const externalId = profile.externalId;

    // Pull local credential material if this came from the local provider's
    // register flow. The hash is opaque to everything except the local
    // provider; the API just persists it on the new User row.
    const localCredential = extractLocalCredential(profile);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find by (authProvider, externalId) — the canonical key.
      let user = await tx.user.findUnique({
        where: {
          authProvider_externalId: {
            authProvider: provider.id,
            externalId,
          },
        },
      });

      // 2. Auto-link by verified email if no provider record yet but a user
      //    with this email exists. This is the path for invited users (the
      //    User row was pre-created with a different externalId or none).
      if (!user && profile.emailVerified) {
        const byEmail = await tx.user.findUnique({ where: { email } });
        if (byEmail) {
          user = await tx.user.update({
            where: { id: byEmail.id },
            data: { authProvider: provider.id, externalId },
          });
        }
      }

      // 3. Create the user if still none.
      if (!user) {
        if (flow.mode !== "register" && !canAutoProvision(provider)) {
          throw new AuthError(
            403,
            "USER_NOT_PROVISIONED",
            "Your account has not been provisioned in Trustalo. Ask an administrator to invite you.",
          );
        }
        user = await tx.user.create({
          data: {
            email,
            name: profile.name ?? email.split("@")[0] ?? email,
            authProvider: provider.id,
            externalId,
            passwordHash: localCredential?.passwordHash ?? null,
            emailVerified: profile.emailVerified ?? false,
          },
        });
      } else if (localCredential) {
        // Refresh password hash on re-register (rare, but safe).
        user = await tx.user.update({
          where: { id: user.id },
          data: { passwordHash: localCredential.passwordHash },
        });
      }

      // 4. Ensure a membership exists. For the bootstrap register flow, also
      //    create the Organization. For invited users, the membership is
      //    expected to already exist (in "invited" status) — promote it to
      //    "active" on first login.
      // People replaces Membership. Cross-tenant lookup by userId on the base
      // `tx` client (Person is an INTENTIONAL_EXCEPTION — not auto-tenant-scoped
      // — so login can find the user's Person in whichever tenant they belong to).
      let person = await tx.person.findFirst({
        where: { userId: user.id, status: { in: ["active", "invited"] } },
        include: { tenant: true },
      });

      if (!person) {
        if (flow.mode !== "register") {
          throw new AuthError(
            403,
            "NO_MEMBERSHIP",
            "Your account is not a member of any organization. Contact an administrator.",
          );
        }
        const slug = slugify(flow.organizationName);
        const organization = await tx.tenant.create({
          data: { name: flow.organizationName, slug },
        });
        person = await tx.person.create({
          data: {
            userId: user.id,
            tenantId: organization.id,
            email: user.email,
            fullName: user.name,
            role: "owner",
            status: "active",
            source: "self_register",
            joinedAt: new Date(),
          },
          include: { tenant: true },
        });
      } else if (person.status === "invited") {
        person = await tx.person.update({
          where: { id: person.id },
          data: { status: "active", joinedAt: new Date() },
          include: { tenant: true },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      return { user, person };
    });

    const permissions =
      result.person.permissions.length > 0
        ? result.person.permissions
        : getPermissionsForRole(result.person.role);

    const token = signToken(
      {
        userId: result.user.id,
        tenantId: result.person.tenantId,
        role: result.person.role,
        permissions,
      },
      jwtConfig,
    );

    return {
      token,
      user: { id: result.user.id, email: result.user.email, name: result.user.name },
      organization: {
        id: result.person.tenant.id,
        name: result.person.tenant.name,
        slug: result.person.tenant.slug,
      },
    };
  }
}

export const authService = new AuthService();

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || `org-${Date.now()}`
  );
}

/**
 * For redirect providers, we treat first-login-after-Cognito-signup as
 * automatic provisioning. For credential providers, the user must come
 * through `register` or be invited.
 */
function canAutoProvision(provider: AuthProvider): boolean {
  return provider.kind === "redirect";
}

function mapProviderError(err: unknown): AuthError {
  if (err instanceof AuthError) return err;
  // Local provider's typed errors: { status, code, message }
  if (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    "code" in err &&
    typeof (err as { message?: string }).message === "string"
  ) {
    const e = err as { status: number; code: string; message: string };
    return new AuthError(e.status, e.code, e.message);
  }
  const message = err instanceof Error ? err.message : "Authentication failed";
  return new AuthError(401, "AUTHENTICATION_FAILED", message);
}

// Device-authorization code TTL — short on purpose; the agent exchanges it
// within seconds of the browser deep-link.
const DEVICE_CODE_TTL_MS = 3 * 60 * 1000;

/**
 * A device redirect must be the custom `trustalo://` scheme (the shipped agent's
 * deep link) or a loopback http URL (the dev/testing fallback). This blocks an
 * open-redirect: a code can only ever be handed to the local agent.
 */
function assertAllowedDeviceRedirect(uri: string): void {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    throw new AuthError(400, "INVALID_REDIRECT", "redirect_uri is not a valid URL");
  }
  const isScheme = u.protocol === "trustalo:";
  const isLoopback =
    u.protocol === "http:" && (u.hostname === "127.0.0.1" || u.hostname === "localhost");
  if (!isScheme && !isLoopback) {
    throw new AuthError(
      400,
      "INVALID_REDIRECT",
      "redirect_uri must be a trustalo:// deep link or a loopback URL",
    );
  }
}

function constantTimeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}
