// Loads the single active auth provider for this API process.
//
// This is the only file in the API that knows how to wire each built-in
// provider's dependencies. Everything downstream (router, service, middleware)
// only sees the abstract `AuthProvider` interface.

import { loadAuthProvider, type AuthProvider, type ProviderFactory } from "@trustalo/auth";
import { createLocalProvider, type LocalUserRepository } from "@trustalo/auth-provider-local";
import { createProvider as createCognitoProvider } from "@trustalo/auth-provider-cognito";
import { createProvider as createKeycloakProvider } from "@trustalo/auth-provider-keycloak";
import { prisma } from "../../db/prisma.js";

/**
 * Prisma-backed implementation of the local provider's user repository.
 * Returns null when the email belongs to a non-local provider account, so
 * the local provider cannot accidentally authenticate a Cognito user.
 */
const localRepository: LocalUserRepository = {
  async findLocalUserByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || user.authProvider !== "local") {
      return null;
    }
    return {
      externalId: user.externalId ?? user.email,
      email: user.email,
      name: user.name,
      passwordHash: user.passwordHash,
      emailVerified: user.emailVerified,
    };
  },

  async emailExists(email) {
    const count = await prisma.user.count({ where: { email } });
    return count > 0;
  },
};

const builtins: Record<string, ProviderFactory> = {
  local: (env) =>
    createLocalProvider({
      repository: localRepository,
      // Default ON for local; set AUTH_LOCAL_ALLOW_REGISTRATION=false in
      // production to disable public sign-up.
      allowRegistration: env.AUTH_LOCAL_ALLOW_REGISTRATION !== "false",
    }),
  cognito: (env) => createCognitoProvider(env),
  keycloak: (env) => createKeycloakProvider(env),
};

let cached: AuthProvider | null = null;

/**
 * Returns the active provider, loading it on first call. Subsequent calls
 * return the cached instance. Throws AuthProviderConfigError on misconfig.
 */
export async function getActiveAuthProvider(): Promise<AuthProvider> {
  if (cached) return cached;
  cached = await loadAuthProvider({
    builtins,
    logger: { info: (msg) => console.log(msg) },
  });
  return cached;
}

/** Reset the cache. Tests only. */
export function __resetAuthProviderForTests(): void {
  cached = null;
}
