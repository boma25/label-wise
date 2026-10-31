import { OUTPUT_SECTIONS, SAFETY_FOOTER, type ExplainResult } from "@/lib/prompt";

const SECTION_KEYS = [
  ["whatItIs", OUTPUT_SECTIONS[0]],
  ["whatItsFor", OUTPUT_SECTIONS[1]],
  ["howTaken", OUTPUT_SECTIONS[2]],
  ["warnings", OUTPUT_SECTIONS[3]],
  ["askPharmacistIf", OUTPUT_SECTIONS[4]],
] as const;

type Props = {
  result: ExplainResult;
};

export function ResultCard({ result }: Props) {
  if (result.imageClarity === "unclear") {
    return (
      <section className="space-y-4 border-t border-[var(--border)] pt-6">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--foreground)]">
          Photo too unclear
        </h2>
        <p className="text-[var(--muted)] leading-relaxed">
          {result.whatItIs ||
            "We could not read the label safely. Take another photo in good light, fill the frame with the front of the box, and avoid glare."}
        </p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--muted)]">
          <li>Hold steady and get closer to the text</li>
          <li>Include the NAFDAC number if printed</li>
          <li>Do not crop off dosing or warning panels</li>
        </ul>
        <p className="text-sm font-medium text-[var(--foreground)]">
          {SAFETY_FOOTER}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6 border-t border-[var(--border)] pt-6">
      {result.productName ? (
        <header>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
            From the label
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--foreground)]">
            {result.productName}
          </h2>
        </header>
      ) : null}

      <div className="space-y-5">
        {SECTION_KEYS.map(([key, title]) => (
          <div key={key}>
            <h3 className="text-sm font-semibold text-[var(--accent)]">
              {title}
            </h3>
            <p className="mt-1 whitespace-pre-wrap leading-relaxed text-[var(--foreground)]">
              {result[key] || "—"}
            </p>
          </div>
        ))}
      </div>

      <p className="border-t border-[var(--border)] pt-4 text-sm font-medium text-[var(--foreground)]">
        {SAFETY_FOOTER}
      </p>
    </section>
  );
}
