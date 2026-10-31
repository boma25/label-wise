"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ProviderId, ProviderInfo } from "@/lib/providers";

type Props = {
  providers: ProviderInfo[];
  value: ProviderId | null;
  disabled?: boolean;
  onChange: (id: ProviderId) => void;
};

const FALLBACK: ProviderInfo[] = [
  {
    id: "gemma",
    label: "Gemma 4 (Gemini)",
    shortLabel: "Gemma",
    model: "gemma-4-26b-a4b-it",
    available: false,
  },
  {
    id: "openai",
    label: "OpenAI",
    shortLabel: "OpenAI",
    model: "gpt-4o-mini",
    available: false,
  },
];

export function ProviderSelect({
  providers,
  value,
  disabled,
  onChange,
}: Props) {
  const list = providers.length > 0 ? providers : FALLBACK;
  const selected = list.find((p) => p.id === value) ?? null;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative space-y-1.5">
      <label
        id={`${listId}-label`}
        className="block text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]"
      >
        AI provider
      </label>

      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${listId}-label`}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-left text-sm outline-none ring-[var(--accent)] transition hover:bg-[var(--surface)] focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="min-w-0 truncate font-medium text-[var(--foreground)]">
          {selected?.label ?? "Select a provider"}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {selected ? <StatusTag available={selected.available} /> : null}
          <Chevron open={open} />
        </span>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-labelledby={`${listId}-label`}
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-lg"
        >
          {list.map((p) => {
            const isSelected = value === p.id;
            return (
              <li key={p.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={!p.available || disabled}
                  onClick={() => {
                    if (!p.available) return;
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition ${
                    isSelected ? "bg-[var(--surface)]" : "hover:bg-[var(--surface)]"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  <span className="min-w-0 truncate font-medium text-[var(--foreground)]">
                    {p.label}
                  </span>
                  <StatusTag available={p.available} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function StatusTag({ available }: { available: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ${
        available
          ? "bg-emerald-100 text-emerald-800"
          : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {available ? "Available" : "Unavailable"}
    </span>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={`size-4 text-[var(--muted)] transition ${open ? "rotate-180" : ""}`}
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
