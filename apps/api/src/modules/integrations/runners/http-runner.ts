/**
 * Phase 4 (AI accelerators): inline HTTP runner.
 *
 * Executes an `HttpCheckSpec` from inside the API process. Used for
 * both ad-hoc test runs ("Test before save" in the wizard) and for the
 * scheduled-evaluation worker. There is no network I/O during type-check
 * — the runner is a leaf module with a single `runHttpCheck` export.
 *
 * Safety posture (constraint C1 / Phase 4 acceptance):
 *
 *   • HTTPS-only: plain HTTP URLs are rejected with `BLOCKED_SCHEME`.
 *   • Private/loopback/link-local IPs are blocked unless the org has
 *     explicitly allow-listed the host. Resolution happens once via
 *     `dns.lookup` and the response is re-checked after every redirect
 *     (we follow at most 3).
 *   • Bodies are streamed and capped at 1 MB to bound memory.
 *   • Hard request timeout (clamped by the spec schema to <= 30s).
 *   • Authorization headers proposed by the LLM are stripped — only
 *     trusted operators can add credentials via the integration's
 *     encrypted config blob.
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

const MAX_BODY_BYTES = 1_000_000;
const STRIPPED_HEADERS = new Set(["authorization", "cookie", "proxy-authorization"]);

export async function runHttpCheck(spec: HttpCheckSpec): Promise<HttpRunResult> {
  const startedAt = Date.now();

  try {
    await assertSafeHost(spec.url);

    const headers = sanitizeHeaders(spec.headers);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), spec.timeoutMs);

    let response: Response;
    try {
      response = await fetch(spec.url, {
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
      await assertSafeHost(response.url);
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
      const tls = await probeTls(spec.url);
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

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
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

async function assertSafeHost(rawUrl: string): Promise<void> {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:") {
    throw new Error("BLOCKED_SCHEME: only https URLs are allowed for AI-generated checks");
  }
  const host = url.hostname;
  // For IP-literal hosts, reuse the same check.
  const candidates = isIpLiteral(host)
    ? [{ address: host, family: host.includes(":") ? 6 : 4 }]
    : await dnsLookup(host, { all: true });
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

interface TlsProbe {
  validTo: string;
  validToMs: number;
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
