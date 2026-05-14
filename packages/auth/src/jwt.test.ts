import { describe, expect, test } from "bun:test";
import { decodeToken, signToken, verifyToken } from "./jwt.js";

const CONFIG = {
  secret: "jwt-test-secret-value-abcdefghijklmnopqrstuvwxyz",
  expiresIn: "1h",
};

describe("jwt helpers", () => {
  test("signToken + verifyToken round-trip payload", () => {
    const token = signToken(
      {
        userId: "u-1",
        tenantId: "org-1",
        role: "owner",
        permissions: ["read", "write"],
      },
      CONFIG,
    );
    const payload = verifyToken(token, CONFIG.secret);
    expect(payload.userId).toBe("u-1");
    expect(payload.tenantId).toBe("org-1");
    expect(payload.role).toBe("owner");
    expect(payload.permissions).toEqual(["read", "write"]);
  });

  test("decodeToken returns payload for valid token", () => {
    const token = signToken(
      {
        userId: "u-2",
        tenantId: "org-2",
        role: "viewer",
        permissions: ["read"],
      },
      CONFIG,
    );
    const decoded = decodeToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("u-2");
    expect(decoded?.tenantId).toBe("org-2");
  });

  test("decodeToken returns null for invalid token text", () => {
    expect(decodeToken("not-a-jwt")).toBeNull();
  });
});
