"use client";

import { useState, type FormEvent } from "react";
import {
  isNafdacVerified,
  lookupNafdac,
  nafdacFailureReason,
  type NafdacLookupResult,
} from "@/lib/nafdac";

type Props = {
  initialQuery: string | null;
  productNameHint: string | null;
  autoResult?: NafdacLookupResult | null;
  autoError?: string | null;
  autoLoading?: boolean;
};

export function NafdacCard({
  initialQuery,
  productNameHint,
  autoResult,
  autoError,
  autoLoading,
}: Props) {
  const [manualNrn, setManualNrn] = useState(initialQuery ?? "");
  const [manualResult, setManualResult] = useState<NafdacLookupResult | null>(
    null,
  );
  const [manualError, setManualError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const result = manualResult ?? autoResult ?? null;
  const networkError = manualError ?? autoError ?? null;
  const loading = checking || Boolean(autoLoading);
  const verified = isNafdacVerified(result, productNameHint);
  const failed = !loading && !verified;
  const showRetry = failed || checking;
  const failureCopy = failed
    ? nafdacFailureReason(result, productNameHint, networkError)
    : null;

  async function onRecheck(e: FormEvent) {
    e.preventDefault();
    setChecking(true);
    setManualError(null);
    try {
      const next = await lookupNafdac(manualNrn, productNameHint);
      setManualResult(next);
    } catch (err) {
      setManualResult(null);
      setManualError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setChecking(false);
    }
  }

  return (
    <section className="space-y-4 border-t border-[var(--border)] pt-6">
      <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
        NAFDAC register check
      </h2>

      {loading ? (
        <p className="text-sm text-[var(--muted)]">Checking Greenbook…</p>
      ) : null}

      {verified && result ? <StatusBlock result={result} /> : null}

      {failed ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {failureCopy}
        </p>
      ) : null}

      {showRetry ? (
        <form onSubmit={onRecheck} className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="nrn">
            NAFDAC registration number
          </label>
          <input
            id="nrn"
            value={manualNrn}
            onChange={(e) => setManualNrn(e.target.value)}
            placeholder="e.g. A4-100160"
            disabled={checking}
            className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none ring-[var(--accent)] focus:ring-2 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={checking || !manualNrn.trim()}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {checking ? "Checking…" : "Retry check"}
          </button>
        </form>
      ) : null}
    </section>
  );
}

function StatusBlock({ result }: { result: NafdacLookupResult }) {
  const tone =
    result.status === "found_active"
      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
      : "border-amber-300 bg-amber-50 text-amber-950";

  const title =
    result.status === "found_active"
      ? "On the NAFDAC register (Active)"
      : "On the NAFDAC register (Inactive)";

  return (
    <div className={`space-y-3 rounded-lg border px-4 py-3 ${tone}`}>
      <p className="text-sm font-semibold">{title}</p>
      {result.product ? (
        <dl className="grid gap-1 text-sm">
          <div>
            <dt className="inline text-[var(--muted)]">NRN: </dt>
            <dd className="inline font-medium">
              {result.product.registrationNumber}
            </dd>
          </div>
          <div>
            <dt className="inline text-[var(--muted)]">Registered name: </dt>
            <dd className="inline font-medium">{result.product.productName}</dd>
          </div>
          {result.product.applicantName ? (
            <div>
              <dt className="inline text-[var(--muted)]">Applicant: </dt>
              <dd className="inline">{result.product.applicantName}</dd>
            </div>
          ) : null}
          {result.product.ingredientName ? (
            <div>
              <dt className="inline text-[var(--muted)]">Ingredient: </dt>
              <dd className="inline">{result.product.ingredientName}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-1 text-sm font-medium">
        <a
          href={result.greenbookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Open Greenbook
        </a>
        <a
          href={result.napamsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Official NAFDAC verify
        </a>
      </div>
    </div>
  );
}
