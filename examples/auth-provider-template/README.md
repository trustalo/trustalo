# Trustalo auth provider — starter template

Copy this directory as the basis of your own Trustalo authentication plugin. The whole contract is described in [`docs/auth-providers.md`](../../docs/auth-providers.md).

## Usage

1. Rename `package.json` → `name`.
2. Edit `src/index.ts`:
   - Change `id` and `displayName`.
   - Replace `authenticate` (credential provider) or implement `startRedirect` + `handleRedirectCallback` (redirect provider).
3. `npm publish` (or use `bun link` for local development).
4. In a Trustalo deployment:
   ```env
   AUTH_PROVIDER=external
   AUTH_EXTERNAL_PROVIDER=<your-package-name>
   ```

The Trustalo API will dynamically import your package at boot, validate the shape of the exported provider, and use it for all authentication flows.
