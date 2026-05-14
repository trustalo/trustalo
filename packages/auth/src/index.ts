export type { AuthPayload, TenantContext, AuthenticatedRequest, JwtConfig } from "./types.js";

export { signToken, verifyToken, decodeToken } from "./jwt.js";

export {
  authenticate,
  requireAuth,
  sessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "./middleware.js";

export {
  ROLE_PERMISSIONS,
  authorize,
  hasPermission,
  hasAnyPermission,
  getPermissionsForRole,
} from "./rbac.js";

export { extractTenantContext } from "./tenant.js";

// Pluggable auth provider contract — re-exported so plugins only need
// `@trustalo/auth` as a peer dependency.
export type {
  AuthProvider,
  ProviderKind,
  ProviderProfile,
  ProviderCapabilities,
  CredentialLoginInput,
  CredentialRegisterInput,
  RedirectStartResult,
  AdminInviteInput,
  AdminInviteResult,
} from "./providers/index.js";
export { AuthProviderConfigError, validateProvider, loadAuthProvider } from "./providers/index.js";
export type { ProviderFactory, LoaderOptions } from "./providers/index.js";
