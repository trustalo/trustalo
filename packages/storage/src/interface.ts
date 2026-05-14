export interface StorageResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  contentType?: string;
}

export interface DownloadResult {
  data: ReadableStream;
  metadata: Record<string, string>;
  contentType: string;
  size: number;
}

export interface StorageProvider {
  upload(
    key: string,
    data: Buffer | ReadableStream,
    options?: { contentType?: string; metadata?: Record<string, string> },
  ): Promise<StorageResult>;
  download(key: string): Promise<DownloadResult>;
  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  list(prefix: string, maxKeys?: number): Promise<StorageObject[]>;
  exists(key: string): Promise<boolean>;
  copy(sourceKey: string, destinationKey: string): Promise<StorageResult>;
}

export interface StorageConfig {
  provider: "s3" | "gcs" | "azure" | "local";
  region?: string;
  bucket: string;
  endpoint?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}
