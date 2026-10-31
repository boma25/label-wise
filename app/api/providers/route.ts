import { connection, NextResponse } from "next/server";
import { getProvidersPayload } from "@/lib/providers";

export async function GET() {
  // Wait for a real request so env-based availability is not frozen at build.
  await connection();
  return NextResponse.json(getProvidersPayload(), {
    headers: { "Cache-Control": "no-store" },
  });
}
