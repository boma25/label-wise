type Path = "cloud" | "on-device" | "idle";

const LABELS: Record<Path, string> = {
  cloud: "Cloud",
  "on-device": "On-device",
  idle: "Ready",
};

export function PathBadge({
  path,
  detail,
}: {
  path: Path;
  detail?: string;
}) {
  const label = detail ? `${LABELS[path]} · ${detail}` : LABELS[path];

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-medium tracking-wide text-[var(--muted)]"
      title={
        path === "cloud"
          ? "Image is sent to the selected cloud AI provider"
          : path === "on-device"
            ? "Inference runs in your browser"
            : "Choose a photo to begin"
      }
    >
      <span
        className={`size-1.5 rounded-full ${
          path === "cloud"
            ? "bg-[var(--accent)]"
            : path === "on-device"
              ? "bg-emerald-600"
              : "bg-zinc-400"
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}
