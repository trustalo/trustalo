"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiClient, type AuthProviderDescriptor } from "@/lib/api-client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthErrorBanner, AuthField, AuthSubmitButton } from "@/components/auth/auth-form-controls";

export default function LoginPage() {
  const [config, setConfig] = useState<AuthProviderDescriptor | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiClient
      .getAuthConfig()
      .then((res) => {
        if (cancelled) return;
        setConfig(res.data);
      })
      .catch((err) => {
        if (cancelled) return;
        setConfigError(err instanceof Error ? err.message : "Could not load auth configuration");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Footer toggles between sign-up CTA and a neutral message depending on
  // whether the active provider supports self-service registration.
  const footer =
    config?.kind === "credential" && config.capabilities.register ? (
      <span>
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
          Create one
        </Link>
      </span>
    ) : config?.kind === "redirect" ? (
      <span>New here? Accounts are auto-provisioned by {config.displayName} on first sign-in.</span>
    ) : null;

  return (
    <AuthLayout
      title="Sign in to Trustalo"
      subtitle="Welcome back. Pick up where you left off across every framework."
      footer={footer}
    >
      {configError && <AuthErrorBanner>{configError}</AuthErrorBanner>}

      {!config && !configError && <ConfigSkeleton />}

      {config?.kind === "credential" && <CredentialLoginForm config={config} />}
      {config?.kind === "redirect" && <RedirectLoginButton config={config} />}
    </AuthLayout>
  );
}

function ConfigSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-9 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      <div className="h-9 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      <div className="h-10 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-700" />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Credential providers (local, LDAP, ...)
// ──────────────────────────────────────────────────────────────────────────

function CredentialLoginForm({ config }: { config: AuthProviderDescriptor }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await apiClient.login(email, password);
      apiClient.setToken((result as any).data?.token ?? (result as any).token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  void config; // reserved for future provider-specific tweaks (e.g. SSO hint)

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <AuthErrorBanner>{error}</AuthErrorBanner>}

      <AuthField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
      />

      <AuthField
        id="password"
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        trailingLabel={
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-xs font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        }
      />

      <AuthSubmitButton loading={loading} loadingLabel="Signing in…">
        Sign in
      </AuthSubmitButton>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Redirect providers (Cognito, OIDC, SAML, ...)
// ──────────────────────────────────────────────────────────────────────────

function RedirectLoginButton({ config }: { config: AuthProviderDescriptor }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const res = await apiClient.startOAuthFlow(redirectUri);
      window.location.href = res.data.authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start sign-in");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <AuthErrorBanner>{error}</AuthErrorBanner>}

      <button
        type="button"
        onClick={handleSignIn}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-neutral-950"
      >
        {loading ? "Redirecting…" : `Continue with ${config.displayName}`}
        {!loading && (
          <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L13.586 11H4a1 1 0 110-2h9.586l-3.293-3.293a1 1 0 010-1.414Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>

      <p className="text-center text-xs text-neutral-500 dark:text-neutral-400">
        You&apos;ll be redirected to {config.displayName} to authenticate
        {config.capabilities.mfa ? " (MFA enabled)" : ""}.
      </p>
    </div>
  );
}
