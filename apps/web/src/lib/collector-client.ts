const COLLECTOR_URL = process.env.NEXT_PUBLIC_COLLECTOR_URL || "http://localhost:4001";
const TOKEN_KEY = "trustalo_token";

export class CollectorError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = "CollectorError";
  }
}

// --- Shared Types ---

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
  showWhen?: { key: string; value: string };
}

/**
 * Catalog entry returned by the collector for an `Integration` row.
 *
 * Note: the collector now uses the connector slug (e.g. `"aws"`, `"github"`)
 * as the `Integration.id` directly, so this shape no longer carries a
 * separate `slug` field. The legacy `slug` alias is preserved as `id` for
 * any callers that were destructuring it.
 */
export interface IntegrationCatalogEntry {
  id: string;
  name: string;
  description: string | null;
  authType: string;
  category: string;
  capabilities: string[];
  configSchema: { fields: CredentialField[] } | null;
}

/** Backwards-compatible alias for callers still importing the old name. */
export type IntegrationProviderInfo = IntegrationCatalogEntry;

export interface CatalogCategory {
  category: string;
  label: string;
  integrations: IntegrationCatalogEntry[];
}

export interface IntegrationConnection {
  id: string;
  tenantId: string;
  integrationId: string;
  name: string;
  status: "connected" | "disconnected" | "error" | "syncing" | "pending_auth";
  config: Record<string, unknown> | null;
  lastSyncAt: string | null;
  lastErrorMessage: string | null;
  syncFrequencyMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  integration: { id: string; name: string; category?: string };
}

export interface CollectionJob {
  id: string;
  tenantId: string;
  connectionId: string;
  type: string;
  status: string;
  priority: number;
  scheduledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  connection?: { name: string; integration: { id: string; name: string } };
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export interface SyncLog {
  id: string;
  connectionId: string;
  action: string;
  status: string;
  recordsProcessed: number;
  startedAt: string;
  completedAt: string | null;
  connection?: { name: string; integration: { id: string; name: string } };
}

// --- Client ---

class CollectorClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = this.getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: { message: response.statusText } }));
      throw new CollectorError(
        response.status,
        error.error?.message || "Request failed",
        error.error?.code,
      );
    }

    return response.json() as Promise<T>;
  }

  // ---------- Integrations (catalog) ----------
  //
  // The collector retains the legacy `/providers` route paths for backward
  // compatibility, but the underlying resource is now `Integration`. Public
  // methods are named after the new domain term to keep call-sites aligned
  // with the schema. Legacy aliases follow below.
  listIntegrations() {
    return this.request<{ success: boolean; data: IntegrationCatalogEntry[] }>("GET", "/providers");
  }

  getIntegrationCatalog() {
    return this.request<{ success: boolean; data: CatalogCategory[] }>("GET", "/providers/catalog");
  }

  getIntegration(id: string) {
    return this.request<{
      success: boolean;
      data: IntegrationCatalogEntry & { registered: boolean; requiredPermissions: unknown[] };
    }>("GET", `/providers/${id}`);
  }

  /** @deprecated use {@link listIntegrations} */
  listProviders = this.listIntegrations.bind(this);
  /** @deprecated use {@link getIntegrationCatalog} */
  getProviderCatalog = this.getIntegrationCatalog.bind(this);
  /** @deprecated use {@link getIntegration} */
  getProvider = this.getIntegration.bind(this);

  // ---------- Connections ----------
  listConnections(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<{ success: boolean; data: IntegrationConnection[] }>(
      "GET",
      `/connections${qs}`,
    );
  }

  createConnection(data: {
    integrationId: string;
    name: string;
    credentials: Record<string, string>;
    config?: Record<string, unknown>;
    syncFrequencyMinutes?: number;
  }) {
    return this.request<{ success: boolean; data: IntegrationConnection }>(
      "POST",
      "/connections",
      data,
    );
  }

  getConnection(id: string) {
    return this.request<{ success: boolean; data: IntegrationConnection }>(
      "GET",
      `/connections/${id}`,
    );
  }

  updateConnection(
    id: string,
    data: {
      name?: string;
      credentials?: Record<string, string>;
      config?: Record<string, unknown>;
      syncFrequencyMinutes?: number;
      isActive?: boolean;
    },
  ) {
    return this.request<{ success: boolean; data: IntegrationConnection }>(
      "PUT",
      `/connections/${id}`,
      data,
    );
  }

  deleteConnection(id: string) {
    return this.request<{ success: boolean; data: { id: string; deleted: boolean } }>(
      "DELETE",
      `/connections/${id}`,
    );
  }

  testConnection(id: string) {
    return this.request<{ success: boolean; data: ConnectionTestResult }>(
      "POST",
      `/connections/${id}/test`,
    );
  }

  // ---------- Jobs ----------
  listJobs(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<{ success: boolean; data: CollectionJob[]; meta: { total: number } }>(
      "GET",
      `/jobs${qs}`,
    );
  }

  triggerJob(connectionId: string, priority?: number) {
    return this.request<{ success: boolean; data: CollectionJob }>("POST", "/jobs/trigger", {
      connectionId,
      priority,
    });
  }

  getJob(id: string) {
    return this.request<{ success: boolean; data: CollectionJob }>("GET", `/jobs/${id}`);
  }

  cancelJob(id: string) {
    return this.request<{ success: boolean; data: CollectionJob }>("POST", `/jobs/${id}/cancel`);
  }

  // ---------- Sync Logs ----------
  listSyncLogs(params?: Record<string, string>) {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return this.request<{ success: boolean; data: SyncLog[]; meta: { total: number } }>(
      "GET",
      `/sync-logs${qs}`,
    );
  }
}

export const collectorClient = new CollectorClient(COLLECTOR_URL);
