export {
  ManifestSchema,
  CheckSchema,
  CapabilitySchema,
  ConfigFieldSchema,
  FrameworkRefSchema,
  HttpCheckSpecSchema,
  BrowserCheckSpecSchema,
  BrowserCheckStepSchema,
  type Manifest,
  type Check,
  type Capability,
  type ParsedManifest,
  type ParsedCheck,
  type ParsedCapability,
  type ConfigField,
  type FrameworkRef,
  type CheckResultMessage,
  type RunCheckMessage,
  type HttpCheckSpec,
  type BrowserCheckSpec,
  type BrowserCheckStep,
} from "./types.js";

import type { Manifest } from "./types.js";
import { awsManifest } from "./manifests/aws.js";
import { githubManifest } from "./manifests/github.js";
import { googleWorkspaceManifest } from "./manifests/google-workspace.js";
import { oktaManifest } from "./manifests/okta.js";
import { microsoft365Manifest } from "./manifests/microsoft-365.js";
import { gitlabManifest } from "./manifests/gitlab.js";
import { azureManifest } from "./manifests/azure.js";
import { gcpManifest } from "./manifests/gcp.js";
import { bitbucketManifest } from "./manifests/bitbucket.js";
import { auth0Manifest } from "./manifests/auth0.js";
import { wazuhManifest } from "./manifests/wazuh.js";

/**
 * Phase 3 v1 manifests. Adding a connector? Append it here and provide
 * a manifest file under `./manifests/` — the API + UI will pick it up
 * automatically via `listManifests()` / `getManifest()`.
 *
 * Connector slug rules:
 *  - Lowercase + alphanumeric + dash/underscore.
 *  - Must match the `Integration.id` stored in the collector catalog
 *    (`apps/collector/src/seed/integrations.ts`) so manifest lookups by
 *    `IntegrationConnection.integrationId` work without a translation
 *    table.
 */
export const MANIFESTS: readonly Manifest[] = [
  awsManifest,
  githubManifest,
  googleWorkspaceManifest,
  oktaManifest,
  microsoft365Manifest,
  gitlabManifest,
  azureManifest,
  gcpManifest,
  bitbucketManifest,
  auth0Manifest,
  wazuhManifest,
];

export function listManifests(): readonly Manifest[] {
  return MANIFESTS;
}

export function getManifest(connector: string): Manifest | undefined {
  return MANIFESTS.find((m) => m.connector === connector);
}

/**
 * Returns the union of every `FrameworkRef` declared by the manifest
 * across both `checks[]` and `capabilities[]`. Used by the
 * binder/reconciler to derive the full set of refs that need to be
 * resolved against the tenant's `Requirement` rows.
 */
export function collectAllFrameworkRefs(
  manifest: Manifest,
): ReadonlyArray<{ framework: string; requirement: string }> {
  const seen = new Set<string>();
  const out: { framework: string; requirement: string }[] = [];
  const push = (refs: { framework: string; requirement: string; note?: string }[] | undefined) => {
    for (const ref of refs ?? []) {
      const key = `${ref.framework}::${ref.requirement}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ framework: ref.framework, requirement: ref.requirement });
    }
  };
  for (const check of manifest.checks ?? []) push(check.controlMappings);
  for (const capability of manifest.capabilities ?? []) push(capability.controlMappings);
  return out;
}
