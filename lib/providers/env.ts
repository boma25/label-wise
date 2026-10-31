/** Read a server env var and strip whitespace / surrounding quotes. */
export function readEnv(name: string): string | null {
  const raw = process.env[name];
  if (raw == null) return null;
  const trimmed = raw.trim().replace(/^['"]|['"]$/g, "").trim();
  return trimmed.length > 0 ? trimmed : null;
}
