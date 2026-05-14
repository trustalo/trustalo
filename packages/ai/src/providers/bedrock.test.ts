import { afterEach, describe, expect, test } from "bun:test";
import { AIProviderError } from "../errors.js";
import { createBedrockProvider } from "./bedrock.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("createBedrockProvider", () => {
  test("signs and maps successful converse response", async () => {
    let capturedUrl = "";
    let capturedAuth = "";
    let capturedToken = "";
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input);
      capturedAuth = String((init?.headers as Record<string, string>)?.Authorization ?? "");
      capturedToken = String((init?.headers as Record<string, string>)?.["X-Amz-Security-Token"] ?? "");
      return new Response(
        JSON.stringify({
          output: {
            message: {
              role: "assistant",
              content: [{ text: "bedrock ok" }],
            },
          },
          usage: { inputTokens: 3, outputTokens: 4, totalTokens: 7 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const provider = createBedrockProvider(
      {
        provider: "bedrock",
        region: "us-east-1",
        accessKeyId: "AKIA_TEST",
        secretAccessKey: "SECRET_TEST",
        sessionToken: "SESSION_TOKEN",
      },
      "anthropic.claude-3-5-sonnet-20241022-v2:0",
    );

    const out = await provider.chat({
      messages: [{ role: "user", content: "hello" }],
      temperature: 0.1,
      maxTokens: 10,
    });

    expect(capturedUrl).toContain("https://bedrock-runtime.us-east-1.amazonaws.com/model/");
    expect(capturedAuth).toContain("AWS4-HMAC-SHA256 Credential=AKIA_TEST/");
    expect(capturedToken).toBe("SESSION_TOKEN");
    expect(out.content).toBe("bedrock ok");
    expect(out.model).toBe("anthropic.claude-3-5-sonnet-20241022-v2:0");
    expect(out.usage).toEqual({
      promptTokens: 3,
      completionTokens: 4,
      totalTokens: 7,
    });
  });

  test("throws AIProviderError when upstream returns non-ok", async () => {
    globalThis.fetch = (async () => new Response("throttle", { status: 429 })) as typeof fetch;
    const provider = createBedrockProvider(
      {
        provider: "bedrock",
        region: "us-east-1",
        accessKeyId: "AKIA_TEST",
        secretAccessKey: "SECRET_TEST",
      },
      "model",
    );

    await expect(
      provider.chat({
        messages: [{ role: "user", content: "hello" }],
      }),
    ).rejects.toBeInstanceOf(AIProviderError);
  });
});
