/**
 * Email alert channel.
 *
 * The repo has no existing mailer (nothing sends email today — invites go
 * through the auth provider), so this is a minimal, dependency-free SMTP
 * client over node:net / node:tls supporting EHLO, STARTTLS, implicit TLS
 * and AUTH LOGIN — enough for every mainstream relay (SES, Postmark,
 * Mailgun, Google Workspace, self-hosted Postfix).
 *
 * Configuration is env-only (operator concern, not per-tenant):
 *   SMTP_HOST     — relay hostname. Unset ⇒ no email in production; in
 *                   development the message is logged to stdout instead
 *                   so the channel is testable without a relay.
 *   SMTP_PORT     — default 587 (or 465 when SMTP_SECURE=true).
 *   SMTP_SECURE   — "true" for implicit TLS (465). Otherwise the client
 *                   upgrades via STARTTLS when the server offers it.
 *   SMTP_USER / SMTP_PASS — optional AUTH LOGIN credentials.
 *   SMTP_FROM     — From header/envelope, default "Trustalo Alerts
 *                   <alerts@localhost>".
 *
 * `buildMimeMessage` is pure and unit-tested (header encoding,
 * dot-stuffing, CRLF normalization).
 */

import { createConnection, type Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";
import { alertTitle, appBaseUrl, type AlertMessage } from "./types.js";

const SMTP_COMMAND_TIMEOUT_MS = 15_000;

export interface SmtpEnvConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

export function getSmtpConfig(env: Record<string, string | undefined> = process.env): {
  config: SmtpEnvConfig | null;
  devFallback: boolean;
} {
  const host = env.SMTP_HOST?.trim();
  if (!host) {
    const isProduction = (env.NODE_ENV ?? "development").toLowerCase() === "production";
    return { config: null, devFallback: !isProduction };
  }
  const secure = env.SMTP_SECURE === "true";
  return {
    config: {
      host,
      port: parseInt(env.SMTP_PORT ?? (secure ? "465" : "587"), 10),
      secure,
      user: env.SMTP_USER || undefined,
      pass: env.SMTP_PASS || undefined,
      from: env.SMTP_FROM?.trim() || "Trustalo Alerts <alerts@localhost>",
    },
    devFallback: false,
  };
}

// ── MIME message building (pure) ────────────────────────────────────

/** RFC 2047 B-encode a header value when it contains non-ASCII. */
export function encodeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

/**
 * Assemble the on-the-wire DATA payload: CRLF line endings, RFC 2047
 * headers, and SMTP dot-stuffing (a leading "." doubled on every line).
 * Does NOT append the terminating `<CRLF>.<CRLF>` — the transport does.
 */
export function buildMimeMessage(input: {
  from: string;
  to: string[];
  subject: string;
  text: string;
}): string {
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to.join(", ")}`,
    `Subject: ${encodeHeaderValue(input.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@trustalo>`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="utf-8"',
    "Content-Transfer-Encoding: 8bit",
  ];
  const body = input.text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => (line.startsWith(".") ? `.${line}` : line))
    .join("\r\n");
  return `${headers.join("\r\n")}\r\n\r\n${body}`;
}

/** Extract the bare address from `Name <addr@host>` forms for the envelope. */
export function envelopeAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  return match?.[1] ?? from.trim();
}

// ── Minimal SMTP transport ──────────────────────────────────────────

interface SmtpReply {
  code: number;
  lines: string[];
}

/** Line-buffered reply reader over a socket; one pending read at a time. */
class SmtpStream {
  private buffer = "";
  private waiter: { resolve: (r: SmtpReply) => void; reject: (e: Error) => void } | null = null;
  private pending: SmtpReply[] = [];
  private failure: Error | null = null;

  constructor(public socket: Socket | TLSSocket) {
    this.attach(socket);
  }

  /** Re-attach after a STARTTLS upgrade wraps the raw socket. */
  attach(socket: Socket | TLSSocket): void {
    this.socket = socket;
    this.buffer = "";
    socket.on("data", (chunk: Buffer) => this.onData(chunk));
    socket.on("error", (err: Error) => this.fail(err));
    socket.on("close", () => this.fail(new Error("SMTP connection closed unexpectedly")));
  }

  private onData(chunk: Buffer): void {
    this.buffer += chunk.toString("utf8");
    // A reply is complete when its final line is `NNN<space>…` (a
    // `NNN-…` line means "more to come").
    for (;;) {
      const end = this.buffer.indexOf("\r\n");
      if (end === -1) break;
      // Find the first terminal line in the buffered text.
      const lines = this.buffer.split("\r\n");
      let terminalIdx = -1;
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3}(?: |$)/.test(lines[i]!)) {
          terminalIdx = i;
          break;
        }
        if (!/^\d{3}-/.test(lines[i]!)) {
          this.fail(new Error("Malformed SMTP reply"));
          return;
        }
      }
      if (terminalIdx === -1) break;
      const replyLines = lines.slice(0, terminalIdx + 1);
      this.buffer = lines.slice(terminalIdx + 1).join("\r\n");
      const reply: SmtpReply = {
        code: parseInt(replyLines[terminalIdx]!.slice(0, 3), 10),
        lines: replyLines,
      };
      if (this.waiter) {
        const w = this.waiter;
        this.waiter = null;
        w.resolve(reply);
      } else {
        this.pending.push(reply);
      }
    }
  }

  private fail(err: Error): void {
    if (this.failure) return;
    this.failure = err;
    if (this.waiter) {
      const w = this.waiter;
      this.waiter = null;
      w.reject(err);
    }
  }

  read(): Promise<SmtpReply> {
    if (this.pending.length > 0) return Promise.resolve(this.pending.shift()!);
    if (this.failure) return Promise.reject(this.failure);
    return new Promise<SmtpReply>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("SMTP reply timeout")),
        SMTP_COMMAND_TIMEOUT_MS,
      );
      this.waiter = {
        resolve: (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      };
    });
  }

  write(line: string): void {
    this.socket.write(`${line}\r\n`);
  }

  async command(line: string, expectCodes: number[]): Promise<SmtpReply> {
    this.write(line);
    const reply = await this.read();
    if (!expectCodes.includes(reply.code)) {
      // Never echo the command back — it may carry credentials (AUTH).
      throw new Error(`SMTP error ${reply.code}: ${reply.lines[reply.lines.length - 1]}`);
    }
    return reply;
  }
}

function openSocket(config: SmtpEnvConfig): Promise<Socket | TLSSocket> {
  return new Promise((resolve, reject) => {
    const onError = (err: Error) => reject(err);
    if (config.secure) {
      const socket = tlsConnect({ host: config.host, port: config.port, servername: config.host });
      socket.once("error", onError);
      socket.once("secureConnect", () => {
        socket.removeListener("error", onError);
        resolve(socket);
      });
    } else {
      const socket = createConnection({ host: config.host, port: config.port });
      socket.once("error", onError);
      socket.once("connect", () => {
        socket.removeListener("error", onError);
        resolve(socket);
      });
    }
  });
}

function upgradeToTls(config: SmtpEnvConfig, plain: Socket): Promise<TLSSocket> {
  return new Promise((resolve, reject) => {
    const secured = tlsConnect({ socket: plain, servername: config.host });
    secured.once("error", reject);
    secured.once("secureConnect", () => resolve(secured));
  });
}

/** Send one message through the configured relay. Throws on any failure. */
export async function smtpSend(
  config: SmtpEnvConfig,
  input: { to: string[]; subject: string; text: string },
): Promise<void> {
  const socket = await openSocket(config);
  const stream = new SmtpStream(socket);
  try {
    await stream.read(); // 220 greeting
    let ehlo = await stream.command("EHLO trustalo", [250]);

    if (!config.secure && ehlo.lines.some((l) => /STARTTLS/i.test(l))) {
      await stream.command("STARTTLS", [220]);
      const secured = await upgradeToTls(config, socket as Socket);
      stream.attach(secured);
      ehlo = await stream.command("EHLO trustalo", [250]);
    }

    if (config.user && config.pass) {
      await stream.command("AUTH LOGIN", [334]);
      await stream.command(Buffer.from(config.user, "utf8").toString("base64"), [334]);
      await stream.command(Buffer.from(config.pass, "utf8").toString("base64"), [235]);
    }

    await stream.command(`MAIL FROM:<${envelopeAddress(config.from)}>`, [250]);
    for (const rcpt of input.to) {
      await stream.command(`RCPT TO:<${rcpt}>`, [250, 251]);
    }
    await stream.command("DATA", [354]);
    stream.write(buildMimeMessage({ from: config.from, ...input }));
    await stream.command(".", [250]);
    stream.write("QUIT");
  } finally {
    stream.socket.destroy();
  }
}

// ── Alert-facing surface ────────────────────────────────────────────

export function buildEmailText(message: AlertMessage): { subject: string; text: string } {
  const link = `${appBaseUrl()}${message.linkPath}`;
  return {
    subject: alertTitle(message),
    text: [
      message.summary,
      "",
      `Rule: ${message.ruleLabel} (${message.ruleKey})`,
      `Organization: ${message.tenantName}`,
      `Details: ${link}`,
      "",
      "— Trustalo notifications. Manage alert rules and channels under Settings → Notifications.",
    ].join("\n"),
  };
}

/**
 * Deliver an alert to a recipient list. In development without SMTP_HOST the
 * message is logged instead of sent (so the flow is exercisable locally);
 * in production a missing relay is a hard error surfaced on the delivery.
 */
export async function sendEmailAlert(recipients: string[], message: AlertMessage): Promise<void> {
  const { subject, text } = buildEmailText(message);
  const { config, devFallback } = getSmtpConfig();
  if (!config) {
    if (devFallback) {
      console.log(
        `[notifications] SMTP_HOST not set — dev fallback. Would email ${recipients.length} recipient(s): ${subject}\n${text}`,
      );
      return;
    }
    throw new Error("SMTP is not configured (set SMTP_HOST)");
  }
  await smtpSend(config, { to: recipients, subject, text });
}
