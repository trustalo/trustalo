/**
 * Template for adding new storage providers (GCP Cloud Storage, Azure Blob, etc.)
 *
 * To add a new provider:
 * 1. Copy this file and rename (e.g., gcs.ts, azure-blob.ts)
 * 2. Install the provider's SDK
 * 3. Implement all methods of StorageProvider
 * 4. Register in the factory (src/index.ts)
 */
import type {
  StorageProvider,
  StorageResult,
  DownloadResult,
  StorageObject,
  StorageConfig,
} from "../interface.js";

export class TemplateStorageProvider implements StorageProvider {
  constructor(_config: StorageConfig) {
    throw new Error(
      "TemplateStorageProvider is not implemented. Copy this file and implement for your provider.",
    );
  }

  async upload(
    _key: string,
    _data: Buffer | ReadableStream,
    _options?: { contentType?: string; metadata?: Record<string, string> },
  ): Promise<StorageResult> {
    throw new Error("Not implemented");
  }

  async download(_key: string): Promise<DownloadResult> {
    throw new Error("Not implemented");
  }

  async delete(_key: string): Promise<void> {
    throw new Error("Not implemented");
  }

  async deleteMany(_keys: string[]): Promise<void> {
    throw new Error("Not implemented");
  }

  async getSignedUrl(_key: string, _expiresInSeconds: number): Promise<string> {
    throw new Error("Not implemented");
  }

  async list(_prefix: string, _maxKeys?: number): Promise<StorageObject[]> {
    throw new Error("Not implemented");
  }

  async exists(_key: string): Promise<boolean> {
    throw new Error("Not implemented");
  }

  async copy(_sourceKey: string, _destinationKey: string): Promise<StorageResult> {
    throw new Error("Not implemented");
  }
}
