"use client";

// Landing page for redirect-based auth providers (Cognito Hosted UI, OIDC, ...).
// The IdP redirects the browser here with `?code=...&state=...`. We forward
// the entire query to the API's /auth/oauth/callback endpoint, which exchanges
// the code, verifies the ID token, finds-or-creates the User row, and mints
// Trustalo's own JWT. We store the token and bounce to the dashboard.

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const all: Record<string, string> = {};
    params.forEach((value, key) => {
      // Skip our own redirectUri echoes; the API rebuilds redirect_uri from
      // the explicit param we pass.
      if (key !== "redirectUri") all[key] = value;
    });

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
        window.location.href = "/dashboard";
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
