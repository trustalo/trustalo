import type { AIProvider, ChatMessage } from "../types.js";

export interface QuizGenerationInput {
  topic: string;
  numberOfQuestions: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  additionalContext?: string;
}

export interface GeneratedQuestion {
  text: string;
  type: "multiple_choice" | "true_false";
  points: number;
  options: { text: string; isCorrect: boolean }[];
}

export interface GeneratedQuiz {
  title: string;
  description: string;
  questions: GeneratedQuestion[];
}

const SYSTEM_PROMPT = `You are a cybersecurity compliance expert that creates training quizzes for employees. You produce high-quality, accurate quiz questions that test real-world security awareness.

Rules:
- Each question must have exactly 4 options for multiple_choice or 2 for true_false
- Exactly one option must be correct per question
- Questions should cover practical scenarios employees face (phishing, password hygiene, data handling, social engineering, incident reporting, etc.)
- Vary question difficulty to match the requested level
- Use clear, unambiguous language
- Make incorrect options plausible but clearly wrong to someone who knows the material
- Always respond with valid JSON matching the schema exactly`;

export async function generateQuizQuestions(
  provider: AIProvider,
  input: QuizGenerationInput,
): Promise<GeneratedQuiz> {
  const userPrompt = `Generate a cybersecurity awareness quiz with the following requirements:

Topic: ${input.topic}
Number of questions: ${input.numberOfQuestions}
Difficulty: ${input.difficulty ?? "intermediate"}
${input.additionalContext ? `Additional context: ${input.additionalContext}` : ""}

Respond with a JSON object matching this exact schema:
{
  "title": "string - quiz title",
  "description": "string - brief quiz description",
  "questions": [
    {
      "text": "string - the question",
      "type": "multiple_choice" or "true_false",
      "points": 1,
      "options": [
        { "text": "string - option text", "isCorrect": true/false }
      ]
    }
  ]
}

Generate exactly ${input.numberOfQuestions} questions. Mix multiple_choice and true_false types (about 70/30 ratio). Return ONLY the JSON object, no markdown.`;

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userPrompt },
  ];

  const result = await provider.chat({
    messages,
    temperature: 0.7,
    maxTokens: 4096,
    responseFormat: "json",
  });

  let content = result.content.trim();
  // Strip markdown fences if the model wraps JSON in them
  if (content.startsWith("```")) {
    content = content.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(content) as GeneratedQuiz;

  if (!parsed.questions || !Array.isArray(parsed.questions)) {
    throw new Error("AI response missing questions array");
  }

  return parsed;
}
