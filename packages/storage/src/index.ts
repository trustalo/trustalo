export {
  type StorageProvider,
  type StorageConfig,
  type StorageResult,
  type DownloadResult,
  type StorageObject,
} from "./interface.js";
export { S3StorageProvider } from "./providers/s3.js";

import type { StorageConfig, StorageProvider } from "./interface.js";
import { S3StorageProvider } from "./providers/s3.js";

export function createStorageProvider(config: StorageConfig): StorageProvider {
  switch (config.provider) {
    case "s3":
      return new S3StorageProvider(config);
    default:
      throw new Error(`Unsupported storage provider: ${config.provider}. Available: s3`);
  }
}
