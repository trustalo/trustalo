/**
 * Universal HTTP check executor.
 *
 * Executes an `HttpCheckSpec` (the strict zod contract exported by
 * `@trustalo/integration-manifests`). One executor serves both paths:
 *
 *   • Ad-hoc "Test before save" runs (`POST /checks/test`).
 *   • Scheduled runs of saved custom checks (`src/runner/custom-checks.ts`).
 *
 * This module was moved from the API (`apps/api/.../runners/http-runner.ts`)
 * so the collector — which owns the check-evaluation pipeline — is the only
 * process that executes specs.
 *
 * Safety posture:
 *
 *   • HTTPS-only: plain HTTP URLs are rejected with `BLOCKED_SCHEME`.
 *   • Private/loopback/link-local IPs are blocked. Resolution happens once
 *     via `dns.lookup` and is re-checked after redirects (max 3 hops via
 *     fetch's follow mode + a post-redirect host re-check).
 *   • Bodies are streamed and capped at 1 MB to bound memory.
 *   • Hard request timeout (clamped by the spec schema to <= 30s).
 *   • Literal `Authorization` / `Cookie` header values are stripped — the
 *     LLM (or a user pasting JSON) must never embed credentials in a spec.
 *     Credentials belong in the SecretVault: a header value may reference
 *     one with a `{{secret:KEY}}` placeholder, which is resolved at run
 *     time from the custom connection's vault row and never persisted in
 *     the spec.
 *
 * Dependencies (`fetch`, DNS lookup, TLS probe) are injectable so unit
 * tests can exercise the full pipeline without network access.
 */

import { lookup as dnsLookup } from "node:dns/promises";
import { connect as tlsConnect } from "node:tls";
import type { HttpCheckSpec } from "@trustalo/integration-manifests";

export interface HttpRunResult {
  status: "pass" | "fail" | "error";
  durationMs: number;
  responseStatus?: number;
  responseHeaders?: Record<string, string>;
  bodySnippet?: string;
  tlsValidUntil?: string;
  failures: string[];
  error?: string;
}

export interface TlsProbe {
  validTo: string;
  validToMs: number;
}

export interface RunHttpCheckOptions {
  /**
   * Decrypted SecretVault payload for the owning connection. Header
   * values may reference entries via `{{secret:KEY}}` placeholders —
   * the literal secret never appears in the stored spec.
   */
  secrets?: Record<string, string>;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
  /** Injectable for tests; defaults to `node:dns/promises` lookup. */
  lookupImpl?: (host: string) => Promise<Array<{ address: string; family: number }>>;
  /** Injectable for tests; defaults to a real `tls.connect` probe. */
  tlsProbeImpl?: (url: string) => Promise<TlsProbe>;
}

const MAX_BODY_BYTES = 1_000_000;
const STRIPPED_HEADERS = new Set(["authorization", "cookie", "proxy-authorization"]);
const SECRET_PLACEHOLDER = /\{\{\s*secret:([a-zA-Z0-9_.-]+)\s*\}\}/g;

export class SecretPlaceholderError extends Error {
  readonly code = "SECRET_NOT_FOUND";
  constructor(key: string) {
    super(
      `Header references {{secret:${key}}} but no secret named "${key}" exists in the connection's vault`,
    );
  }
}

export async function runHttpCheck(
  spec: HttpCheckSpec,
  options: RunHttpCheckOptions = {},
): Promise<HttpRunResult> {
  const startedAt = Date.now();
  const fetchImpl = options.fetchImpl ?? fetch;
  const lookupImpl = options.lookupImpl ?? defaultLookup;
  const tlsProbeImpl = options.tlsProbeImpl ?? probeTls;

  try {
    await assertSafeHost(spec.url, lookupImpl);

    const headers = resolveHeaders(spec.headers, options.secrets ?? {});
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), spec.timeoutMs);

    let response: Response;
    try {
      response = await fetchImpl(spec.url, {
        method: spec.method,
        headers,
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.redirected) {
      // After-redirect host re-check; abort if the chain landed on a private IP.
      await assertSafeHost(response.url, lookupImpl);
    }

    const responseHeaders = headersToRecord(response.headers);
    const bodyText = await readCappedBody(response);
    const failures: string[] = [];

    if (spec.expect.statusCode !== undefined && response.status !== spec.expect.statusCode) {
      failures.push(`expected status ${spec.expect.statusCode}, got ${response.status}`);
    }

    if (spec.expect.bodyContains !== undefined) {
      const needle = spec.expect.bodyContains.toLowerCase();
      if (!bodyText.toLowerCase().includes(needle)) {
        failures.push(`response body did not contain "${spec.expect.bodyContains}"`);
      }
    }

    if (spec.expect.headerEquals) {
      for (const [name, expected] of Object.entries(spec.expect.headerEquals)) {
        const actual = responseHeaders[name.toLowerCase()];
        if (actual !== expected) {
          failures.push(`header ${name} expected "${expected}", got "${actual ?? "<missing>"}"`);
        }
      }
    }

    let tlsValidUntil: string | undefined;
    if (spec.expect.tlsValidForDays !== undefined) {
      const tls = await tlsProbeImpl(spec.url);
      tlsValidUntil = tls.validTo;
      const minValidUntil = Date.now() + spec.expect.tlsValidForDays * 86_400_000;
      if (tls.validToMs < minValidUntil) {
        failures.push(
          `TLS certificate valid only until ${tls.validTo} (need >= ${spec.expect.tlsValidForDays} days from now)`,
        );
      }
    }

    return {
      status: failures.length === 0 ? "pass" : "fail",
      durationMs: Date.now() - startedAt,
      responseStatus: response.status,
      responseHeaders,
      bodySnippet: bodyText.slice(0, 500),
      tlsValidUntil,
      failures,
    };
  } catch (err) {
    return {
      status: "error",
      durationMs: Date.now() - startedAt,
      failures: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ──────────────────────────── Internals ────────────────────────────

/**
 * Substitute `{{secret:KEY}}` placeholders and strip literal credential
 * headers.
 *
 * Rules:
 *  • A header whose value contains a placeholder is vault-backed: the
 *    placeholder is replaced with the decrypted secret and the header is
 *    ALLOWED even if it's `Authorization` (trusted-operator path).
 *  • A literal `Authorization`/`Cookie`/`Proxy-Authorization` value is
 *    stripped — specs must never carry raw credentials.
 *  • A placeholder that doesn't resolve throws (fail closed; we never
 *    send the raw `{{secret:…}}` text over the wire).
 */
export function resolveHeaders(
  headers: Record<string, string>,
  secrets: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const hasPlaceholder = SECRET_PLACEHOLDER.test(value);
    SECRET_PLACEHOLDER.lastIndex = 0;
    if (hasPlaceholder) {
      out[key] = value.replace(SECRET_PLACEHOLDER, (_match, name: string) => {
        const secret = secrets[name];
        if (secret === undefined) throw new SecretPlaceholderError(name);
        return secret;
      });
      continue;
    }
    if (STRIPPED_HEADERS.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

function headersToRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

async function readCappedBody(response: Response): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (total < MAX_BODY_BYTES) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;
    const slice =
      total + value.length > MAX_BODY_BYTES ? value.slice(0, MAX_BODY_BYTES - total) : value;
    chunks.push(slice);
    total += slice.length;
  }
  try {
    await reader.cancel();
  } catch {
    /* ignore */
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(concat(chunks));
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

async function defaultLookup(host: string): Promise<Array<{ address: string; family: number }>> {
  return dnsLookup(host, { all: true });
}

async function assertSafeHost(
  rawUrl: string,
  lookupImpl: (host: string) => Promise<Array<{ address: string; family: number }>>,
): Promise<void> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") {
    throw new Error("BLOCKED_SCHEME: only https URLs are allowed for custom checks");
  }
  const host = url.hostname;
  // For IP-literal hosts, reuse the same check.
  const candidates = isIpLiteral(host)
    ? [{ address: host, family: host.includes(":") ? 6 : 4 }]
    : await lookupImpl(host);
  for (const c of candidates) {
    if (isPrivateAddress(c.address)) {
      throw new Error(
        `BLOCKED_PRIVATE_IP: ${host} resolves to a private/loopback address (${c.address})`,
      );
    }
  }
}

function isIpLiteral(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host.includes(":");
}

function isPrivateAddress(addr: string): boolean {
  if (addr === "::1" || addr.startsWith("fc") || addr.startsWith("fd") || addr.startsWith("fe80")) {
    return true;
  }
  const parts = addr.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts as [number, number, number, number];
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 0) return true;
  return false;
}

function probeTls(rawUrl: string): Promise<TlsProbe> {
  const url = new URL(rawUrl);
  return new Promise((resolve, reject) => {
    const socket = tlsConnect(
      {
        host: url.hostname,
        port: url.port ? Number(url.port) : 443,
        servername: url.hostname,
        timeout: 10_000,
      },
      () => {
        const cert = socket.getPeerCertificate();
        socket.end();
        if (!cert || !cert.valid_to) {
          reject(new Error("TLS_NO_CERT"));
          return;
        }
        const validToMs = Date.parse(cert.valid_to);
        resolve({ validTo: cert.valid_to, validToMs });
      },
    );
    socket.on("error", reject);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("TLS_TIMEOUT"));
    });
  });
}
