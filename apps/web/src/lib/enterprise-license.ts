/**
 * Helpers for Enterprise-license-gated UX on the client.
 *
 * The API returns HTTP 402 with an error code of the form
 * `ENTERPRISE_LICENSE_*` when an Enterprise-only feature is invoked
 * without a valid Enterprise license (see
 * `apps/api/src/middleware/error-handler.ts`).
 *
 * UX policy: show a transient inline notice (5s auto-dismiss, also
 * closable via the X) right at the surface the user just interacted
 * with. Buttons themselves stay enabled — clicking a gated action is
 * what triggers the notice, so users always see *why* nothing
 * happened. Combine `useEnterpriseGated()` (proactive predicate) with
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

// ─── License status (module-internal) ─────────────────────────────
//
// Fetched once per browser session and cached at module scope so the
// many EE-gated surfaces in the dashboard don't each hit the API on
// every mount. The first subscriber triggers the fetch; subsequent
// subscribers reuse the resolved value synchronously after it
// settles. Components consume the derived `useEnterpriseGated()`
// boolean rather than the raw status, so `useLicenseStatus` stays
// module-internal.

type Listener = (status: LicenseStatus | null) => void;

let cachedStatus: LicenseStatus | null = null;
let inflight: Promise<LicenseStatus | null> | null = null;
const listeners = new Set<Listener>();

function notify(): void {
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
      // Network/auth failure: don't crash the UI, just leave gated
      // controls enabled and let the 402 fallback path render the
      // notice. We intentionally do not cache failures so a later
      // mount retries.
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

function useLicenseStatus(): LicenseStatus | null {
  const [status, setStatus] = useState<LicenseStatus | null>(cachedStatus);

  useEffect(() => {
    listeners.add(setStatus);
    // Kick off the fetch if it hasn't happened yet; the listener
    // will be notified once it resolves.
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
 * Returns `true` when the deployment lacks a valid Trustalo Enterprise
 * (or developer-tier) license. Use this anywhere in the dashboard to
 * pre-disable or relabel Enterprise-only affordances.
 *
 * Returns `false` while the first license-status fetch is in flight
 * to avoid a flicker on page load; the API-side 402 fallback covers
 * the rare case where the fetch fails but the user still hits a
 * gated endpoint.
 */
export function useEnterpriseGated(): boolean {
  const status = useLicenseStatus();
  if (status === null) return false;
  return !status.enterprise;
}

// ─── Enterprise-required toast (module-internal state shape) ──────
//
// Click-triggered, auto-dismissing notice rendered when the user
// tries to use a gated action. The hook owns visibility + feature
// label; `<EnterpriseRequiredBanner />` owns the timer-driven
// dismiss.

interface EnterpriseToastState {
  open: boolean;
  feature?: string;
  show: (feature: string) => void;
  dismiss: () => void;
}

export function useEnterpriseToast(): EnterpriseToastState {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>();

  function show(nextFeature: string): void {
    setFeature(nextFeature);
    setOpen(true);
  }

  function dismiss(): void {
    setOpen(false);
  }

  return { open, feature, show, dismiss };
}
