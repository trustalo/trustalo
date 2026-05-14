"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiClient, type AuthProviderDescriptor } from "@/lib/api-client";
import { AuthLayout } from "@/components/auth/auth-layout";
import { AuthErrorBanner, AuthField, AuthSubmitButton } from "@/components/auth/auth-form-controls";

export default function RegisterPage() {
  const [config, setConfig] = useState<AuthProviderDescriptor | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient.getAuthConfig().then(
      (res) => {
        if (!cancelled) setConfig(res.data);
      },
      () => {
        // Swallow: the form below will still try to register and surface
        // the actual API error if registration is disabled.
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  // Provider explicitly disables self-registration → show a clear message
  // (e.g. AUTH_PROVIDER=cognito or AUTH_LOCAL_ALLOW_REGISTRATION=false).
  const registrationDisabled =
    config !== null && (config.kind !== "credential" || config.capabilities.register === false);

  if (registrationDisabled && config) {
    return <RegistrationDisabled config={config} />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await apiClient.register({
        name,
        email,
        password,
        organizationName,
      });
      apiClient.setToken((result as any).data?.token ?? (result as any).token);
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Create your Trustalo workspace"
      subtitle="Spin up a workspace in under a minute. No credit card required."
      footer={
        <span>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <AuthErrorBanner>{error}</AuthErrorBanner>}

        <AuthField
          id="name"
          label="Full name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
        />

        <AuthField
          id="email"
          label="Work email"
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
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />

        <AuthField
          id="org"
          label="Organization name"
          type="text"
          autoComplete="organization"
          required
          value={organizationName}
          onChange={(e) => setOrganizationName(e.target.value)}
          placeholder="Acme Inc."
        />

        <AuthSubmitButton loading={loading} loadingLabel="Creating account…">
          Create account
        </AuthSubmitButton>

        <p className="pt-1 text-center text-xs text-neutral-400 dark:text-neutral-500">
          By creating an account you agree to our Terms of Service and Privacy Policy.
        </p>
      </form>
    </AuthLayout>
  );
}

// Shown when self-registration is disabled by the active provider —
// either because the provider is redirect-based (Cognito etc.) or because
// the local provider was started with AUTH_LOCAL_ALLOW_REGISTRATION=false.
function RegistrationDisabled({ config }: { config: AuthProviderDescriptor }) {
  const message =
    config.kind === "redirect"
      ? `Account creation is handled by ${config.displayName}. Sign in there to be auto-provisioned, or ask an administrator to invite you.`
      : "Self-registration is disabled. Ask an administrator to invite you.";

  return (
    <AuthLayout
      title="Registration unavailable"
      subtitle={message}
      footer={<span>Have an invite link? Use it to finish setting up your account.</span>}
    >
      <Link
        href="/login"
        className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-950"
      >
        Go to sign in
      </Link>
    </AuthLayout>
  );
}
