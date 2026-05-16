import { describe, expect, test } from "bun:test";
import type { AIProvider, ChatCompletionOptions } from "../types.js";
import { generateQuizQuestions } from "./quiz.js";

function makeProvider(
  content: string,
  capture?: (opts: ChatCompletionOptions) => void,
): AIProvider {
  return {
    async chat(options) {
      capture?.(options);
      return {
        content,
        model: "test-model",
      };
    },
  };
}

describe("generateQuizQuestions", () => {
  test("parses plain JSON response", async () => {
    const provider = makeProvider(
      JSON.stringify({
        title: "Security Basics",
        description: "Quiz",
        questions: [
          {
            text: "Use MFA?",
            type: "true_false",
            points: 1,
            options: [
              { text: "True", isCorrect: true },
              { text: "False", isCorrect: false },
            ],
          },
        ],
      }),
    );

    const out = await generateQuizQuestions(provider, {
      topic: "MFA",
      numberOfQuestions: 1,
      difficulty: "beginner",
    });
    expect(out.title).toBe("Security Basics");
    expect(out.questions).toHaveLength(1);
  });

  test("strips markdown fences around JSON", async () => {
    const provider = makeProvider(
      "```json\n" +
        JSON.stringify({
          title: "Phishing",
          description: "desc",
          questions: [],
        }) +
        "\n```",
    );
    const out = await generateQuizQuestions(provider, {
      topic: "Phishing",
      numberOfQuestions: 0,
    });
    expect(out.title).toBe("Phishing");
  });

  test("throws when AI response is missing questions array", async () => {
    const provider = makeProvider(JSON.stringify({ title: "Bad", description: "x" }));
    await expect(
      generateQuizQuestions(provider, {
        topic: "Bad",
        numberOfQuestions: 1,
      }),
    ).rejects.toThrow("AI response missing questions array");
  });

  test("sends expected prompt options to provider", async () => {
    let captured: ChatCompletionOptions | undefined;
    const provider = makeProvider(
      JSON.stringify({
        title: "T",
        description: "D",
        questions: [],
      }),
      (opts) => {
        captured = opts;
      },
    );

    await generateQuizQuestions(provider, {
      topic: "Data handling",
      numberOfQuestions: 3,
      additionalContext: "PCI DSS",
    });

    expect(captured).toBeDefined();
    expect(captured?.responseFormat).toBe("json");
    expect(captured?.maxTokens).toBe(4096);
    expect(captured?.temperature).toBe(0.7);
    expect(captured?.messages[1]?.content).toContain("Number of questions: 3");
    expect(captured?.messages[1]?.content).toContain("Additional context: PCI DSS");
  });
});
