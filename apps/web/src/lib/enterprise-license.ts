/**
 * Helpers for handling Enterprise-license-gated errors on the client.
 *
 * The API returns HTTP 402 with an error code of the form
 * `ENTERPRISE_LICENSE_*` when an Enterprise-only feature is invoked
 * without a valid Enterprise license (see `apps/api/src/middleware/
 * error-handler.ts`).
 *
 * UX policy: show a transient inline notice (auto-dismiss after 5s,
 * also closable via the X) right at the surface the user just
 * interacted with. Buttons themselves stay enabled — clicking a gated
 * action is what triggers the notice, so users always see *why*
 * nothing happened. Combine `useAiGated()` (proactive) with
 * `useEnterpriseToast()` (the notice state) per surface.
 */

"use client";

import { useEffect, useState } from "react";
import { ApiError, apiClient, type LicenseStatus } from "@/lib/api-client";

export const ENTERPRISE_REQUIRED_MESSAGE =
  "Trustalo Enterprise License is required to use this feature.";

export function isEnterpriseLicenseError(err: unknown): err is ApiError {
  if (!(err instanceof ApiError)) return false;
  if (err.status === 402) return true;
  return Boolean(err.code && err.code.startsWith("ENTERPRISE_LICENSE_"));
}

// ─── License status hook ──────────────────────────────────────────
//
// Fetched once per browser session and cached at module scope so the
// many AI surfaces in the dashboard don't each hit the API on every
// mount. Components subscribe via `useLicenseStatus()`; the first
// caller triggers the fetch, subsequent callers reuse the resolved
// value synchronously after it settles.

type Listener = (status: LicenseStatus | null) => void;

let cachedStatus: LicenseStatus | null = null;
let inflight: Promise<LicenseStatus | null> | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const fn of listeners) fn(cachedStatus);
}

async function fetchLicenseStatus(): Promise<LicenseStatus | null> {
  if (cachedStatus) return cachedStatus;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await apiClient.getLicenseStatus();
      cachedStatus = res.data;
      notify();
      return cachedStatus;
    } catch {
      // Network/auth failure: don't crash the UI, just leave AI controls
      // enabled and let the 402 fallback path render the banner. We
      // intentionally do not cache failures so a later mount retries.
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Reset the cached status (after logout, license-key change, etc.). */
export function resetLicenseStatusCache(): void {
  cachedStatus = null;
  inflight = null;
  notify();
}

/**
 * React hook returning the current license status. `null` while the
 * first fetch is in flight or if the request failed. Components that
 * need to pre-disable AI affordances should treat `enterprise === true`
 * as "AI is allowed" and anything else (including `null`) as gated.
 */
export function useLicenseStatus(): LicenseStatus | null {
  const [status, setStatus] = useState<LicenseStatus | null>(cachedStatus);

  useEffect(() => {
    listeners.add(setStatus);
    // Kick off the fetch if it hasn't happened yet; the listener will
    // be notified once it resolves.
    if (!cachedStatus) {
      void fetchLicenseStatus();
    }
    return () => {
      listeners.delete(setStatus);
    };
  }, []);

  return status;
}

/**
 * Convenience: returns `true` when the deployment lacks a valid
 * Trustalo Enterprise (or developer) license. Use this to pre-disable
 * or relabel Enterprise-only affordances anywhere in the dashboard.
 *
 * Returns `false` while the first license-status fetch is in flight to
 * avoid a flicker on page load; the API-side 402 fallback covers the
 * rare case where the fetch fails but the user still hits a gated
 * endpoint.
 */
export function useEnterpriseGated(): boolean {
  const status = useLicenseStatus();
  if (status === null) return false;
  return !status.enterprise;
}

/**
 * Alias kept for AI-specific call sites that existed before the more
 * generic Enterprise gating was introduced. New code should prefer
 * `useEnterpriseGated()` so it reads consistently regardless of which
 * feature is being gated (AI, Trust Center, etc.).
 */
export function useAiGated(): boolean {
  return useEnterpriseGated();
}

// ─── Enterprise-required toast ────────────────────────────────────
//
// Click-triggered, auto-dismissing notice rendered when the user tries
// to use a gated AI action. The hook owns the visibility + feature
// label; the banner component owns the timer-driven dismiss.

export interface EnterpriseToastState {
  open: boolean;
  feature?: string;
  show: (feature?: string) => void;
  dismiss: () => void;
}

export function useEnterpriseToast(): EnterpriseToastState {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>();

  function show(nextFeature?: string) {
    setFeature(nextFeature);
    setOpen(true);
  }

  function dismiss() {
    setOpen(false);
  }

  return { open, feature, show, dismiss };
}

/**
 * Wraps an async AI action handler so that, when AI is gated, the click
 * pops the toast instead of invoking the handler. Use this for buttons
 * that would otherwise call a gated API endpoint.
 *
 * The wrapper also catches 402 / ENTERPRISE_LICENSE_* responses from
 * the action itself — handy when license state changes mid-session and
 * the cached `useAiGated()` value is stale.
 */
export function makeAiActionGuard(opts: {
  aiGated: boolean;
  toast: Pick<EnterpriseToastState, "show">;
  feature: string;
}) {
  return async function run<T>(fn: () => Promise<T> | T): Promise<T | undefined> {
    if (opts.aiGated) {
      opts.toast.show(opts.feature);
      return undefined;
    }
    try {
      return await fn();
    } catch (err) {
      if (isEnterpriseLicenseError(err)) {
        opts.toast.show(opts.feature);
        return undefined;
      }
      throw err;
    }
  };
}
