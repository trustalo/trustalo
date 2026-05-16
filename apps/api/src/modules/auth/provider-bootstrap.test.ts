import { afterEach, beforeEach, describe, expect, test } from "bun:test";

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

beforeEach(() => {
  process.env.API_DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
});

afterEach(async () => {
  const mod = await import("./provider-bootstrap.js");
  mod.__resetAuthProviderForTests();
  resetEnv();
});

describe("provider bootstrap", () => {
  test("loads google provider when AUTH_PROVIDER=google", async () => {
    process.env.AUTH_PROVIDER = "google";
    process.env.GOOGLE_CLIENT_ID = "google-client-id-123";

    const mod = await import("./provider-bootstrap.js");
    const provider = await mod.getActiveAuthProvider();

    expect(provider.id).toBe("google");
    expect(provider.kind).toBe("redirect");
    expect(provider.displayName).toBe("Google");
  });

  test("loads microsoft provider when AUTH_PROVIDER=microsoft", async () => {
    process.env.AUTH_PROVIDER = "microsoft";
    process.env.MICROSOFT_TENANT_ID = "organizations";
    process.env.MICROSOFT_CLIENT_ID = "microsoft-client-id-123";

    const mod = await import("./provider-bootstrap.js");
    const provider = await mod.getActiveAuthProvider();

    expect(provider.id).toBe("microsoft");
    expect(provider.kind).toBe("redirect");
    expect(provider.displayName).toBe("Microsoft");
  });
});
