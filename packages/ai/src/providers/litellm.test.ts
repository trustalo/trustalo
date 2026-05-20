import { afterEach, describe, expect, test } from "bun:test";
import { AIProviderError } from "../errors.js";
import { createLiteLLMProvider } from "./litellm.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("createLiteLLMProvider", () => {
  test("throws when required credentials are missing", () => {
    expect(() =>
      createLiteLLMProvider({ provider: "litellm", apiKey: "k" }, "trustalo-default"),
    ).toThrow("credentials.baseUrl");

    expect(() =>
      createLiteLLMProvider({ provider: "litellm", baseUrl: "http://localhost:4000" }, "m"),
    ).toThrow("credentials.apiKey");
  });

  test("normalizes baseUrl and forwards metadata/user attribution", async () => {
    let capturedUrl = "";
    let capturedBody = "";

    globalThis.fetch = (async (input, init) => {
      if (input instanceof Request) {
        capturedUrl = input.url;
        capturedBody = await input.clone().text();
      } else {
        capturedUrl = String(input);
        capturedBody =
          typeof init?.body === "string"
            ? init.body
            : init?.body
              ? await new Response(init.body as BodyInit).text()
              : "";
      }

      return new Response(
        JSON.stringify({
          id: "chatcmpl_test",
          object: "chat.completion",
          created: 1716000000,
          model: "openai/gpt-4o-mini",
          choices: [
            { index: 0, message: { role: "assistant", content: "ok" }, finish_reason: "stop" },
          ],
          usage: { prompt_tokens: 11, completion_tokens: 7, total_tokens: 18 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const provider = createLiteLLMProvider(
      {
        provider: "litellm",
        apiKey: "sk-litellm-key",
        baseUrl: "http://localhost:4005///",
      },
      "openai/gpt-4o-mini",
      { tenantId: "tenant-1", feature: "chat_assistant" },
    );

    const out = await provider.chat({
      messages: [{ role: "user", content: "hi" }],
      responseFormat: "json",
      temperature: 0,
      maxTokens: 32,
    });

    expect(capturedUrl).toContain("http://localhost:4005/chat/completions");
    expect(capturedBody).toContain('"response_format":{"type":"json_object"}');
    expect(capturedBody).toContain('"user":"tenant-1"');
    expect(capturedBody).toContain('"trustalo_tenant_id":"tenant-1"');
    expect(capturedBody).toContain('"trustalo_feature":"chat_assistant"');
    expect(out.content).toBe("ok");
    expect(out.model).toBe("openai/gpt-4o-mini");
    expect(out.usage).toEqual({
      promptTokens: 11,
      completionTokens: 7,
      totalTokens: 18,
    });
  });

  test("wraps upstream auth failures in AIProviderError", async () => {
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          error: {
            message: "Incorrect API key provided",
            type: "invalid_request_error",
            code: "invalid_api_key",
          },
        }),
        { status: 401, headers: { "content-type": "application/json" } },
      )) as unknown as typeof fetch;

    const provider = createLiteLLMProvider(
      { provider: "litellm", apiKey: "bad-key", baseUrl: "http://localhost:4005" },
      "openai/gpt-4o-mini",
    );

    await expect(
      provider.chat({
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toBeInstanceOf(AIProviderError);
  });
});
