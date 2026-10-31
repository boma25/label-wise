import type { ExplainResult } from "@/lib/prompt";

export type ProviderId = "gemma" | "openai";

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  shortLabel: string;
  model: string;
  available: boolean;
  unavailableReason?: string;
};

export type ExplainImageInput = {
  mimeType: string;
  data: string; // raw base64, no data: prefix
};

export type ProviderExplainResult = ExplainResult & {
  provider: ProviderId;
  model: string;
  path: "cloud";
};

export type ExplainProvider = {
  id: ProviderId;
  label: string;
  shortLabel: string;
  model: string;
  isAvailable: () => boolean;
  unavailableReason: string;
  explain: (image: ExplainImageInput) => Promise<ProviderExplainResult>;
};
