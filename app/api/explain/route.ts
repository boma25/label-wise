import { NextResponse } from "next/server";
import {
  getProvider,
  isProviderId,
  pickDefaultProviderId,
} from "@/lib/providers";
import type { ProviderId } from "@/lib/providers";

export const maxDuration = 60;

const MAX_BASE64_CHARS = 6_000_000; // ~4.5MB binary

type Body = {
  imageDataUrl?: string;
  provider?: string;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const requested = body.provider;
  let providerId: ProviderId | null = null;

  if (requested != null && requested !== "") {
    if (!isProviderId(requested)) {
      return NextResponse.json(
        { error: `Unknown provider: ${String(requested)}` },
        { status: 400 },
      );
    }
    providerId = requested;
  } else {
    providerId = pickDefaultProviderId();
  }

  if (!providerId) {
    return NextResponse.json(
      {
        error: "No AI provider is available right now.",
      },
      { status: 503 },
    );
  }

  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json(
      { error: `Unknown provider: ${providerId}` },
      { status: 400 },
    );
  }

  if (!provider.isAvailable()) {
    return NextResponse.json(
      {
        error: `${provider.label} is not available. ${provider.unavailableReason}.`,
        provider: providerId,
      },
      { status: 503 },
    );
  }

  const imageDataUrl = body.imageDataUrl;
  if (!imageDataUrl || typeof imageDataUrl !== "string") {
    return NextResponse.json(
      { error: "imageDataUrl is required." },
      { status: 400 },
    );
  }

  const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    return NextResponse.json(
      { error: "imageDataUrl must be a base64 data URL." },
      { status: 400 },
    );
  }

  const mimeType = match[1];
  const data = match[2];
  if (!mimeType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are supported." },
      { status: 400 },
    );
  }
  if (data.length > MAX_BASE64_CHARS) {
    return NextResponse.json(
      { error: "Image is too large. Please use a smaller photo." },
      { status: 413 },
    );
  }

  try {
    const result = await provider.explain({ mimeType, data });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Explain failed";
    console.error("[/api/explain]", providerId, message);
    return NextResponse.json({ error: message, provider: providerId }, { status: 502 });
  }
}
