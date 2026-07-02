import { describe, expect, test } from "bun:test";
import { buildSlackPayload, buildTeamsPayload } from "./channels/webhook.js";
import {
  buildEmailText,
  buildMimeMessage,
  encodeHeaderValue,
  envelopeAddress,
  getSmtpConfig,
} from "./channels/email.js";
import { alertTitle, type AlertMessage } from "./channels/types.js";

const message: AlertMessage = {
  ruleKey: "device_at_risk",
  ruleLabel: "Device at risk",
  summary: 'Device "mbp-jane" is at risk — failing: diskEncryption',
  tenantName: "Acme Corp",
  linkPath: "/devices",
};

describe("payload formatting", () => {
  test("shared title carries rule label and tenant org name", () => {
    expect(alertTitle(message)).toBe("[Trustalo] Device at risk — Acme Corp");
  });

  test("slack payload is a text message with title, summary and link", () => {
    const payload = buildSlackPayload(message);
    const text = payload.text as string;
    expect(text).toContain("[Trustalo] Device at risk — Acme Corp");
    expect(text).toContain("mbp-jane");
    expect(text).toContain("/devices");
  });

  test("teams payload is a MessageCard with an OpenUri action", () => {
    const payload = buildTeamsPayload(message);
    expect(payload["@type"]).toBe("MessageCard");
    expect(payload.title).toBe("[Trustalo] Device at risk — Acme Corp");
    expect(payload.text).toBe(message.summary);
    const actions = payload.potentialAction as Array<{
      targets: Array<{ uri: string }>;
    }>;
    expect(actions[0]!.targets[0]!.uri).toContain("/devices");
  });

  test("email body includes rule, entity summary, tenant and link path", () => {
    const { subject, text } = buildEmailText(message);
    expect(subject).toBe("[Trustalo] Device at risk — Acme Corp");
    expect(text).toContain(message.summary);
    expect(text).toContain("device_at_risk");
    expect(text).toContain("Acme Corp");
    expect(text).toContain("/devices");
  });
});

describe("MIME message building", () => {
  test("uses CRLF line endings and dot-stuffs leading dots", () => {
    const mime = buildMimeMessage({
      from: "Trustalo Alerts <alerts@example.com>",
      to: ["security@example.com"],
      subject: "Hello",
      text: "line one\n.starts with dot\nline three",
    });
    const [, body] = mime.split("\r\n\r\n");
    expect(body).toBe("line one\r\n..starts with dot\r\nline three");
    expect(mime).toContain("From: Trustalo Alerts <alerts@example.com>");
    expect(mime).toContain("To: security@example.com");
    expect(mime).toContain("Subject: Hello");
    expect(mime).not.toContain("\n\n"); // no bare-LF blank lines
  });

  test("non-ASCII subjects are RFC 2047 encoded", () => {
    expect(encodeHeaderValue("plain ascii")).toBe("plain ascii");
    const encoded = encodeHeaderValue("Übergabe fällig");
    expect(encoded.startsWith("=?UTF-8?B?")).toBe(true);
    expect(Buffer.from(encoded.slice(10, -2), "base64").toString("utf8")).toBe("Übergabe fällig");
  });

  test("envelope address strips display names", () => {
    expect(envelopeAddress("Trustalo Alerts <alerts@example.com>")).toBe("alerts@example.com");
    expect(envelopeAddress("alerts@example.com")).toBe("alerts@example.com");
  });
});

describe("SMTP env config", () => {
  test("no SMTP_HOST → dev fallback outside production, hard-off in production", () => {
    expect(getSmtpConfig({ NODE_ENV: "development" })).toEqual({
      config: null,
      devFallback: true,
    });
    expect(getSmtpConfig({ NODE_ENV: "production" })).toEqual({
      config: null,
      devFallback: false,
    });
  });

  test("derives port from SMTP_SECURE and applies defaults", () => {
    expect(getSmtpConfig({ SMTP_HOST: "smtp.example.com" }).config).toEqual({
      host: "smtp.example.com",
      port: 587,
      secure: false,
      user: undefined,
      pass: undefined,
      from: "Trustalo Alerts <alerts@localhost>",
    });
    const secure = getSmtpConfig({
      SMTP_HOST: "smtp.example.com",
      SMTP_SECURE: "true",
      SMTP_USER: "user",
      SMTP_PASS: "pass",
      SMTP_FROM: "Alerts <a@example.com>",
    }).config!;
    expect(secure.port).toBe(465);
    expect(secure.secure).toBe(true);
    expect(secure.user).toBe("user");
    expect(secure.from).toBe("Alerts <a@example.com>");
  });
});
