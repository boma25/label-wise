import type { ProviderExplainResult, ProviderId } from "@/lib/providers";
import type { ProviderInfo } from "@/lib/providers";

export type ExplainResponse = ProviderExplainResult;

export type ProvidersResponse = {
  providers: ProviderInfo[];
  default: ProviderId | null;
};

export async function fetchProviders(
  signal?: AbortSignal,
): Promise<ProvidersResponse> {
  const res = await fetch("/api/providers", { signal, cache: "no-store" });
  const body = (await res.json().catch(() => ({}))) as ProvidersResponse & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(body.error || `Providers failed (${res.status})`);
  }
  return body;
}

export async function explainViaCloud(
  imageDataUrl: string,
  provider: ProviderId,
  signal?: AbortSignal,
): Promise<ExplainResponse> {
  const res = await fetch("/api/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl, provider }),
    signal,
  });

  const body = (await res.json().catch(() => ({}))) as {
    error?: string;
  } & Partial<ExplainResponse>;

  if (!res.ok) {
    throw new Error(body.error || `Explain failed (${res.status})`);
  }

  return body as ExplainResponse;
}
