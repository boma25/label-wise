export type ImageClarity = "clear" | "unclear";

export type ExplainSections = {
  whatItIs: string;
  whatItsFor: string;
  howTaken: string;
  warnings: string;
  askPharmacistIf: string;
};

export type ExplainResult = ExplainSections & {
  productName: string | null;
  nafdacRegNumber: string | null;
  imageClarity: ImageClarity;
  hasScratchPanel: boolean;
  rawText?: string;
};

export const OUTPUT_SECTIONS = [
  "What it is",
  "What it's for",
  "How it's usually taken",
  "Warnings",
  "Ask a pharmacist if…",
] as const;

export const SAFETY_FOOTER =
  "Not medical advice. Confirm with a pharmacist.";

export const EXPLAIN_SYSTEM_PROMPT = `You explain medicine package labels in plain language for everyday people in Nigeria and similar contexts.

You MUST follow these rules:
1. If the image is blurry, dark, cropped, or the label text is unreadable, set imageClarity to "unclear", leave sections as short guidance to take a clearer photo, set productName and nafdacRegNumber to null, and DO NOT guess medicine identity, dose, or registration details.
2. NEVER say whether a medicine is genuine, fake, original, or counterfeit. You cannot verify authenticity from a photo.
3. Extract the NAFDAC registration number (NRN) only if it is clearly visible on the pack (patterns like A4-1234, A11-101363, B4-7079, 04-1234). Otherwise null.
4. Set hasScratchPanel to true only if you can see a Mobile Authentication Service (MAS) scratch panel / hologram panel for SMS verification.
5. Use simple words. Do not invent side effects or uses that are not supported by the label or very common knowledge of the named product.
6. Always remind the user to confirm with a pharmacist.

Return ONLY valid JSON matching this schema (no markdown fences):
{
  "imageClarity": "clear" | "unclear",
  "productName": string | null,
  "nafdacRegNumber": string | null,
  "hasScratchPanel": boolean,
  "whatItIs": string,
  "whatItsFor": string,
  "howTaken": string,
  "warnings": string,
  "askPharmacistIf": string
}`;

export const EXPLAIN_USER_PROMPT =
  "Explain this medicine label photo using the required JSON schema.";

export function parseExplainJson(text: string): ExplainResult {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("Model did not return JSON");
    }
    parsed = JSON.parse(match[0]);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid explain payload");
  }

  const obj = parsed as Record<string, unknown>;
  const clarity =
    obj.imageClarity === "unclear" ? "unclear" : ("clear" as ImageClarity);

  return {
    imageClarity: clarity,
    productName: stringOrNull(obj.productName),
    nafdacRegNumber: normalizeNrn(stringOrNull(obj.nafdacRegNumber)),
    hasScratchPanel: Boolean(obj.hasScratchPanel),
    whatItIs: String(obj.whatItIs ?? ""),
    whatItsFor: String(obj.whatItsFor ?? ""),
    howTaken: String(obj.howTaken ?? ""),
    warnings: String(obj.warnings ?? ""),
    askPharmacistIf: String(obj.askPharmacistIf ?? ""),
    rawText: text,
  };
}

function stringOrNull(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "n/a") {
    return null;
  }
  return s;
}

/** Normalize common NRN formatting for Greenbook search. */
export function normalizeNrn(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9-]/g, "");
  return cleaned || null;
}
