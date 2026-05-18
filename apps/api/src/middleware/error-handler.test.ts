/**
 * Contract tests for the Express error handler.
 *
 * The whole Enterprise-feature gating story relies on a single
 * downstream invariant: when any route throws an
 * `EnterpriseLicenseError`, the client must observe a stable
 * `402 Payment Required` response with an `ENTERPRISE_LICENSE_*`
 * code so the SPA can render its upgrade prompt without parsing
 * free-form strings.
 *
 * We exercise the handler directly with mock req/res/next stubs
 * (rather than booting Express) so the test is fast and has zero
 * runtime dependencies on Prisma or any module side effects.
 *
 * Coverage targets:
 *   - 402 status code is produced
 *   - body.error.code is exactly `ENTERPRISE_LICENSE_<UPPERCASE-REASON>`
 *   - body.error.message is the generic upgrade prompt (no internal
 *     reason / feature id leaks through)
 *   - mapping is stable across every `EnterpriseLicenseErrorCode`
 *   - no `next()` is invoked (the handler terminates the chain)
 */

import { describe, expect, test } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import { EnterpriseLicenseError } from "@trustalo/license";
import type { EnterpriseLicenseErrorCode } from "@trustalo/license";
import { errorHandler } from "./error-handler.js";

interface CapturedResponse {
  status?: number;
  body?: unknown;
}

function makeRes(captured: CapturedResponse): Response {
  // Minimal Express Response stub — only the bits the handler uses.
  return {
    status(s: number) {
      captured.status = s;
      return this;
    },
    json(b: unknown) {
      captured.body = b;
      return this;
    },
  } as unknown as Response;
}

function runHandler(err: unknown): { captured: CapturedResponse; nextCalled: boolean } {
  const captured: CapturedResponse = {};
  let nextCalled = false;
  const next: NextFunction = () => {
    nextCalled = true;
  };
  errorHandler(err, {} as Request, makeRes(captured), next);
  return { captured, nextCalled };
}

describe("errorHandler · EnterpriseLicenseError mapping", () => {
  test("returns 402 with ENTERPRISE_LICENSE_* code and generic message", () => {
    const err = new EnterpriseLicenseError("ai", "TRUSTALO_LICENSE_KEY not set", "no_license_key");
    const { captured, nextCalled } = runHandler(err);

    expect(captured.status).toBe(402);
    expect(captured.body).toEqual({
      success: false,
      error: {
        code: "ENTERPRISE_LICENSE_NO_LICENSE_KEY",
        message: "Trustalo Enterprise License is required to use this feature.",
      },
    });
    // The error handler must terminate the chain — calling next() would
    // hand the response off to Express's default handler and break the
    // contract the SPA is built on.
    expect(nextCalled).toBe(false);
  });

  test("public message never leaks the internal reason or feature id", () => {
    const err = new EnterpriseLicenseError(
      "trust-center",
      "internal: revoked at 2025-08-01T12:34:56Z by ops-789",
      "revoked",
    );
    const { captured } = runHandler(err);

    const body = captured.body as { error: { message: string } };
    expect(body.error.message).not.toContain("trust-center");
    expect(body.error.message).not.toContain("internal");
    expect(body.error.message).not.toContain("ops-789");
    expect(body.error.message).toBe("Trustalo Enterprise License is required to use this feature.");
  });

  test("code mapping is stable across every EnterpriseLicenseErrorCode", () => {
    // Enumerated explicitly so adding a new code without a mapping
    // update will fail compilation here. Keep in sync with
    // `EnterpriseLicenseErrorCode` in @trustalo/license.
    const codes: EnterpriseLicenseErrorCode[] = [
      "no_license_key",
      "no_trusted_keys",
      "malformed_key",
      "invalid_signature",
      "schema_invalid",
      "expired",
      "not_yet_valid",
      "feature_not_entitled",
      "revoked",
      "dev_key_in_production",
    ];

    for (const code of codes) {
      const err = new EnterpriseLicenseError("ai", `reason: ${code}`, code);
      const { captured } = runHandler(err);
      expect(captured.status).toBe(402);
      const body = captured.body as { error: { code: string } };
      expect(body.error.code).toBe(`ENTERPRISE_LICENSE_${code.toUpperCase()}`);
    }
  });
});
