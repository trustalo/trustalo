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
} from "./types.js";

export { AuthProviderConfigError, validateProvider } from "./types.js";
export { loadAuthProvider } from "./loader.js";
export type { ProviderFactory, LoaderOptions } from "./loader.js";
