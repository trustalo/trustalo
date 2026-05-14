import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { createHash, createHmac } from "node:crypto";
import type { Request, Response } from "express";
import { requireServiceAuth, signServiceRequest, toHeaderRecord } from "./service-auth.js";

const originalServiceSecret = process.env["SERVICE_AUTH_SECRET"];
const originalInternalKey = process.env["API_INTERNAL_KEY"];
const BASE_SECRET = "test-service-secret-abcdefghijklmnopqrstuvwxyz";

function restoreEnv(): void {
  if (originalServiceSecret === undefined) delete process.env["SERVICE_AUTH_SECRET"];
  else process.env["SERVICE_AUTH_SECRET"] = originalServiceSecret;

  if (originalInternalKey === undefined) delete process.env["API_INTERNAL_KEY"];
  else process.env["API_INTERNAL_KEY"] = originalInternalKey;
}

afterEach(() => {
  restoreEnv();
});

function hashBody(body: Buffer | string | null | undefined): string {
  const buffer =
    body === null || body === undefined
      ? Buffer.alloc(0)
      : Buffer.isBuffer(body)
        ? body
        : Buffer.from(body, "utf8");
  return createHash("sha256").update(buffer).digest("hex");
}

function signCanonical(
  secret: string,
  method: string,
  path: string,
  timestamp: string,
  nonce: string,
  body: Buffer | string | null | undefined,
): string {
  const canonical = [method.toUpperCase(), path, timestamp, nonce, hashBody(body)].join("\n");
  return createHmac("sha256", secret).update(canonical).digest("base64");
}

function createReqRes(params: {
  method?: string;
  originalUrl?: string;
  headers?: Record<string, string | string[] | undefined>;
  rawBody?: Buffer;
}) {
  const req = {
    method: params.method ?? "GET",
    originalUrl: params.originalUrl ?? "/internal/ping",
    headers: params.headers ?? {},
    rawBody: params.rawBody,
  } as Request & { rawBody?: Buffer; service?: { caller: string } };

  let statusCode = 200;
  let jsonBody: unknown;
  const headers: Record<string, string> = {};

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return this;
    },
    setHeader(name: string, value: string) {
      headers[name] = value;
      return this;
    },
  } as unknown as Response;

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  return {
    req,
    res,
    next,
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
    get nextCalled() {
      return nextCalled;
    },
    get responseHeaders() {
      return headers;
    },
  };
}

describe("signServiceRequest", () => {
  test("throws when no secret is available", () => {
    delete process.env["SERVICE_AUTH_SECRET"];
    delete process.env["API_INTERNAL_KEY"];
    expect(() =>
      signServiceRequest({
        caller: "collector",
        method: "GET",
        path: "/internal/vendors/due-for-research",
      }),
    ).toThrow("[service-auth] SERVICE_AUTH_SECRET / API_INTERNAL_KEY is required to sign requests");
  });

  test("uses explicit secret and emits all headers", () => {
    const sig = signServiceRequest({
      caller: "api",
      method: "POST",
      path: "/internal/test?x=1",
      body: '{"ok":true}',
      secret: BASE_SECRET,
    });
    expect(sig.caller).toBe("api");
    expect(sig.timestamp).toBeString();
    expect(sig.nonce).toHaveLength(16);
    expect(sig.signature.length).toBeGreaterThan(20);

    const headers = toHeaderRecord(sig);
    expect(headers["x-service-caller"]).toBe("api");
    expect(headers["x-service-timestamp"]).toBe(sig.timestamp);
    expect(headers["x-service-nonce"]).toBe(sig.nonce);
    expect(headers["x-service-signature"]).toBe(sig.signature);
  });

  test("falls back to API_INTERNAL_KEY when SERVICE_AUTH_SECRET is unset", () => {
    delete process.env["SERVICE_AUTH_SECRET"];
    process.env["API_INTERNAL_KEY"] = BASE_SECRET;
    const sig = signServiceRequest({
      caller: "collector",
      method: "GET",
      path: "/internal/ping",
    });
    expect(sig.caller).toBe("collector");
    expect(sig.signature.length).toBeGreaterThan(20);
  });
});

describe("requireServiceAuth", () => {
  test("returns 500 when secret is missing", () => {
    delete process.env["SERVICE_AUTH_SECRET"];
    delete process.env["API_INTERNAL_KEY"];
    const middleware = requireServiceAuth();
    const ctx = createReqRes({});

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(false);
    expect(ctx.statusCode).toBe(500);
    expect(ctx.jsonBody).toEqual({
      success: false,
      error: {
        code: "SERVICE_AUTH_MISCONFIGURED",
        message: "Service auth secret is not configured",
      },
    });
  });

  test("returns 401 when no auth headers are present", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth({ allowLegacyInternalKey: false });
    const ctx = createReqRes({});

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(false);
    expect(ctx.statusCode).toBe(401);
    expect(ctx.jsonBody).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Service authentication required" },
    });
  });

  test("treats empty-string headers as missing", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth({ allowLegacyInternalKey: false });
    const ctx = createReqRes({
      headers: {
        "x-service-caller": "",
      },
    });

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(false);
    expect(ctx.statusCode).toBe(401);
    expect(ctx.jsonBody).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Service authentication required" },
    });
  });

  test("treats empty header arrays as missing", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth({ allowLegacyInternalKey: false });
    const ctx = createReqRes({
      headers: {
        "x-service-caller": [],
      },
    });

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(false);
    expect(ctx.statusCode).toBe(401);
    expect(ctx.jsonBody).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Service authentication required" },
    });
  });

  test("rejects stale timestamps", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth({ skewMs: 1000 });
    const timestamp = (Date.now() - 60_000).toString();
    const nonce = "0011223344556677";
    const rawBody = Buffer.from("");
    const signature = signCanonical(
      BASE_SECRET,
      "GET",
      "/internal/ping",
      timestamp,
      nonce,
      rawBody,
    );
    const ctx = createReqRes({
      headers: {
        "x-service-caller": "collector",
        "x-service-timestamp": timestamp,
        "x-service-nonce": nonce,
        "x-service-signature": signature,
      },
      rawBody,
    });

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(false);
    expect(ctx.statusCode).toBe(401);
    expect(ctx.jsonBody).toEqual({
      success: false,
      error: { code: "SERVICE_AUTH_STALE", message: "Service request timestamp out of window" },
    });
  });

  test("rejects bad signatures", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth();
    const ctx = createReqRes({
      method: "POST",
      originalUrl: "/internal/secure",
      headers: {
        "x-service-caller": "collector",
        "x-service-timestamp": Date.now().toString(),
        "x-service-nonce": "abcdef1234567890",
        "x-service-signature": "bad-signature",
      },
      rawBody: Buffer.from('{"a":1}'),
    });

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(false);
    expect(ctx.statusCode).toBe(401);
    expect(ctx.jsonBody).toEqual({
      success: false,
      error: { code: "SERVICE_AUTH_BAD_SIGNATURE", message: "Invalid service signature" },
    });
  });

  test("accepts valid HMAC signature and sets req.service.caller", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth();
    const sig = signServiceRequest({
      caller: "collector",
      method: "GET",
      path: "/internal/vendors/due-for-research?limit=10",
      body: Buffer.alloc(0),
      secret: BASE_SECRET,
    });
    const ctx = createReqRes({
      method: "GET",
      originalUrl: "/internal/vendors/due-for-research?limit=10",
      headers: toHeaderRecord(sig),
      rawBody: Buffer.alloc(0),
    });

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(true);
    expect(ctx.statusCode).toBe(200);
    expect(ctx.req.service).toEqual({ caller: "collector" });
  });

  test("accepts valid signature when headers arrive as arrays", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth();
    const sig = signServiceRequest({
      caller: "collector",
      method: "GET",
      path: "/internal/ping",
      body: Buffer.alloc(0),
      secret: BASE_SECRET,
    });
    const ctx = createReqRes({
      method: "GET",
      originalUrl: "/internal/ping",
      headers: {
        "x-service-caller": [sig.caller],
        "x-service-timestamp": [sig.timestamp],
        "x-service-nonce": [sig.nonce],
        "x-service-signature": [sig.signature],
      },
      rawBody: Buffer.alloc(0),
    });

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(true);
    expect(ctx.req.service).toEqual({ caller: "collector" });
  });

  test("accepts legacy internal key when enabled", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth({ allowLegacyInternalKey: true });
    const warnSpy = spyOn(console, "warn").mockImplementation(() => {});
    const ctx = createReqRes({
      headers: {
        "x-internal-key": BASE_SECRET,
      },
    });

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(true);
    expect(ctx.req.service).toEqual({ caller: "legacy" });
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  test("rejects legacy internal key when disabled", () => {
    process.env["SERVICE_AUTH_SECRET"] = BASE_SECRET;
    const middleware = requireServiceAuth({ allowLegacyInternalKey: false });
    const ctx = createReqRes({
      headers: {
        "x-internal-key": BASE_SECRET,
      },
    });

    middleware(ctx.req, ctx.res, ctx.next);

    expect(ctx.nextCalled).toBe(false);
    expect(ctx.statusCode).toBe(401);
    expect(ctx.jsonBody).toEqual({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Service authentication required" },
    });
  });
});
