/**
 * Click-triggered, auto-dismissing notice for AI actions that require a
 * Trustalo Enterprise license. Rendered transiently when the user
 * attempts a gated action; not a persistent inline gate.
 *
 * Behavior:
 *   - Renders only while the parent passes `open`.
 *   - Auto-dismisses after `autoDismissMs` (default 5s) via `onClose`.
 *   - User can dismiss earlier via the X button.
 *
 * Visual style matches the original amber notice so it still reads as
 * "you need to upgrade" rather than a generic toast.
 */

"use client";

import { useEffect } from "react";
import { ENTERPRISE_REQUIRED_MESSAGE } from "@/lib/enterprise-license";

interface Props {
  /** When false the banner is unmounted. */
  open: boolean;
  /** Called by the X button and by the auto-dismiss timer. */
  onClose: () => void;
  /** Short context shown above the standard message, e.g. "AI risk scoring". */
  feature?: string;
  /** Auto-dismiss duration in ms. Defaults to 5000. */
  autoDismissMs?: number;
}

export function EnterpriseRequiredBanner({ open, onClose, feature, autoDismissMs = 5000 }: Props) {
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(onClose, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [open, autoDismissMs, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-700/60 dark:bg-amber-950/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {feature ? `${feature} — Enterprise feature` : "Enterprise feature"}
          </div>
          <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/90">
            {ENTERPRISE_REQUIRED_MESSAGE}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href="mailto:sales@trustalo.com?subject=Trustalo%20Enterprise%20License"
            className="rounded-md border border-amber-400 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
          >
            Contact sales
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="rounded-md p-1 text-amber-800 hover:bg-amber-100 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
