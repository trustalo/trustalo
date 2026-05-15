import { afterEach, describe, expect, test } from "bun:test";
import type { Request, Response } from "express";
import { signToken } from "./jwt.js";
import {
  authenticate,
  requireAuth,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "./middleware.js";

const originalNodeEnv = process.env["NODE_ENV"];
const originalDomain = process.env["SESSION_COOKIE_DOMAIN"];

function restoreEnv(): void {
  if (originalNodeEnv === undefined) delete process.env["NODE_ENV"];
  else process.env["NODE_ENV"] = originalNodeEnv;

  if (originalDomain === undefined) delete process.env["SESSION_COOKIE_DOMAIN"];
  else process.env["SESSION_COOKIE_DOMAIN"] = originalDomain;
}

afterEach(() => {
  restoreEnv();
});

function createMockReqRes(options?: { cookies?: Record<string, string>; authorization?: string }): {
  req: Request & { auth?: unknown };
  res: Response;
  next: () => void;
  statusCode: () => number;
  body: () => unknown;
  nextCalled: () => boolean;
} {
  const req = {
    headers: {
      ...(options?.authorization ? { authorization: options.authorization } : {}),
    },
    cookies: options?.cookies ?? {},
  } as unknown as Request & { auth?: unknown };

  let statusCode = 200;
  let body: unknown;
  let nextCalled = false;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  } as unknown as Response;

  return {
    req,
    res,
    next: () => {
      nextCalled = true;
    },
    statusCode: () => statusCode,
    body: () => body,
    nextCalled: () => nextCalled,
  };
}

function makeToken(secret: string, expiresIn = "1h"): string {
  return signToken(
    {
      userId: "user-1",
      tenantId: "org-1",
      role: "admin",
      permissions: ["read", "write"],
    },
    { secret, expiresIn },
  );
}

describe("sessionCookieOptions", () => {
  test("returns secure=false in development and includes maxAge when provided", () => {
    process.env["NODE_ENV"] = "development";
    delete process.env["SESSION_COOKIE_DOMAIN"];
    const opts = sessionCookieOptions(60_000);
    expect(opts.httpOnly).toBe(true);
    expect(opts.secure).toBe(false);
    expect(opts.sameSite).toBe("lax");
    expect(opts.path).toBe("/");
    expect(opts.maxAge).toBe(60_000);
    expect(opts.domain).toBeUndefined();
  });

  test("returns secure=true in production and includes cookie domain", () => {
    process.env["NODE_ENV"] = "production";
    process.env["SESSION_COOKIE_DOMAIN"] = ".example.com";
    const opts = sessionCookieOptions();
    expect(opts.secure).toBe(true);
    expect(opts.domain).toBe(".example.com");
    expect(opts.maxAge).toBeUndefined();
  });
});

describe("authenticate", () => {
  test("rejects request with no cookie and no header", () => {
    const middleware = authenticate("secret");
    const ctx = createMockReqRes();
    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(false);
    expect(ctx.statusCode()).toBe(401);
    expect(ctx.body()).toEqual({
      success: false,
      error: {
        code: "MISSING_TOKEN",
        message: "Session cookie or Authorization header is required",
      },
    });
  });

  test("rejects malformed Authorization header", () => {
    const middleware = authenticate("secret");
    const ctx = createMockReqRes({ authorization: "Token abc" });
    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(false);
    expect(ctx.statusCode()).toBe(401);
    expect(ctx.body()).toEqual({
      success: false,
      error: {
        code: "MALFORMED_TOKEN",
        message: "Authorization header must use Bearer scheme",
      },
    });
  });

  test("accepts valid bearer token and attaches req.auth", () => {
    const secret = "very-long-secret-value-for-tests-123456789";
    const token = makeToken(secret);
    const middleware = authenticate(secret);
    const ctx = createMockReqRes({ authorization: `Bearer ${token}` });
    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(true);
    expect(ctx.statusCode()).toBe(200);
    expect(ctx.req.auth).toEqual({
      userId: "user-1",
      tenantId: "org-1",
      role: "admin",
      permissions: ["read", "write"],
    });
  });

  test("prefers session cookie over malformed Authorization header", () => {
    const secret = "very-long-secret-value-for-tests-123456789";
    const token = makeToken(secret);
    const middleware = authenticate(secret);
    const ctx = createMockReqRes({
      cookies: { [SESSION_COOKIE_NAME]: token },
      authorization: "Bearer-not-valid-format",
    });
    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(true);
    expect(ctx.statusCode()).toBe(200);
  });

  test("ignores cookie when allowCookie=false", () => {
    const secret = "very-long-secret-value-for-tests-123456789";
    const token = makeToken(secret);
    const middleware = authenticate(secret, { allowCookie: false });
    const ctx = createMockReqRes({
      cookies: { [SESSION_COOKIE_NAME]: token },
    });
    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(false);
    expect(ctx.statusCode()).toBe(401);
    expect(ctx.body()).toEqual({
      success: false,
      error: {
        code: "MISSING_TOKEN",
        message: "Session cookie or Authorization header is required",
      },
    });
  });

  test("returns INVALID_TOKEN for invalid signature", () => {
    const middleware = authenticate("secret-a");
    const token = makeToken("secret-b");
    const ctx = createMockReqRes({ authorization: `Bearer ${token}` });
    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(false);
    expect(ctx.statusCode()).toBe(401);
    expect(ctx.body()).toEqual({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Invalid token" },
    });
  });

  test("returns Token has expired for expired JWT", () => {
    const secret = "very-long-secret-value-for-tests-123456789";
    const expiredToken = makeToken(secret, "-10s");
    const middleware = authenticate(secret);
    const ctx = createMockReqRes({ authorization: `Bearer ${expiredToken}` });
    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(false);
    expect(ctx.statusCode()).toBe(401);
    expect(ctx.body()).toEqual({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Token has expired" },
    });
  });
});

describe("requireAuth", () => {
  test("rejects when req.auth is absent", () => {
    const guard = requireAuth();
    const ctx = createMockReqRes();
    guard(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(false);
    expect(ctx.statusCode()).toBe(401);
    expect(ctx.body()).toEqual({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Authentication is required" },
    });
  });

  test("passes when req.auth exists", () => {
    const guard = requireAuth();
    const ctx = createMockReqRes();
    ctx.req.auth = { userId: "u" };
    guard(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled()).toBe(true);
    expect(ctx.statusCode()).toBe(200);
  });
});
