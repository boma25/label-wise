import { GoogleGenAI } from "@google/genai";
import {
  EXPLAIN_SYSTEM_PROMPT,
  EXPLAIN_USER_PROMPT,
  parseExplainJson,
} from "@/lib/prompt";
import { readEnv } from "./env";
import type { ExplainProvider } from "./types";

const MODEL = "gemma-4-26b-a4b-it";

export const gemmaProvider: ExplainProvider = {
  id: "gemma",
  label: "Gemma 4 (Gemini)",
  shortLabel: "Gemma",
  model: MODEL,
  unavailableReason: "Gemma is not configured on the server",
  isAvailable: () => Boolean(readEnv("GEMINI_API_KEY")),
  async explain(image) {
    const apiKey = readEnv("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error(this.unavailableReason);
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: `${EXPLAIN_SYSTEM_PROMPT}\n\n${EXPLAIN_USER_PROMPT}` },
            { inlineData: { mimeType: image.mimeType, data: image.data } },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      throw new Error("Empty response from Gemma.");
    }

    return {
      ...parseExplainJson(text),
      provider: "gemma",
      model: MODEL,
      path: "cloud",
    };
  },
};
