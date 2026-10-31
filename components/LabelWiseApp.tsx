"use client";

import { useEffect, useState } from "react";
import { CameraCapture } from "@/components/CameraCapture";
import { NafdacCard } from "@/components/NafdacCard";
import { PathBadge } from "@/components/PathBadge";
import { ProviderSelect } from "@/components/ProviderSelect";
import { ResultCard } from "@/components/ResultCard";
import {
  explainViaCloud,
  fetchProviders,
  type ExplainResponse,
} from "@/lib/cloud";
import { resizeImageToJpeg } from "@/lib/image";
import { lookupNafdac, type NafdacLookupResult } from "@/lib/nafdac";
import type { ProviderId, ProviderInfo } from "@/lib/providers";

export function LabelWiseApp() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExplainResponse | null>(null);
  const [nafdac, setNafdac] = useState<NafdacLookupResult | null>(null);
  const [nafdacError, setNafdacError] = useState<string | null>(null);
  const [nafdacLoading, setNafdacLoading] = useState(false);
  const [path, setPath] = useState<"idle" | "cloud">("idle");
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [provider, setProvider] = useState<ProviderId | null>(null);
  const [providersError, setProvidersError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProviders(controller.signal)
      .then((payload) => {
        setProviders(payload.providers);
        setProvider(payload.default);
        setProvidersError(null);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setProvidersError(
          err instanceof Error ? err.message : "Could not load providers",
        );
      });
    return () => controller.abort();
  }, []);

  async function handleFile(file: File) {
    if (!provider) {
      setError("Choose an available AI provider first.");
      return;
    }

    const selected = providers.find((p) => p.id === provider);
    if (!selected?.available) {
      setError(`${selected?.label ?? "That provider"} is unavailable right now.`);
      return;
    }

    setBusy(true);
    setError(null);
    setResult(null);
    setNafdac(null);
    setNafdacError(null);
    setPath("cloud");

    try {
      const { dataUrl } = await resizeImageToJpeg(file);
      setPreviewUrl(dataUrl);

      const explanation = await explainViaCloud(dataUrl, provider);
      setResult(explanation);

      if (explanation.imageClarity === "clear") {
        if (explanation.nafdacRegNumber) {
          setNafdacLoading(true);
          try {
            const lookup = await lookupNafdac(
              explanation.nafdacRegNumber,
              explanation.productName,
            );
            setNafdac(lookup);
          } catch (err) {
            setNafdacError(
              err instanceof Error ? err.message : "NAFDAC lookup failed",
            );
          } finally {
            setNafdacLoading(false);
          }
        } else {
          // No NRN on label — surface failed state + retry input.
          setNafdac({
            status: "no_number",
            query: null,
            product: null,
            message: "No registration number found on the label.",
            greenbookUrl: "https://greenbook.nafdac.gov.ng/",
            napamsUrl: "https://registration.nafdac.gov.ng/",
          });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPath("idle");
    } finally {
      setBusy(false);
    }
  }

  const activeLabel =
    result?.provider === "openai"
      ? "OpenAI"
      : result?.provider === "gemma"
        ? "Gemma"
        : providers.find((p) => p.id === provider)?.shortLabel;

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <p className="font-[family-name:var(--font-display)] text-4xl leading-none tracking-tight text-[var(--foreground)] sm:text-5xl">
            LabelWise
          </p>
          <PathBadge
            path={path === "cloud" || result ? "cloud" : "idle"}
            detail={result || path === "cloud" ? activeLabel : undefined}
          />
        </div>
        <p className="max-w-md text-base leading-relaxed text-[var(--muted)]">
          Photograph a medicine box. Get a plain-language explanation, then an
          automatic NAFDAC registration lookup when a number is readable.
        </p>
      </header>

      <section className="space-y-4">
        <ProviderSelect
          providers={providers}
          value={provider}
          disabled={busy}
          onChange={setProvider}
        />
        {providersError ? (
          <p className="text-sm text-amber-800">{providersError}</p>
        ) : null}

        <CameraCapture
          disabled={busy || !provider || !providers.some((p) => p.id === provider && p.available)}
          onFile={handleFile}
        />
        {busy ? (
          <p className="text-sm font-medium text-[var(--accent)]">
            Reading the label…
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-950">
            {error}
          </p>
        ) : null}
      </section>

      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt="Selected medicine label"
          className="max-h-64 w-full rounded-lg object-contain bg-[var(--surface)]"
        />
      ) : null}

      {result ? <ResultCard result={result} /> : null}

      {result ? (
        <NafdacCard
          key={result.nafdacRegNumber ?? "none"}
          initialQuery={result.nafdacRegNumber}
          productNameHint={result.productName}
          autoResult={nafdac}
          autoError={nafdacError}
          autoLoading={nafdacLoading}
        />
      ) : null}
    </div>
  );
}
