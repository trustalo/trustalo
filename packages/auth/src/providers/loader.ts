// Boot-time loader that resolves the single active auth provider.
//
// The host app (apps/api) provides factories for in-tree built-in providers,
// pre-wired with whatever dependencies they need (e.g. Prisma for `local`).
// External providers are loaded by dynamic `import()` and only see env vars,
// keeping third-party plugins decoupled from Trustalo internals.
//
// Resolution rules:
//   AUTH_PROVIDER=<id>       → builtins[<id>] must be supplied
//   AUTH_PROVIDER=external   → dynamic import of AUTH_EXTERNAL_PROVIDER
//   (unset)                  → defaults to "local"

import { AuthProviderConfigError, type AuthProvider, validateProvider } from "./types.js";

export type ProviderFactory = (
  env: Record<string, string | undefined>,
) => AuthProvider | Promise<AuthProvider>;

export interface LoaderOptions {
  env?: Record<string, string | undefined>;
  /**
   * Factory map for in-tree providers. The host curries any required deps
   * (e.g. Prisma client) before passing them in.
   */
  builtins: Record<string, ProviderFactory>;
  logger?: { info: (msg: string) => void };
}

const DEFAULT_PROVIDER_ID = "local";

/**
 * Resolves the active provider from environment variables.
 * Throws AuthProviderConfigError on misconfiguration so the host can fail
 * fast at startup instead of failing per-request later.
 */
export async function loadAuthProvider(options: LoaderOptions): Promise<AuthProvider> {
  const env = options.env ?? process.env;
  const logger = options.logger ?? { info: (msg) => console.log(msg) };
  const requested = (env.AUTH_PROVIDER ?? DEFAULT_PROVIDER_ID).trim().toLowerCase();

  let provider: AuthProvider;

  if (requested === "external") {
    provider = await loadExternalProvider(env);
  } else {
    const factory = options.builtins[requested];
    if (!factory) {
      const known = [...Object.keys(options.builtins), "external"].join(", ");
      throw new AuthProviderConfigError(
        `Unknown AUTH_PROVIDER="${requested}". Expected one of: ${known}.`,
      );
    }
    provider = await factory(env);
  }

  validateProvider(provider);

  const caps = describeCapabilities(provider.capabilities);
  logger.info(
    `[auth] Active provider: ${provider.id} (${provider.kind}${caps ? `, ${caps}` : ""})`,
  );

  return provider;
}

async function loadExternalProvider(
  env: Record<string, string | undefined>,
): Promise<AuthProvider> {
  const externalName = env.AUTH_EXTERNAL_PROVIDER?.trim();
  if (!externalName) {
    throw new AuthProviderConfigError(
      'AUTH_PROVIDER="external" requires AUTH_EXTERNAL_PROVIDER to be set ' +
        "to the npm package name of your provider plugin.",
    );
  }

  let mod: unknown;
  try {
    mod = await import(externalName);
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new AuthProviderConfigError(
      `Failed to load external auth provider "${externalName}": ${reason}. ` +
        `Did you install it (e.g. \`bun add ${externalName}\`)?`,
    );
  }

  const m = mod as {
    createProvider?: (
      env: Record<string, string | undefined>,
    ) => AuthProvider | Promise<AuthProvider>;
    provider?: AuthProvider;
    default?:
      | AuthProvider
      | ((env: Record<string, string | undefined>) => AuthProvider | Promise<AuthProvider>);
  };

  if (typeof m.createProvider === "function") {
    return await m.createProvider(env);
  }
  if (typeof m.default === "function") {
    return await (
      m.default as (env: Record<string, string | undefined>) => AuthProvider | Promise<AuthProvider>
    )(env);
  }
  if (m.provider) return m.provider;
  if (m.default && typeof m.default === "object") return m.default as AuthProvider;

  throw new AuthProviderConfigError(
    `External auth provider "${externalName}" must export one of: ` +
      `\`createProvider\` (factory), \`provider\` (object), or a default export.`,
  );
}

function describeCapabilities(caps: AuthProvider["capabilities"]): string {
  const parts: string[] = [];
  if (caps.register) parts.push("register");
  if (caps.resetPassword) parts.push("reset-password");
  if (caps.mfa) parts.push("mfa");
  if (caps.socialLogin) parts.push("social");
  return parts.join("+");
}
