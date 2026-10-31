import OpenAI from "openai";
import {
  EXPLAIN_SYSTEM_PROMPT,
  EXPLAIN_USER_PROMPT,
  parseExplainJson,
} from "@/lib/prompt";
import { readEnv } from "./env";
import type { ExplainProvider } from "./types";

const MODEL = "gpt-4o-mini";

export const openaiProvider: ExplainProvider = {
  id: "openai",
  label: "OpenAI",
  shortLabel: "OpenAI",
  model: MODEL,
  unavailableReason: "OpenAI is not configured on the server",
  isAvailable: () => Boolean(readEnv("OPENAI_API_KEY")),
  async explain(image) {
    const apiKey = readEnv("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error(this.unavailableReason);
    }

    const client = new OpenAI({ apiKey });
    const dataUrl = `data:${image.mimeType};base64,${image.data}`;

    const response = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      max_tokens: 2048,
      messages: [
        { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: EXPLAIN_USER_PROMPT },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim();
    if (!text) {
      throw new Error("Empty response from OpenAI.");
    }

    return {
      ...parseExplainJson(text),
      provider: "openai",
      model: MODEL,
      path: "cloud",
    };
  },
};
