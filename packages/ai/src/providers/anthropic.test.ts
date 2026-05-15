import { afterEach, describe, expect, test } from "bun:test";
import { AIProviderError } from "../errors.js";
import { createAnthropicProvider } from "./anthropic.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("createAnthropicProvider", () => {
  test("maps successful response to chat result", async () => {
    let capturedBody = "";
    let capturedUrl = "";
    globalThis.fetch = (async (input, init) => {
      capturedUrl = String(input);
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          content: [{ type: "text", text: "hello" }],
          model: "claude-test",
          usage: { input_tokens: 12, output_tokens: 5 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const provider = createAnthropicProvider(
      { provider: "anthropic", apiKey: "test-key", baseUrl: "https://anthropic.local" },
      "claude-sonnet",
    );

    const out = await provider.chat({
      messages: [
        { role: "system", content: "sys" },
        { role: "user", content: "hi" },
      ],
      temperature: 0.2,
      maxTokens: 123,
    });

    expect(capturedUrl).toBe("https://anthropic.local/v1/messages");
    expect(capturedBody).toContain('"model":"claude-sonnet"');
    expect(capturedBody).toContain('"system":"sys"');
    expect(out.content).toBe("hello");
    expect(out.model).toBe("claude-test");
    expect(out.usage).toEqual({
      promptTokens: 12,
      completionTokens: 5,
      totalTokens: 17,
    });
  });

  test("throws AIProviderError for non-ok auth responses", async () => {
    globalThis.fetch = (async () =>
      new Response("forbidden", { status: 401 })) as unknown as typeof fetch;
    const provider = createAnthropicProvider({ provider: "anthropic", apiKey: "bad-key" }, "model");

    await expect(
      provider.chat({
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toBeInstanceOf(AIProviderError);
  });

  test("wraps network errors", async () => {
    globalThis.fetch = (async () => {
      throw Object.assign(new Error("ECONNREFUSED"), { code: "ECONNREFUSED" });
    }) as unknown as typeof fetch;
    const provider = createAnthropicProvider(
      { provider: "anthropic", apiKey: "test-key" },
      "model",
    );

    await expect(
      provider.chat({
        messages: [{ role: "user", content: "hi" }],
      }),
    ).rejects.toBeInstanceOf(AIProviderError);
  });
});
