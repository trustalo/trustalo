import { afterEach, describe, expect, test } from "bun:test";
import {
  getApiInternalKey,
  getCorsOptions,
  getJwtSecret,
  getOauthStateSecret,
} from "./security.js";

const originalEnv = { ...process.env };

function resetEnv(): void {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  resetEnv();
});

// Accept the full `cors` typing (which includes `undefined`/static arrays)
// and narrow internally — keeps the test call-sites readable without a
// non-null assertion at every line.
function assertOrigin(
  originFn: ReturnType<typeof getCorsOptions>["origin"],
  origin: string | undefined,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (typeof originFn !== "function") {
      reject(new Error("origin callback is not a function"));
      return;
    }
    originFn(origin, (err, allowed) => {
      if (err) reject(err);
      else resolve(Boolean(allowed));
    });
  });
}

describe("getJwtSecret", () => {
  test("uses dev fallback when JWT_SECRET is missing outside production", () => {
    process.env["NODE_ENV"] = "development";
    delete process.env["JWT_SECRET"];
    expect(getJwtSecret()).toBe("dev-only-jwt-secret-change-before-prod-0001");
  });

  test("throws in production when JWT_SECRET is missing", () => {
    process.env["NODE_ENV"] = "production";
    delete process.env["JWT_SECRET"];
    expect(() => getJwtSecret()).toThrow("[security] JWT_SECRET is required");
  });

  test("throws in production when JWT_SECRET is insecure placeholder", () => {
    process.env["NODE_ENV"] = "production";
    process.env["JWT_SECRET"] = "change-me";
    expect(() => getJwtSecret()).toThrow(
      "[security] JWT_SECRET uses an insecure placeholder value",
    );
  });

  test("throws in production when JWT_SECRET is too short", () => {
    process.env["NODE_ENV"] = "production";
    process.env["JWT_SECRET"] = "x".repeat(31);
    expect(() => getJwtSecret()).toThrow("[security] JWT_SECRET must be at least 32 characters");
  });

  test("returns configured JWT_SECRET when strong", () => {
    process.env["NODE_ENV"] = "production";
    process.env["JWT_SECRET"] = "x".repeat(64);
    expect(getJwtSecret()).toBe("x".repeat(64));
  });
});

describe("getOauthStateSecret", () => {
  test("falls back to jwt secret when oauth secret is unset", () => {
    process.env["NODE_ENV"] = "production";
    delete process.env["AUTH_OAUTH_STATE_SECRET"];
    expect(getOauthStateSecret("jwt-fallback")).toBe("jwt-fallback");
  });

  test("throws in production when oauth secret is too short", () => {
    process.env["NODE_ENV"] = "production";
    process.env["AUTH_OAUTH_STATE_SECRET"] = "short";
    expect(() => getOauthStateSecret("jwt-fallback")).toThrow(
      "[security] AUTH_OAUTH_STATE_SECRET must be at least 32 characters",
    );
  });

  test("returns configured oauth secret", () => {
    process.env["NODE_ENV"] = "production";
    process.env["AUTH_OAUTH_STATE_SECRET"] = "a".repeat(40);
    expect(getOauthStateSecret("jwt-fallback")).toBe("a".repeat(40));
  });
});

describe("getApiInternalKey", () => {
  test("uses dev fallback when missing outside production", () => {
    process.env["NODE_ENV"] = "development";
    delete process.env["API_INTERNAL_KEY"];
    expect(getApiInternalKey()).toBe("dev-only-internal-key-change-before-prod-0001");
  });

  test("throws in production when missing", () => {
    process.env["NODE_ENV"] = "production";
    delete process.env["API_INTERNAL_KEY"];
    expect(() => getApiInternalKey()).toThrow("[security] API_INTERNAL_KEY is required");
  });
});

describe("getCorsOptions", () => {
  test("dev fallback allows localhost variants and blocks untrusted origins", async () => {
    process.env["NODE_ENV"] = "development";
    delete process.env["CORS_ALLOWED_ORIGINS"];
    const options = getCorsOptions();

    expect(options.credentials).toBe(true);
    expect(await assertOrigin(options.origin, undefined)).toBe(true);
    expect(await assertOrigin(options.origin, "http://localhost:3000")).toBe(true);
    expect(await assertOrigin(options.origin, "http://127.0.0.1:3100")).toBe(true);
    expect(await assertOrigin(options.origin, "http://[::1]:3000")).toBe(true);
    expect(await assertOrigin(options.origin, "https://evil.example")).toBe(false);
  });

  test("throws in production when CORS_ALLOWED_ORIGINS is missing", () => {
    process.env["NODE_ENV"] = "production";
    delete process.env["CORS_ALLOWED_ORIGINS"];
    expect(() => getCorsOptions()).toThrow(
      "[security] CORS_ALLOWED_ORIGINS is required in production",
    );
  });

  test("uses configured allowlist when CORS_ALLOWED_ORIGINS is set", async () => {
    process.env["NODE_ENV"] = "production";
    process.env["CORS_ALLOWED_ORIGINS"] = "https://app.example.com, https://admin.example.com";
    const options = getCorsOptions();

    expect(options.credentials).toBe(true);
    expect(await assertOrigin(options.origin, undefined)).toBe(true);
    expect(await assertOrigin(options.origin, "https://app.example.com")).toBe(true);
    expect(await assertOrigin(options.origin, "https://admin.example.com")).toBe(true);
    expect(await assertOrigin(options.origin, "https://evil.example")).toBe(false);
  });
});
