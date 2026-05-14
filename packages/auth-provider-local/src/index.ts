// @trustalo/auth-provider-local
//
// Built-in credential provider that authenticates against Trustalo's own
// `User.passwordHash` column using bcrypt. This is the default provider and
// is what every fresh local-development instance uses.
//
// Architecture note:
//   The provider is intentionally stateless w.r.t. user creation. It exposes:
//     • `authenticate(email,password)` — looks up the user via the injected
//       repository and verifies the bcrypt hash.
//     • `register(email,password,name)` — hashes the password and returns a
//       ProviderProfile carrying the new credential material on `.credential`
//       (typed `LocalCredential`). The API service is responsible for
//       persisting the User row inside its own Org+Membership transaction.
//
//   Keeping persistence in the API preserves transactional integrity and
//   means third-party providers (Cognito etc.) can never write directly to
//   the `User` table.

import {
  AuthProviderConfigError,
  type AuthProvider,
  type CredentialLoginInput,
  type CredentialRegisterInput,
  type ProviderProfile,
} from "@trustalo/auth";

/**
 * Minimal repository contract the local provider needs. apps/api injects a
 * Prisma-backed implementation. Tests can inject an in-memory stub.
 */
export interface LocalUserRepository {
  /**
   * Look up an existing user by email. Returns the credential record if the
   * user exists AND was created by the local provider; otherwise null.
   */
  findLocalUserByEmail(email: string): Promise<{
    externalId: string;
    email: string;
    name: string;
    passwordHash: string;
    emailVerified: boolean;
  } | null>;

  /** True if a user with this email already exists (regardless of provider). */
  emailExists(email: string): Promise<boolean>;
}

export interface LocalProviderOptions {
  /** Repository abstraction over the User table. Required. */
  repository: LocalUserRepository;
  /** Enables the public `/auth/register` endpoint for this provider. */
  allowRegistration?: boolean;
  /** bcrypt cost factor; defaults to 12. */
  bcryptCost?: number;
  /** Display name shown on the login page; defaults to "Email & Password". */
  displayName?: string;
}

/**
 * Credential material returned to the API on successful registration. The
 * API stores `passwordHash` on the freshly-created `User` row.
 */
export interface LocalCredential {
  kind: "local";
  passwordHash: string;
}

export class InvalidCredentialsError extends Error {
  readonly code = "INVALID_CREDENTIALS";
  readonly status = 401;
  constructor() {
    super("Invalid email or password");
  }
}

export class EmailAlreadyRegisteredError extends Error {
  readonly code = "EMAIL_ALREADY_REGISTERED";
  readonly status = 409;
  constructor(email: string) {
    super(`An account already exists for ${email}`);
  }
}

/** Factory matching the AUTH_PROVIDER builtin signature, but with deps. */
export function createLocalProvider(opts: LocalProviderOptions): AuthProvider {
  if (!opts.repository) {
    throw new AuthProviderConfigError(
      "@trustalo/auth-provider-local requires `repository` to be provided",
    );
  }

  const allowRegistration = opts.allowRegistration ?? true;
  const bcryptCost = opts.bcryptCost ?? 12;
  const displayName = opts.displayName ?? "Email & Password";

  const provider: AuthProvider = {
    id: "local",
    displayName,
    kind: "credential",
    capabilities: {
      register: allowRegistration,
      resetPassword: false,
      mfa: false,
      socialLogin: false,
    },

    async authenticate(input: CredentialLoginInput): Promise<ProviderProfile> {
      const { email, password } = input;
      const record = await opts.repository.findLocalUserByEmail(email.toLowerCase());

      // Always run a dummy verify against an unknown email to mitigate
      // user-enumeration timing differences. (Bun's verify is constant-time
      // per-comparison but skipping the lookup short-circuit reveals
      // existence; we run a bcrypt verify regardless.)
      if (!record) {
        await dummyVerify(password);
        throw new InvalidCredentialsError();
      }

      const ok = await Bun.password.verify(password, record.passwordHash);
      if (!ok) throw new InvalidCredentialsError();

      return {
        externalId: record.externalId,
        email: record.email,
        name: record.name,
        emailVerified: record.emailVerified,
      };
    },
  };

  if (allowRegistration) {
    provider.register = async (input: CredentialRegisterInput): Promise<ProviderProfile> => {
      const email = input.email.toLowerCase();
      if (await opts.repository.emailExists(email)) {
        throw new EmailAlreadyRegisteredError(email);
      }

      const passwordHash = await Bun.password.hash(input.password, {
        algorithm: "bcrypt",
        cost: bcryptCost,
      });

      const credential: LocalCredential = { kind: "local", passwordHash };

      return {
        externalId: email,
        email,
        name: input.name,
        emailVerified: false,
        // The API persists this on the freshly-created User row. Other
        // provider plugins do not produce or consume `raw` for credential
        // material; this is local-specific by convention.
        raw: { credential },
      };
    };
  }

  return provider;
}

/**
 * Pull the local credential material out of a ProviderProfile produced by
 * `register()`. Returns null if the profile did not come from this provider.
 */
export function extractLocalCredential(profile: ProviderProfile): LocalCredential | null {
  const raw = profile.raw as { credential?: LocalCredential } | undefined;
  if (!raw?.credential || raw.credential.kind !== "local") return null;
  return raw.credential;
}

async function dummyVerify(password: string): Promise<void> {
  // Constant-time-ish dummy bcrypt verify. The hash below is a real bcrypt
  // hash of an unguessable secret produced once and committed; we never
  // accept this password anywhere.
  const DUMMY_HASH = "$2b$12$abcdefghijklmnopqrstuO9R3aL8rH6X4Q.8yY6P3hT/3aE9jJ7K2";
  try {
    await Bun.password.verify(password, DUMMY_HASH);
  } catch {
    // ignore
  }
}
