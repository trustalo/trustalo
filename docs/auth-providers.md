# Authentication providers

Trustalo supports a single, pluggable authentication backend per deployment.
The active provider is selected at boot via the `AUTH_PROVIDER` environment
variable. Switching providers requires a restart.

| Mode                      | `AUTH_PROVIDER`     | Use case                                    |
| ------------------------- | ------------------- | ------------------------------------------- |
| Email + password (bcrypt) | `local` _(default)_ | Local development; small self-hosted setups |
| AWS Cognito Hosted UI     | `cognito`           | AWS deployments with MFA / social / SAML    |
| Self-hosted Keycloak      | `keycloak`          | On-prem / hybrid / OSS deployments          |
| Third-party plugin        | `external`          | OIDC, Okta, Auth0, custom                   |

The web app introspects the active provider via `GET /api/v1/auth/config` and
renders either the email/password form (credential providers) or a single
"Sign in with X" button (redirect providers).

---

## Quick start

### Local development (default)

Nothing to configure. The first user goes through `/register`, which creates
the bootstrap organization and gives them the `owner` role.

```env
AUTH_PROVIDER=local
AUTH_LOCAL_ALLOW_REGISTRATION=true   # set to false in production
```

### AWS Cognito Hosted UI

1. Create a Cognito User Pool. Enable any of:
   - Email + password (with optional MFA)
   - Social federation (Google, Facebook, Apple)
   - SAML / OIDC federation
2. Create an App Client. Recommended settings:
   - Allowed OAuth Flows: **Authorization code grant**
   - Allowed OAuth Scopes: `openid email profile`
   - Callback URL: `https://your-app.example.com/auth/callback`
   - Sign-out URL: `https://your-app.example.com/login`
   - Generate a client secret (recommended for confidential web apps).
3. Configure a Cognito Domain (`mycompany.auth.us-east-1.amazoncognito.com`).
4. Set environment variables on your API:
   ```env
   AUTH_PROVIDER=cognito
   COGNITO_REGION=us-east-1
   COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
   COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
   COGNITO_CLIENT_SECRET=...           # optional
   COGNITO_DOMAIN=mycompany.auth.us-east-1.amazoncognito.com
   ```
5. Grant the API's IAM role `cognito-idp:AdminCreateUser` if you want to use
   Trustalo's invitation flow (`POST /api/v1/auth/invite`).

That's it. Trustalo redirects unauthenticated users to Cognito, which handles
all credential collection, MFA prompts, and social-IdP federation. Trustalo
verifies the returned ID token, finds-or-creates a `User` row, and mints its
own JWT for downstream API calls.

### Keycloak

For self-hosted / on-prem deployments. Works against any Keycloak version 8+
because the provider uses OIDC discovery (`{realm}/.well-known/openid-configuration`)
to find endpoints rather than hardcoding paths.

1. **Create a realm** in Keycloak (e.g. `trustalo`) — or use an existing one.
2. **Create the Trustalo OIDC client**:
   - Client type: `OpenID Connect`
   - Client ID: `trustalo-web`
   - Client authentication: `On` (recommended) for confidential, or `Off` for public/PKCE-only
   - Standard flow: `On` (authorization code), Direct access grants: `Off`
   - Valid redirect URIs: `https://your-app.example.com/auth/callback`
   - Valid post logout redirect URIs: `https://your-app.example.com/login`
   - Web origins: `https://your-app.example.com`
3. _(Optional, for invitations)_ **Create an admin client** so Trustalo can call
   the Admin REST API:
   - Client ID: `trustalo-admin`
   - Client authentication: `On`, Service Accounts Roles: `On`
   - Service account roles tab → grant the realm-management role `manage-users`
4. Set environment variables on your API:
   ```env
   AUTH_PROVIDER=keycloak
   KEYCLOAK_BASE_URL=https://kc.example.com
   KEYCLOAK_REALM=trustalo
   KEYCLOAK_CLIENT_ID=trustalo-web
   KEYCLOAK_CLIENT_SECRET=...                # if confidential
   # Optional: enables /api/v1/auth/invite
   KEYCLOAK_ADMIN_CLIENT_ID=trustalo-admin
   KEYCLOAK_ADMIN_CLIENT_SECRET=...
   ```

The provider:

- Uses Authorization Code + PKCE (works for both public and confidential clients).
- Verifies ID tokens against the realm's JWKS.
- Validates `iss` matches `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}` and
  rejects discovery docs that advertise a different issuer.
- Caches the OIDC discovery document and JWKS for the process lifetime; restart
  the API after upgrading Keycloak.
- For invitations, creates the user via `POST /admin/realms/{realm}/users`
  with `requiredActions: [UPDATE_PASSWORD, VERIFY_EMAIL]` and triggers the
  Keycloak action-email so the invitee sets their own password.

### Third-party plugin

```env
AUTH_PROVIDER=external
AUTH_EXTERNAL_PROVIDER=@your-org/trustalo-auth-provider-okta
# Plus whatever env vars the chosen plugin documents.
```

`bun add @your-org/trustalo-auth-provider-okta` and restart the API. See
[Writing your own provider](#writing-your-own-provider) below.

---

## Architecture

```
                ┌──────────────────────┐
   ENV ────────▶│   loadAuthProvider   │──▶ exactly ONE AuthProvider
                └──────────────────────┘
                         │
                ┌────────┼──────────┬───────────────┐
                ▼        ▼          ▼               ▼
            local     cognito    keycloak     @your-org/...
        (credential) (redirect)  (redirect)    (anything)
```

- **One provider per process.** No multi-tenant per-org config, no per-user
  selection. Switching providers means restarting the API with new env vars
  (and migrating users; see [Switching providers](#switching-providers)).
- **`User` rows are owned by the API**, never by the plugin. Plugins return
  a `ProviderProfile { externalId, email, name?, emailVerified? }`; the API
  finds-or-creates the corresponding `User` and `Membership`.
- **Trustalo mints its own JWT** for downstream API calls regardless of
  provider. Middleware, RBAC, and tenant isolation are uniform.
- **Boot fails fast** on misconfiguration. If `AUTH_PROVIDER=cognito` but
  `COGNITO_USER_POOL_ID` is missing, the API exits with a clear error before
  binding the HTTP listener.

---

## The `AuthProvider` contract

A provider is a plain object exported from an npm package:

```typescript
import type { AuthProvider } from "@trustalo/auth";

export const provider: AuthProvider = {
  id: "my-idp",
  displayName: "My Identity Provider",
  kind: "redirect", // or "credential"
  capabilities: {
    register: false,
    resetPassword: true,
    mfa: true,
    socialLogin: false,
  },

  // ── kind: "credential" ────────────────────────────────────────────────
  async authenticate({ email, password }) {
    /* verify and return ProviderProfile */
  },
  async register({ email, password, name }) {
    /* optional, only if capabilities.register === true */
  },

  // ── kind: "redirect" ──────────────────────────────────────────────────
  async startRedirect({ state, nonce, redirectUri }) {
    return {
      authorizationUrl: "...", // where to send the browser
      state, // CSRF token (echoed back)
      callbackContext: { codeVerifier: "..." }, // PKCE / nonce / etc.
    };
  },
  async handleRedirectCallback({ params, callbackContext, redirectUri }) {
    /* verify the IdP's response and return ProviderProfile */
  },

  // ── optional ──────────────────────────────────────────────────────────
  async buildLogoutUrl({ payload, postLogoutRedirectUri }) {
    return "https://my-idp.example.com/logout?...";
  },
  async adminCreateUser({ email, name, role }) {
    return { externalId: "...", email, inviteEmailSent: true };
  },
};
```

### Lifecycle

1. **Boot** — the API calls `loadAuthProvider()`, which reads `AUTH_PROVIDER`,
   instantiates the matching plugin, validates the export shape, and caches
   the provider for the lifetime of the process.
2. **Login** — for credential providers, `POST /auth/login` calls
   `provider.authenticate({email, password})`. For redirect providers,
   `GET /auth/oauth/start` calls `provider.startRedirect()` and the browser
   is sent to the returned `authorizationUrl`.
3. **Callback** _(redirect only)_ — the IdP redirects back to
   `/auth/callback`, which forwards the query string to
   `GET /auth/oauth/callback`. The API calls
   `provider.handleRedirectCallback({params, callbackContext, redirectUri})`.
4. **Session** — the API finds-or-creates the `User` keyed by
   `(authProvider, externalId)`, falling back to verified-email match for
   invited users. It then mints a Trustalo JWT.
5. **Invite** — `POST /auth/invite` calls `provider.adminCreateUser()` if
   defined; otherwise the user row is pre-created and waits for the user to
   sign in via the IdP for the first time.
6. **Logout** — `POST /auth/logout` calls `provider.buildLogoutUrl()` if
   defined; the web app uses the URL to clear the IdP session before
   bouncing back to `/login`.

---

## Writing your own provider

The minimum viable redirect plugin (e.g. for Okta) is around 80 lines:

```typescript
// my-okta-provider/src/index.ts
import { createRemoteJWKSet, jwtVerify } from "jose";
import { AuthProviderConfigError, type AuthProvider } from "@trustalo/auth";

export function createProvider(env: Record<string, string | undefined>): AuthProvider {
  const required = (k: string) => {
    const v = env[k]?.trim();
    if (!v) throw new AuthProviderConfigError(`Missing env var ${k}`);
    return v;
  };

  const issuer = required("OKTA_ISSUER");
  const clientId = required("OKTA_CLIENT_ID");
  const clientSecret = env.OKTA_CLIENT_SECRET?.trim();
  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

  return {
    id: "okta",
    displayName: "Okta",
    kind: "redirect",
    capabilities: { register: false, resetPassword: true, mfa: true, socialLogin: true },

    async startRedirect({ state, nonce, redirectUri }) {
      const url = new URL(`${issuer}/v1/authorize`);
      url.searchParams.set("client_id", clientId);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("nonce", nonce);
      return { authorizationUrl: url.toString(), state };
    },

    async handleRedirectCallback({ params, redirectUri }) {
      const tokens = await fetch(`${issuer}/v1/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: params.code!,
          redirect_uri: redirectUri,
        }),
      }).then((r) => r.json());

      const { payload } = await jwtVerify(tokens.id_token, jwks, {
        issuer,
        audience: clientId,
      });

      return {
        externalId: payload.sub!,
        email: (payload.email as string).toLowerCase(),
        name: payload.name as string | undefined,
        emailVerified: payload.email_verified === true,
      };
    },
  };
}
```

Publish to npm, then anyone runs:

```bash
bun add @your-org/trustalo-auth-provider-okta
```

```env
AUTH_PROVIDER=external
AUTH_EXTERNAL_PROVIDER=@your-org/trustalo-auth-provider-okta
OKTA_ISSUER=https://yourorg.okta.com/oauth2/default
OKTA_CLIENT_ID=...
OKTA_CLIENT_SECRET=...
```

A working stub is at `examples/auth-provider-template/` — copy it as a
starting point.

### Versioning

The `AuthProvider` interface is treated as a public API. Adding optional
fields is non-breaking; renaming or removing fields requires a major version
bump for `@trustalo/auth` and every plugin that depends on it.

---

## Switching providers

The model is one provider per deployment, so switching is a one-way operation
that requires migrating existing users.

- **local → cognito**: each user must sign in to Cognito (auto-provisioned
  on first login if email matches an existing `local` row); their old
  `passwordHash` is ignored. You can delete the column once everyone has
  switched.
- **cognito → local**: existing users have no password. They must use the
  forgot-password flow (not yet implemented) or be re-invited.

We don't auto-migrate because credential ownership is intentionally a
trust-bounded handoff — admins should make the call explicitly.

---

## Security notes

- The OAuth `state` parameter is a short-lived signed JWT containing both
  the CSRF token and the PKCE `code_verifier`. It expires in 5 minutes.
- The signing key falls back to `JWT_SECRET` if `AUTH_OAUTH_STATE_SECRET`
  is unset — set it explicitly in production for crypto hygiene.
- The local provider runs a dummy bcrypt verify on missed lookups to
  prevent timing-based user enumeration.
- ID tokens from redirect providers are always verified against the IdP's
  JWKS with `iss`, `aud`, `exp`, and `nonce` checked.
