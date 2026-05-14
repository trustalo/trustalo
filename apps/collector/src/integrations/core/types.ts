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
  sourceType: string;
  sourceId: string;
  rawData: Record<string, unknown>;
  severity?: "critical" | "high" | "medium" | "low" | "info";
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
