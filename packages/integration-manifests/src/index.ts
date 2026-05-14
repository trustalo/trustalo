export {
  ManifestSchema,
  CheckSchema,
  ConfigFieldSchema,
  FrameworkRefSchema,
  HttpCheckSpecSchema,
  BrowserCheckSpecSchema,
  BrowserCheckStepSchema,
  type Manifest,
  type Check,
  type ParsedManifest,
  type ParsedCheck,
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

/**
 * Phase 3 v1 manifests. Adding a connector? Append it here and provide
 * a manifest file under `./manifests/` — the API + UI will pick it up
 * automatically via `listManifests()` / `getManifest()`.
 */
export const MANIFESTS: readonly Manifest[] = [
  awsManifest,
  githubManifest,
  googleWorkspaceManifest,
  oktaManifest,
  microsoft365Manifest,
  gitlabManifest,
];

export function listManifests(): readonly Manifest[] {
  return MANIFESTS;
}

export function getManifest(connector: string): Manifest | undefined {
  return MANIFESTS.find((m) => m.connector === connector);
}
