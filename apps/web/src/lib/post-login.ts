// Post-login redirect target ("next"). Used by the device-agent browser
// sign-in: /device/authorize bounces unauthenticated users to /login?next=…
// and they come back here after signing in (credential immediately, SSO after
// the IdP round-trip via sessionStorage).
//
// SECURITY: only same-origin RELATIVE paths are allowed, so `next` can never be
// turned into an open redirect to another origin.

const KEY = "trustalo_post_login_next";

export function isSafeNext(next: string | null | undefined): next is string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//");
}

/** Read a validated `?next=` from the current URL. */
export function readNextFromQuery(): string | null {
  if (typeof window === "undefined") return null;
  const next = new URLSearchParams(window.location.search).get("next");
  return isSafeNext(next) ? next : null;
}

/** Stash `next` so it survives an SSO round-trip back to /auth/callback. */
export function stashNext(next: string | null): void {
  if (typeof window === "undefined") return;
  if (isSafeNext(next)) sessionStorage.setItem(KEY, next);
}

/** Consume the post-login target, defaulting to the dashboard. */
export function takeNext(): string {
  if (typeof window === "undefined") return "/dashboard";
  const next = sessionStorage.getItem(KEY);
  sessionStorage.removeItem(KEY);
  return isSafeNext(next) ? next : "/dashboard";
}
