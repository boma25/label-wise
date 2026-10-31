/**
 * Deferred: MediaPipe / LiteRT on-device Gemma loader + inference.
 * Do not import this from server components.
 */
export async function explainOnDevice(_imageDataUrl: string): Promise<never> {
  throw new Error(
    "On-device Gemma is not enabled yet. Use the cloud path (/api/explain).",
  );
}
