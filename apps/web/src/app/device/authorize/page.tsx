"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthErrorBanner } from "@/components/auth/auth-form-controls";

/**
 * Device-agent browser sign-in — the consent step.
 *
 * The agent opens this page with `state`, `challenge` (PKCE), and `redirect_uri`
 * (a trustalo:// deep link). If the visitor isn't signed in we bounce them
 * through /login?next=… (so password OR SSO happens here in the browser), then
 * return. On "Authorize" we mint a single-use code and deep-link it back to the
 * waiting agent.
 */
type Phase = "loading" | "consent" | "sent" | "error";

interface DeviceParams {
  state: string;
  challenge: string;
  redirectUri: string;
}

/**
 * The redirect target must be the agent's `trustalo://` deep link or a loopback
 * http URL — mirrors the server's `assertAllowedDeviceRedirect`. This blocks a
 * crafted `redirect_uri` (e.g. `javascript:…` or a cross-origin `https:` URL)
 * from ever reaching `window.location.href` / an `<a href>` (XSS + open
 * redirect). The server enforces the same rule; this is the client-side half.
 */
function isAllowedDeviceRedirect(uri: string): boolean {
  let u: URL;
  try {
    u = new URL(uri);
  } catch {
    return false;
  }
  if (u.protocol === "trustalo:") return true;
  return u.protocol === "http:" && (u.hostname === "127.0.0.1" || u.hostname === "localhost");
}

export default function DeviceAuthorizePage() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [params, setParams] = useState<DeviceParams | null>(null);
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState<string>("");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const state = q.get("state") ?? "";
    const challenge = q.get("challenge") ?? "";
    const redirectUri = q.get("redirect_uri") ?? "";

    if (!state || !challenge || !redirectUri) {
      setError("This device sign-in link is missing required parameters.");
      setPhase("error");
      return;
    }
    if (!isAllowedDeviceRedirect(redirectUri)) {
      setError("This device sign-in link has an invalid redirect URI.");
      setPhase("error");
      return;
    }
    setParams({ state, challenge, redirectUri });

    if (!apiClient.isAuthenticated()) {
      const next = `/device/authorize${window.location.search}`;
      window.location.href = `/login?next=${encodeURIComponent(next)}`;
      return;
    }

    apiClient
      .getMe()
      .then((r) => {
        const u = (r as { user?: { email?: string }; data?: { user?: { email?: string } } }) ?? {};
        setEmail(u.user?.email ?? u.data?.user?.email ?? "");
      })
      .catch(() => {});
    setPhase("consent");
  }, []);

  async function authorize() {
    // Re-validate at the sink: params.redirectUri feeds window.location.href and
    // the <a href> on the "sent" screen, so guard it again here (defence in
    // depth — the agent deep link is the only allowed target).
    if (!params || !isAllowedDeviceRedirect(params.redirectUri)) {
      setError("This device sign-in link has an invalid redirect URI.");
      setPhase("error");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await apiClient.deviceAuthorize({
        state: params.state,
        codeChallenge: params.challenge,
        redirectUri: params.redirectUri,
      });
      // Build the deep link entirely from the SERVER response: the API
      // re-validated redirect_uri (assertAllowedDeviceRedirect) and echoes it +
      // state back, so the redirect target is server-controlled and no
      // window.location value flows into window.location.href / the <a href>.
      const sep = res.data.redirectUri.includes("?") ? "&" : "?";
      const back = `${res.data.redirectUri}${sep}code=${encodeURIComponent(
        res.data.code,
      )}&state=${encodeURIComponent(res.data.state)}`;
      setCallbackUrl(back);
      setPhase("sent");
      // Deep-link to the agent. Browsers may require the click below for custom
      // schemes, so we also render it as a button on the "sent" screen.
      window.location.href = back;
    } catch (e) {
      setError((e as Error)?.message || "Authorization failed");
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Authorize this computer"
      subtitle="A Trustalo device agent on this machine is requesting to sign in."
    >
      {phase === "loading" && (
        <div className="space-y-3" aria-hidden>
          <div className="h-10 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
          <div className="h-10 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
        </div>
      )}

      {phase === "error" && <AuthErrorBanner>{error}</AuthErrorBanner>}

      {phase === "consent" && (
        <div className="space-y-5">
          {error && <AuthErrorBanner>{error}</AuthErrorBanner>}
          <p className="text-sm text-neutral-600 dark:text-neutral-300">
            The Trustalo device agent wants to enroll this computer and report its security posture
            {email ? (
              <>
                {" "}
                as{" "}
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{email}</span>
              </>
            ) : null}
            . Only authorize if you started this from the agent on this machine.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={authorize}
              disabled={busy}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? "Authorizing…" : "Authorize this computer"}
            </button>
            <a
              href="/dashboard"
              className="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
            >
              Cancel
            </a>
          </div>
        </div>
      )}

      {phase === "sent" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
            Sent to the device agent. You can return to the app — it will finish signing in
            automatically. You may close this tab.
          </div>
          {isAllowedDeviceRedirect(callbackUrl) && (
            <a
              href={callbackUrl}
              className="block w-full rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
            >
              Open the Trustalo Device Agent
            </a>
          )}
          <details className="text-xs text-neutral-500">
            <summary className="cursor-pointer">Agent didn&apos;t open?</summary>
            <p className="mt-2">
              If the desktop app didn&apos;t register the <code>trustalo://</code> handler (e.g. a
              local dev build), copy this link and run it with the agent&apos;s{" "}
              <code>handle-url</code> command:
            </p>
            <pre className="mt-2 overflow-x-auto rounded bg-neutral-100 p-2 dark:bg-neutral-800">
              {callbackUrl}
            </pre>
          </details>
        </div>
      )}
    </AuthLayout>
  );
}
