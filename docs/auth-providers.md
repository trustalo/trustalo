# Authentication providers

Trustalo supports a single, pluggable authentication backend per deployment. The active provider is selected at boot via the `AUTH_PROVIDER` environment variable. Switching providers requires a restart.

| Mode                      | `AUTH_PROVIDER`     | Use case                                    |
| ------------------------- | ------------------- | ------------------------------------------- |
| Email + password (bcrypt) | `local` _(default)_ | Local development; small self-hosted setups |
| AWS Cognito Hosted UI     | `cognito`           | AWS deployments with MFA / social / SAML    |
| Google OAuth 2.0          | `google`            | Google Workspace / consumer Google accounts |
| Microsoft Entra ID        | `microsoft`         | Microsoft 365 / Entra single-tenant or B2B  |
| Self-hosted Keycloak      | `keycloak`          | On-prem / hybrid / OSS deployments          |
| Third-party plugin        | `external`          | OIDC, Okta, Auth0, custom                   |

The web app introspects the active provider via `GET /api/v1/auth/config` and renders either the email/password form (credential providers) or a single "Sign in with X" button (redirect providers).

---

## Quick start

### Local development (default)

Nothing to configure. The first user goes through `/register`, which creates the bootstrap organization and gives them the `owner` role.

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
5. Grant the API's IAM role `cognito-idp:AdminCreateUser` if you want to use Trustalo's invitation flow (`POST /api/v1/auth/invite`).

Provider-side checklist:

- In **App integration > App client settings**, ensure:
  - Authorization code grant is enabled
  - Callback URL includes `https://your-app.example.com/auth/callback`
  - Sign-out URL includes `https://your-app.example.com/login`
  - Scopes include at least `openid`, `email`, `profile`
- If using social login, configure each upstream IdP under **Sign-in experience > Federated identity providers** and enable the provider for your app client.

Where env values come from:

- `COGNITO_REGION`: User Pool region (`us-east-1`, etc.) shown in the console and pool ARN.
- `COGNITO_USER_POOL_ID`: User Pool overview ("Pool ID", e.g. `us-east-1_xxxxxxxxx`).
- `COGNITO_CLIENT_ID`: App client details ("Client ID").
- `COGNITO_CLIENT_SECRET`: App client details ("Client secret"), if generated.
- `COGNITO_DOMAIN`: User Pool domain host in **App integration > Domain**. Use host only (no `https://`), e.g. `mycompany.auth.us-east-1.amazoncognito.com`.

That's it. Trustalo redirects unauthenticated users to Cognito, which handles all credential collection, MFA prompts, and social-IdP federation. Trustalo verifies the returned ID token, finds-or-creates a `User` row, and mints its own JWT for downstream API calls.

### Google OAuth

1. Create an OAuth client in Google Cloud Console:
   - Configure the OAuth consent screen first (internal/external app type).
   - Application type: **Web application**
   - Authorized redirect URI: `https://your-app.example.com/auth/callback`
2. Set environment variables on your API:
   ```env
   AUTH_PROVIDER=google
   GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=...             # optional for public clients
   GOOGLE_SCOPES=openid email profile   # optional
   GOOGLE_HOSTED_DOMAIN=company.com     # optional: restrict to Workspace domain
   GOOGLE_MFA_ENABLED=true              # optional: descriptor hint only
   ```

Provider-side checklist:

- In **APIs & Services > OAuth consent screen**, publish the app (or add test users) before production login testing.
- In **Credentials > OAuth 2.0 Client IDs**, ensure redirect URI exactly matches Trustalo callback URL.
- If your Google Workspace requires domain restriction, use one Workspace domain and set `GOOGLE_HOSTED_DOMAIN` accordingly.

Where env values come from:

- `GOOGLE_CLIENT_ID`: OAuth client details ("Client ID").
- `GOOGLE_CLIENT_SECRET`: OAuth client details ("Client secret"), if created.
- `GOOGLE_HOSTED_DOMAIN`: Your Google Workspace primary domain (Admin Console > Account > Domains), optional.
- `GOOGLE_SCOPES`: Usually `openid email profile` unless your security policy requires fewer/more scopes.
- `GOOGLE_MFA_ENABLED`: Manual flag for Trustalo UI descriptor only. Set true if your Google org enforces 2-step verification.

The Google provider uses OIDC discovery + Authorization Code + PKCE, verifies the returned ID token against Google's JWKS, validates audience/issuer/nonce, then maps the result into Trustalo's `User` model.

### Microsoft Entra ID

1. Register an app in Microsoft Entra admin center:
   - Platform: **Web**
   - Redirect URI: `https://your-app.example.com/auth/callback`
   - Add `openid`, `profile`, and `email` delegated permissions
2. Set environment variables on your API:
   ```env
   AUTH_PROVIDER=microsoft
   MICROSOFT_TENANT_ID=organizations    # or tenant GUID, common, consumers
   MICROSOFT_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   MICROSOFT_CLIENT_SECRET=...          # optional for public clients
   MICROSOFT_SCOPES=openid email profile User.Read
   MICROSOFT_MFA_ENABLED=true           # optional: descriptor hint only
   ```

Provider-side checklist:

- In **App registrations > Authentication**, add a **Web** redirect URI: `https://your-app.example.com/auth/callback`.
- In **App registrations > API permissions**, add delegated OIDC permissions: `openid`, `profile`, `email` (and `User.Read` if you keep the default scope string).
- In **App registrations > Certificates & secrets**, create a client secret for confidential deployments.
- Set Supported account types according to tenant strategy:
  - single tenant (recommended for internal org-only sign-in)
  - multitenant via `organizations` or `common`
  - consumer-only via `consumers`

Where env values come from:

- `MICROSOFT_TENANT_ID`: Directory (tenant) ID from app overview, or one of `common`, `organizations`, `consumers`.
- `MICROSOFT_CLIENT_ID`: Application (client) ID from app overview.
- `MICROSOFT_CLIENT_SECRET`: Secret value from Certificates & secrets.
- `MICROSOFT_SCOPES`: Usually `openid email profile User.Read`.
- `MICROSOFT_MFA_ENABLED`: Manual flag for Trustalo UI descriptor only. Set true if Conditional Access / MFA policies are enforced.

The Microsoft provider uses the v2 endpoint (`/oauth2/v2.0`), OIDC discovery, Authorization Code + PKCE, and validates token signature/audience/issuer before creating a Trustalo session.

### Keycloak

For self-hosted / on-prem deployments. Works against any Keycloak version 8+ because the provider uses OIDC discovery (`{realm}/.well-known/openid-configuration`) to find endpoints rather than hardcoding paths.

1. **Create a realm** in Keycloak (e.g. `trustalo`) — or use an existing one.
2. **Create the Trustalo OIDC client**:
   - Client type: `OpenID Connect`
   - Client ID: `trustalo-web`
   - Client authentication: `On` (recommended) for confidential, or `Off` for public/PKCE-only
   - Standard flow: `On` (authorization code), Direct access grants: `Off`
   - Valid redirect URIs: `https://your-app.example.com/auth/callback`
   - Valid post logout redirect URIs: `https://your-app.example.com/login`
   - Web origins: `https://your-app.example.com`
3. _(Optional, for invitations)_ **Create an admin client** so Trustalo can call the Admin REST API:
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

Provider-side checklist:

- In **Realm settings**, confirm realm name and realm base URL.
- In **Clients > trustalo-web**:
  - Standard flow enabled
  - Redirect URI includes `https://your-app.example.com/auth/callback`
  - Post-logout redirect includes `https://your-app.example.com/login`
  - If confidential client, enable client authentication and keep secret safe
- If using invites:
  - Create `trustalo-admin` confidential client
  - Enable Service Accounts
  - Grant `realm-management` role `manage-users` (and preferably `view-users`)

Where env values come from:

- `KEYCLOAK_BASE_URL`: Keycloak server origin (scheme + host), e.g. `https://kc.example.com`.
- `KEYCLOAK_REALM`: Realm name from Realm settings.
- `KEYCLOAK_CLIENT_ID`: OIDC client ID for Trustalo login app.
- `KEYCLOAK_CLIENT_SECRET`: Client secret for confidential clients.
- `KEYCLOAK_ADMIN_CLIENT_ID`: Admin service client ID for invite flow.
- `KEYCLOAK_ADMIN_CLIENT_SECRET`: Admin service client secret for invite flow.

The provider:

- Uses Authorization Code + PKCE (works for both public and confidential clients).
- Verifies ID tokens against the realm's JWKS.
- Validates `iss` matches `${KEYCLOAK_BASE_URL}/realms/${KEYCLOAK_REALM}` and rejects discovery docs that advertise a different issuer.
- Caches the OIDC discovery document and JWKS for the process lifetime; restart the API after upgrading Keycloak.
- For invitations, creates the user via `POST /admin/realms/{realm}/users` with `requiredActions: [UPDATE_PASSWORD, VERIFY_EMAIL]` and triggers the Keycloak action-email so the invitee sets their own password.

### Third-party plugin

```env
AUTH_PROVIDER=external
AUTH_EXTERNAL_PROVIDER=@your-org/trustalo-auth-provider-okta
# Plus whatever env vars the chosen plugin documents.
```

`bun add @your-org/trustalo-auth-provider-okta` and restart the API. See [Writing your own provider](#writing-your-own-provider) below.

---

## Directory sync (Entra + Google Workspace)

Trustalo can optionally sync directory users into tenant memberships from the **General Settings -> Directory Sync** card.

- Sync is **tenant-scoped** and **Enterprise-gated** (`sso` feature).
- Supported frequencies are **24h** and **7d** only (plus manual `Sync now`).
- Synced users are provisioned into `User` + `Membership` rows with configurable default role/status.

### Entra ID credentials

Provide these values in the UI:

- `tenantId` (Directory tenant ID)
- `clientId` (Application ID)
- `clientSecret` (Certificates & secrets)

Required Microsoft Graph **application** permissions:

- `User.Read.All`
- `GroupMember.Read.All` (required when group-to-role mapping is enabled)

Grant **admin consent** for the app before testing the connection.

### Google Workspace credentials

Provide these values in the UI:

- `serviceAccountJson` (full service-account key JSON)
- `adminEmail` (super-admin account used for domain-wide delegation impersonation)

Required domain-wide delegation scopes:

- `https://www.googleapis.com/auth/admin.directory.user.readonly`
- `https://www.googleapis.com/auth/admin.directory.group.readonly`
- `https://www.googleapis.com/auth/admin.directory.group.member.readonly`

### Credential storage

Directory-sync credentials are encrypted at rest using `apps/api/src/lib/crypto-envelope.ts` (`enc:v1:` envelope) before persistence.

---

## Architecture

```
                ┌──────────────────────┐
   ENV ────────▶│   loadAuthProvider   │──▶ exactly ONE AuthProvider
                └──────────────────────┘
                         │
         ┌───────┼──────────┬──────────┬──────────┬───────────────┐
         ▼       ▼          ▼          ▼          ▼               ▼
      local   cognito    keycloak    google   microsoft    @your-org/...
   (credential) (redirect) (redirect) (redirect) (redirect)  (anything)
```

- **One provider per process.** No multi-tenant per-org config, no per-user selection. Switching providers means restarting the API with new env vars (and migrating users; see [Switching providers](#switching-providers)).
- **`User` rows are owned by the API**, never by the plugin. Plugins return a `ProviderProfile { externalId, email, name?, emailVerified? }`; the API finds-or-creates the corresponding `User` and `Membership`.
- **Trustalo mints its own JWT** for downstream API calls regardless of provider. Middleware, RBAC, and tenant isolation are uniform.
- **Boot fails fast** on misconfiguration. If `AUTH_PROVIDER=cognito` but `COGNITO_USER_POOL_ID` is missing, the API exits with a clear error before binding the HTTP listener.

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

1. **Boot** — the API calls `loadAuthProvider()`, which reads `AUTH_PROVIDER`, instantiates the matching plugin, validates the export shape, and caches the provider for the lifetime of the process.
2. **Login** — for credential providers, `POST /auth/login` calls `provider.authenticate({email, password})`. For redirect providers, `GET /auth/oauth/start` calls `provider.startRedirect()` and the browser is sent to the returned `authorizationUrl`.
3. **Callback** _(redirect only)_ — the IdP redirects back to `/auth/callback`, which forwards the query string to `GET /auth/oauth/callback`. The API calls `provider.handleRedirectCallback({params, callbackContext, redirectUri})`.
4. **Session** — the API finds-or-creates the `User` keyed by `(authProvider, externalId)`, falling back to verified-email match for invited users. It then mints a Trustalo JWT.
5. **Invite** — `POST /auth/invite` calls `provider.adminCreateUser()` if defined; otherwise the user row is pre-created and waits for the user to sign in via the IdP for the first time.
6. **Logout** — `POST /auth/logout` calls `provider.buildLogoutUrl()` if defined; the web app uses the URL to clear the IdP session before bouncing back to `/login`.

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
    capabilities: {
      register: false,
      resetPassword: true,
      mfa: true,
      socialLogin: true,
    },

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

A working stub is at `examples/auth-provider-template/` — copy it as a starting point.

### Versioning

The `AuthProvider` interface is treated as a public API. Adding optional fields is non-breaking; renaming or removing fields requires a major version bump for `@trustalo/auth` and every plugin that depends on it.

---

## Switching providers

The model is one provider per deployment, so switching is a one-way operation that requires migrating existing users.

- **local → cognito**: each user must sign in to Cognito (auto-provisioned on first login if email matches an existing `local` row); their old `passwordHash` is ignored. You can delete the column once everyone has switched.
- **cognito → local**: existing users have no password. They must use the forgot-password flow (not yet implemented) or be re-invited.

We don't auto-migrate because credential ownership is intentionally a trust-bounded handoff — admins should make the call explicitly.

---

## Security notes

- The OAuth `state` parameter is a short-lived signed JWT containing both the CSRF token and the PKCE `code_verifier`. It expires in 5 minutes.
- The signing key falls back to `JWT_SECRET` if `AUTH_OAUTH_STATE_SECRET` is unset — set it explicitly in production for crypto hygiene.
- The local provider runs a dummy bcrypt verify on missed lookups to prevent timing-based user enumeration.
- ID tokens from redirect providers are always verified against the IdP's JWKS with `iss`, `aud`, `exp`, and `nonce` checked.
