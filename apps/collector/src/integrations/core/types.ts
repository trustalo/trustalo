// Runtime plugin interface for an integration connector.
//
// Distinct from the Prisma `Integration` model (which is just the catalog
// row in the database). This interface is the TS contract that each
// connector module under `src/integrations/providers/*` must implement.

export type IntegrationCategory =
  | "cloud"
  | "identity"
  | "code_repository"
  | "productivity"
  | "security"
  | "hr"
  | "ai"
  | "custom";

/** @deprecated use `IntegrationCategory`. */
export type ProviderCategory = IntegrationCategory;

export interface CredentialField {
  key: string;
  label: string;
  type: "text" | "password" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  description?: string;
  sensitive?: boolean;
  options?: { value: string; label: string }[];
  default?: string;
  /** When set, field is shown only if credentials[key] === value */
  showWhen?: { key: string; value: string };
}

export interface IntegrationConnector {
  /** Catalog slug, e.g. "github" / "aws". Doubles as the Prisma row id. */
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly category: IntegrationCategory;
  readonly authType: "oauth2" | "api_key" | "iam_role";
  /**
   * @deprecated Kept as a free-form display hint. The authoritative
   * list of capabilities is now declared in
   * `@trustalo/integration-manifests` and is resolved at runtime via
   * `getManifest(connectorId).capabilities`. Provider classes should
   * leave this empty going forward; the binder + reconciler ignore it.
   */
  readonly capabilities: string[];
  readonly configSchema: CredentialField[];

  connect(credentials: DecryptedCredentials): Promise<IntegrationRuntime>;
  collectEvidence(
    connection: IntegrationRuntime,
    options: CollectOptions,
  ): Promise<EvidenceResult[]>;
  testConnection(connection: IntegrationRuntime): Promise<ConnectionTestResult>;
  disconnect(connection: IntegrationRuntime): Promise<void>;
  getRequiredPermissions(): PermissionRequirement[];
}

/** @deprecated use `IntegrationConnector`. Transitional alias. */
export type IntegrationProvider = IntegrationConnector;

export interface DecryptedCredentials {
  [key: string]: string | undefined;
}

export interface IntegrationRuntime {
  id: string;
  /** Slug of the underlying integration (e.g. "github"). */
  integration: string;
  client: unknown;
}

/** @deprecated use `IntegrationRuntime`. */
export type ProviderConnection = IntegrationRuntime;

export interface CollectOptions {
  tenantId: string;
  connectionId: string;
  incremental?: boolean;
  since?: Date;
}

export interface EvidenceResult {
  title: string;
  description: string;
  /**
   * Stable manifest key for the capability that produced this evidence
   * row. Resolves to a `Capability` (or `Check`) declared in the
   * connector's manifest (`@trustalo/integration-manifests`). The
   * runner uses this to look up the tenant `IntegrationCheckControl`
   * rows and attach the evidence to the bound tenant Controls.
   *
   * Historically the same string was emitted as `sourceType`; the two
   * are kept in lock-step (manifestKey is the authoritative field, and
   * `sourceType` is filled with the same value for backwards
   * compatibility with consumers reading the evidence row).
   */
  manifestKey: string;
  /** @deprecated Mirror of `manifestKey`; will be removed in a later release. */
  sourceType: string;
  sourceId: string;
  rawData: Record<string, unknown>;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  /**
   * @deprecated Free-form framework requirement strings. Bindings are
   * now derived from `manifestKey` via `IntegrationCheckControl` rows
   * created by the binder/reconciler. Providers still populate this
   * for one release so callers consuming the wire format don't break.
   */
  controlMapping?: string[];
  collectedAt: Date;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface PermissionRequirement {
  resource: string;
  permission: string;
  description: string;
  required: boolean;
}
