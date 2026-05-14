import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request Content-Security-Policy with a nonce.
 *
 * Why a proxy (formerly Next.js "middleware") instead of `next.config.ts`
 * headers:
 *   - We want a fresh `'nonce-XYZ'` on every response so any inline
 *     script that Next.js (or our own Script tags) emits must be
 *     paired with the matching nonce. Without per-request nonces we
 *     are forced to allow `'unsafe-inline'` for `script-src`, which
 *     defeats most of the XSS value of CSP.
 *   - `'strict-dynamic'` tells modern browsers to ignore `'unsafe-inline'`
 *     and host allowlists once a trusted (nonced) script has loaded,
 *     so older browsers keep working while modern ones get the strict
 *     enforcement.
 *
 * Components that need to emit inline scripts can read the nonce from
 * the `x-nonce` request header, which is propagated by the
 * `NextResponse.next({ request })` call below.
 *
 * Renamed from `middleware.ts` for Next.js 16 (see
 * https://nextjs.org/docs/messages/middleware-to-proxy).
 */
export function proxy(request: NextRequest): NextResponse {
  const nonce = generateNonce();
  const isDev = process.env.NODE_ENV !== "production";

  const directives: string[] = [
    "default-src 'self'",
    // Inline scripts are only allowed when carrying the matching nonce.
    // `'strict-dynamic'` then trusts anything those scripts load, so we
    // don't need a host allowlist. `'unsafe-inline'` is kept as a fallback
    // for browsers that don't understand nonces (they ignore it once
    // `nonce-...` or `strict-dynamic` is present in newer browsers).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""} 'unsafe-inline'`,
    // Tailwind ships utility classes as inline `style` attributes so
    // `style-src` still needs `'unsafe-inline'`. Track upstream Tailwind
    // CSP guidance for when this can be removed.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: http://localhost:* ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  const csp = directives
    .join("; ")
    .replace(/\s{2,}/g, " ")
    .trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export const config = {
  matcher: [
    // Skip static assets, Next internals, and image optimisations — the
    // CSP is a document-level concern.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
