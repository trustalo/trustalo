import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageProvider,
  StorageConfig,
  StorageResult,
  DownloadResult,
  StorageObject,
} from "../interface.js";

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private endpoint?: string;

  constructor(config: StorageConfig) {
    this.bucket = config.bucket;
    this.endpoint = config.endpoint;

    this.client = new S3Client({
      region: config.region ?? "us-east-1",
      ...(config.endpoint && {
        endpoint: config.endpoint,
        forcePathStyle: true,
      }),
      ...(config.accessKeyId &&
        config.secretAccessKey && {
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        }),
    });
  }

  async upload(
    key: string,
    data: Buffer | ReadableStream,
    options?: { contentType?: string; metadata?: Record<string, string> },
  ): Promise<StorageResult> {
    // `instanceof Buffer` narrows to `Buffer` but TypeScript still treats
    // the false branch as `Buffer<ArrayBufferLike> | ReadableStream` due
    // to Node.js' generic Buffer type. Explicitly handle both branches.
    const body: Buffer = Buffer.isBuffer(data) ? (data as Buffer) : await this.streamToBuffer(data);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: options?.contentType ?? "application/octet-stream",
        Metadata: options?.metadata,
      }),
    );

    return {
      key,
      url: this.buildObjectUrl(key),
      size: body.length,
      contentType: options?.contentType ?? "application/octet-stream",
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );

    if (!response.Body) {
      throw new Error(`Empty response body for key: ${key}`);
    }

    return {
      data: response.Body.transformToWebStream(),
      metadata: response.Metadata ?? {},
      contentType: response.ContentType ?? "application/octet-stream",
      size: response.ContentLength ?? 0,
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    const MAX_BATCH = 1000;
    for (let i = 0; i < keys.length; i += MAX_BATCH) {
      const batch = keys.slice(i, i + MAX_BATCH);
      await this.client.send(
        new DeleteObjectsCommand({
          Bucket: this.bucket,
          Delete: {
            Objects: batch.map((k) => ({ Key: k })),
            Quiet: true,
          },
        }),
      );
    }
  }

  async getSignedUrl(key: string, expiresInSeconds: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async list(prefix: string, maxKeys?: number): Promise<StorageObject[]> {
    const objects: StorageObject[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: prefix,
          MaxKeys: maxKeys ? Math.min(maxKeys - objects.length, 1000) : 1000,
          ContinuationToken: continuationToken,
        }),
      );

      for (const item of response.Contents ?? []) {
        if (!item.Key) continue;
        objects.push({
          key: item.Key,
          size: item.Size ?? 0,
          lastModified: item.LastModified ?? new Date(),
        });
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken && (!maxKeys || objects.length < maxKeys));

    return maxKeys ? objects.slice(0, maxKeys) : objects;
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (error: unknown) {
      const code = error instanceof Error && "name" in error ? error.name : undefined;
      if (code === "NotFound" || code === "NoSuchKey") {
        return false;
      }
      throw error;
    }
  }

  async copy(sourceKey: string, destinationKey: string): Promise<StorageResult> {
    await this.client.send(
      new CopyObjectCommand({
        Bucket: this.bucket,
        CopySource: `${this.bucket}/${sourceKey}`,
        Key: destinationKey,
      }),
    );

    const head = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: destinationKey,
      }),
    );

    return {
      key: destinationKey,
      url: this.buildObjectUrl(destinationKey),
      size: head.ContentLength ?? 0,
      contentType: head.ContentType ?? "application/octet-stream",
    };
  }

  private buildObjectUrl(key: string): string {
    if (this.endpoint) {
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }

  private async streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    let done = false;
    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        chunks.push(result.value);
      }
    }

    return Buffer.concat(chunks);
  }
}
