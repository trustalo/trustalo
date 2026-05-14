import type {
  AIProvider,
  AIProviderCredentials,
  ChatCompletionOptions,
  ChatCompletionResult,
  ChatMessage,
} from "../types.js";
import { AIProviderError, wrapProviderError } from "../errors.js";

/**
 * AWS Bedrock provider using the Converse API via direct HTTPS calls.
 *
 * Credential modes:
 *
 *   1. Static — `accessKeyId` + `secretAccessKey` (+ optional `sessionToken`)
 *      passed in the `AIProviderCredentials`. Used when an org saves its
 *      own IAM keys via `AIProviderConfig`.
 *
 *   2. Default chain — when `useDefaultChain: true` is set (typically
 *      because the operator deployed Trustalo with `AI_PROVIDER=bedrock`
 *      and no static keys), credentials are resolved lazily on each call
 *      via `@aws-sdk/credential-providers`'s `fromNodeProviderChain()`
 *      which walks env → shared config → IMDS → IAM role. This is the
 *      "self-hosted Trustalo on EC2/ECS/EKS with an attached IAM role"
 *      story called out in plan constraint C2.
 *
 * Sig V4 is signed manually (rather than pulling in the full SDK
 * Bedrock client) to keep the AI package small.
 */

interface BedrockMessage {
  role: "user" | "assistant";
  content: { text: string }[];
}

interface BedrockConverseResponse {
  output: { message: { role: string; content: { text: string }[] } };
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
}

interface ResolvedAwsCreds {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
}

async function hmacSha256(
  key: ArrayBuffer | Uint8Array<ArrayBuffer>,
  data: string,
): Promise<ArrayBuffer> {
  // Normalise to a Uint8Array<ArrayBuffer>. Web Crypto's importKey() is
  // strict about the typed-array's underlying buffer flavour: an
  // ArrayBufferLike-backed view (which Node sometimes produces) isn't
  // assignable to ArrayBuffer-backed BufferSource, so we always copy
  // into a fresh ArrayBuffer here. Also avoids relying on the DOM lib
  // for the BufferSource alias — keeps the package consumable from
  // ES2023-only tsconfigs.
  const ab =
    key instanceof ArrayBuffer
      ? key
      : key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength);
  const keyBuffer = new Uint8Array(ab as ArrayBuffer);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(data));
}

async function sha256(data: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getSignatureKey(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
): Promise<ArrayBuffer> {
  const kDate = await hmacSha256(new TextEncoder().encode(`AWS4${secretKey}`), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

/**
 * Lazily-imported, cached default-chain provider. We only pull in
 * `@aws-sdk/credential-providers` when the deployment actually needs it
 * (so OpenAI-only customers don't pay the bundle cost).
 */
let defaultChainProvider: (() => Promise<ResolvedAwsCreds>) | null = null;

async function getDefaultChainCredentials(): Promise<ResolvedAwsCreds> {
  if (!defaultChainProvider) {
    const mod = await import("@aws-sdk/credential-providers");
    const provider = mod.fromNodeProviderChain();
    defaultChainProvider = async () => {
      const creds = await provider();
      return {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
      };
    };
  }
  return defaultChainProvider();
}

export function createBedrockProvider(
  credentials: AIProviderCredentials,
  model: string,
): AIProvider {
  const region = credentials.region ?? process.env.AWS_REGION ?? "us-east-1";

  async function resolveCredentials(): Promise<ResolvedAwsCreds> {
    if (credentials.useDefaultChain) {
      return getDefaultChainCredentials();
    }
    if (!credentials.accessKeyId || !credentials.secretAccessKey) {
      // No static keys and chain not requested — fall back to chain
      // anyway rather than fail with cryptic Sig V4 errors. This is the
      // friendliest default for ECS/EKS where role creds are present.
      return getDefaultChainCredentials();
    }
    return {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    };
  }

  return {
    async chat(options: ChatCompletionOptions): Promise<ChatCompletionResult> {
      const systemPrompts = options.messages
        .filter((m) => m.role === "system")
        .map((m) => ({ text: m.content }));

      const messages: BedrockMessage[] = options.messages
        .filter((m): m is ChatMessage & { role: "user" | "assistant" } => m.role !== "system")
        .map((m) => ({ role: m.role, content: [{ text: m.content }] }));

      const body = JSON.stringify({
        messages,
        ...(systemPrompts.length > 0 && { system: systemPrompts }),
        inferenceConfig: {
          maxTokens: options.maxTokens ?? 4096,
          temperature: options.temperature ?? 0.7,
        },
      });

      const { accessKeyId, secretAccessKey, sessionToken } = await resolveCredentials();

      const host = `bedrock-runtime.${region}.amazonaws.com`;
      const endpoint = `https://${host}/model/${encodeURIComponent(model)}/converse`;
      const now = new Date();
      const amzDate = now
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\.\d+Z/, "Z");
      const dateStamp = amzDate.slice(0, 8);

      const payloadHash = await sha256(body);
      // Session-token-bearing creds (STS, IAM role) require x-amz-security-token to be signed.
      const signedHeadersList = sessionToken
        ? ["content-type", "host", "x-amz-date", "x-amz-security-token"]
        : ["content-type", "host", "x-amz-date"];
      const canonicalHeaderLines: string[] = [
        `content-type:application/json`,
        `host:${host}`,
        `x-amz-date:${amzDate}`,
      ];
      if (sessionToken) {
        canonicalHeaderLines.push(`x-amz-security-token:${sessionToken}`);
      }
      const canonicalHeaders = `${canonicalHeaderLines.join("\n")}\n`;
      const signedHeaders = signedHeadersList.join(";");
      const canonicalRequest = `POST\n/model/${encodeURIComponent(model)}/converse\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

      const credentialScope = `${dateStamp}/${region}/bedrock/aws4_request`;
      const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;
      const signingKey = await getSignatureKey(secretAccessKey, dateStamp, region, "bedrock");
      const signatureBuffer = await hmacSha256(signingKey, stringToSign);
      const signature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Amz-Date": amzDate,
        Authorization: authHeader,
      };
      if (sessionToken) headers["X-Amz-Security-Token"] = sessionToken;

      let response: Response;
      try {
        response = await fetch(endpoint, {
          method: "POST",
          headers,
          body,
        });
      } catch (err) {
        throw wrapProviderError("Bedrock", err);
      }

      if (!response.ok) {
        // Drop the upstream body. AWS responses include AccessKeyId
        // values and request-ids that we don't want surfaced.
        await response.text().catch(() => "");
        throw new AIProviderError({
          kind:
            response.status === 401 || response.status === 403
              ? "auth"
              : response.status === 429
                ? "rate_limit"
                : response.status >= 500
                  ? "server_error"
                  : "bad_request",
          provider: "Bedrock",
          status: response.status,
          publicMessage:
            response.status === 401 || response.status === 403
              ? "AWS Bedrock rejected our credentials. Please contact your administrator to re-check the IAM role / API key."
              : response.status === 429
                ? "AWS Bedrock is throttling requests right now. Please retry in a moment."
                : response.status >= 500
                  ? "AWS Bedrock is currently unavailable. Please try again shortly."
                  : "AWS Bedrock could not process the request.",
        });
      }

      const data = (await response.json()) as BedrockConverseResponse;
      const textContent = data.output.message.content.map((c) => c.text).join("");

      return {
        content: textContent,
        model,
        usage: {
          promptTokens: data.usage.inputTokens,
          completionTokens: data.usage.outputTokens,
          totalTokens: data.usage.totalTokens,
        },
      };
    },
  };
}
