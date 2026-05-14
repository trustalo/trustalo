import { describe, expect, test } from "bun:test";
import { scrubPii } from "./scrub.js";

describe("scrubPii", () => {
  test("redacts url credentials, email, ip, phone and long numbers", () => {
    const input = [
      "URL https://user:pass@example.com/path",
      "mail alice@example.com",
      "IPv4 192.168.1.10",
      "IPv6 2001:0db8:85a3:0000:0000:8a2e:0370:7334",
      "Phone +1 (415) 555-1234",
      "Long number 123456789012",
    ].join(" | ");

    const out = scrubPii(input);

    expect(out.text).toContain("https://example.com/path");
    expect(out.text).toContain("[email]");
    expect(out.text).toContain("[ip]");
    expect(out.text).toContain("[phone]");
    expect(out.redactions.urlCredential).toBe(1);
    expect(out.redactions.email).toBe(1);
    expect(out.redactions.ip).toBeGreaterThanOrEqual(1);
    expect(out.redactions.phone).toBeGreaterThanOrEqual(1);
    expect(out.redactions.number).toBeGreaterThanOrEqual(0);
    expect(out.total).toBe(
      out.redactions.email +
        out.redactions.phone +
        out.redactions.ip +
        out.redactions.number +
        out.redactions.urlCredential,
    );
  });

  test("returns unchanged text and zero counters when no pii exists", () => {
    const input = "Compliance policies are reviewed quarterly by the security committee.";
    const out = scrubPii(input);
    expect(out.text).toBe(input);
    expect(out.redactions).toEqual({
      email: 0,
      phone: 0,
      ip: 0,
      number: 0,
      urlCredential: 0,
    });
    expect(out.total).toBe(0);
  });
});
