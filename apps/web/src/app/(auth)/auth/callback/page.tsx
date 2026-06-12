"use client";

// Landing page for redirect-based auth providers (Cognito Hosted UI, OIDC, ...).
// The IdP redirects the browser here with `?code=...&state=...`. We forward
// the entire query to the API's /auth/oauth/callback endpoint, which exchanges
// the code, verifies the ID token, finds-or-creates the User row, and mints
// Trustalo's own JWT. We store the token and bounce to the dashboard.

import Link from "next/link";
import { takeNext } from "@/lib/post-login";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Whitelist the OAuth/OIDC callback parameters we forward to the
    // API. Anything else from window.location.search is dropped so an
    // attacker who controls the URL can't poison the `all` object with
    // arbitrary keys (CodeQL `js/remote-property-injection`).
    const ALLOWED_CALLBACK_PARAMS = [
      "code",
      "state",
      "error",
      "error_description",
      "error_uri",
      "session_state",
      "iss",
      "scope",
      "id_token",
      "access_token",
      "expires_in",
      "token_type",
    ] as const;
    const params = new URLSearchParams(window.location.search);
    const all: Record<string, string> = Object.create(null);
    for (const key of ALLOWED_CALLBACK_PARAMS) {
      const value = params.get(key);
      if (value !== null) all[key] = value;
    }

    if (all.error) {
      setError(`${all.error}: ${all.error_description ?? "no description"}`);
      return;
    }

    const redirectUri = `${window.location.origin}/auth/callback`;

    apiClient
      .completeOAuthFlow(all, redirectUri)
      .then((result) => {
        const token = (result as any).data?.token ?? (result as any).token;
        if (!token) throw new Error("API response did not include a token");
        apiClient.setToken(token);
        // Resolve the post-login target against our own origin and navigate
        // only if it stays same-origin (blocks open redirect / javascript: URLs).
        const dest = new URL(takeNext(), window.location.origin);
        window.location.href = dest.origin === window.location.origin ? dest.href : "/dashboard";
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Sign-in failed");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 dark:from-neutral-950 dark:to-neutral-900">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
        {error ? (
          <>
            <h2 className="text-lg font-medium text-red-700 dark:text-red-300">Sign-in failed</h2>
            <p className="break-words text-sm text-neutral-600 dark:text-neutral-400">{error}</p>
            <Link
              href="/login"
              className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
              Completing sign-in…
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              You&apos;ll be redirected to the dashboard in a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
