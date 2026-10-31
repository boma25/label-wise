import { gemmaProvider } from "./gemma";
import { openaiProvider } from "./openai";
import type { ExplainProvider, ProviderId, ProviderInfo } from "./types";

export type { ExplainImageInput, ProviderExplainResult, ProviderId, ProviderInfo } from "./types";

/** Preference order when multiple providers are available: Gemma first. */
export const PROVIDERS: ExplainProvider[] = [gemmaProvider, openaiProvider];

export function getProvider(id: ProviderId): ExplainProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}

export function isProviderId(value: unknown): value is ProviderId {
  return value === "gemma" || value === "openai";
}

export function listProviderInfo(): ProviderInfo[] {
  return PROVIDERS.map((p) => {
    const available = p.isAvailable();
    return {
      id: p.id,
      label: p.label,
      shortLabel: p.shortLabel,
      model: p.model,
      available,
      unavailableReason: available ? undefined : p.unavailableReason,
    };
  });
}

/** Default: Gemma if available, else first available provider. */
export function pickDefaultProviderId(
  list: ProviderInfo[] = listProviderInfo(),
): ProviderId | null {
  const gemma = list.find((p) => p.id === "gemma" && p.available);
  if (gemma) return "gemma";
  const first = list.find((p) => p.available);
  return first?.id ?? null;
}

export function getProvidersPayload() {
  const providers = listProviderInfo();
  return {
    providers,
    default: pickDefaultProviderId(providers),
  };
}
