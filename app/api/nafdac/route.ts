import { NextResponse } from "next/server";
import { normalizeNrn } from "@/lib/prompt";
import type {
  NafdacLookupResult,
  NafdacLookupStatus,
  NafdacProduct,
} from "@/lib/nafdac";

export const maxDuration = 30;

const GREENBOOK = "https://greenbook.nafdac.gov.ng/";
const NAPAMS = "https://registration.nafdac.gov.ng/";

type Body = {
  registrationNumber?: string;
  productNameHint?: string | null;
};

type GreenbookRow = {
  product_id?: number;
  product_name?: string;
  NAFDAC?: string;
  status?: string;
  strength?: string;
  approval_date?: string | null;
  expiry_date?: string | null;
  applicant_name?: string | null;
  ingredient_name?: string | null;
  form_name?: string | null;
};

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const query = normalizeNrn(body.registrationNumber ?? null);
  if (!query) {
    const empty: NafdacLookupResult = {
      status: "no_number",
      query: null,
      product: null,
      message:
        "No NAFDAC registration number to check. Enter one from the pack if you can see it.",
      greenbookUrl: GREENBOOK,
      napamsUrl: NAPAMS,
    };
    return NextResponse.json(empty);
  }

  try {
    const url = new URL(GREENBOOK);
    url.searchParams.set("draw", "1");
    url.searchParams.set("start", "0");
    url.searchParams.set("length", "25");
    url.searchParams.set("search[value]", query);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "LabelWise/0.1 (open-source; registry lookup)",
      },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        errorResult(query, `Greenbook returned ${res.status}. Try again or check on the official site.`),
        { status: 502 },
      );
    }

    const json = (await res.json()) as { data?: GreenbookRow[] };
    const rows = Array.isArray(json.data) ? json.data : [];
    const exact = rows.find(
      (row) => normalizeNrn(row.NAFDAC ?? null) === query,
    );
    const best = exact ?? rows[0] ?? null;

    if (!best || !best.NAFDAC) {
      const notFound: NafdacLookupResult = {
        status: "not_found",
        query,
        product: null,
        message:
          "This number was not found on the NAFDAC Greenbook. That does not prove the pack is fake — confirm on the official site or ask a pharmacist.",
        greenbookUrl: GREENBOOK,
        napamsUrl: NAPAMS,
      };
      return NextResponse.json(notFound);
    }

    const statusRaw = (best.status || "").trim();
    const lookupStatus: NafdacLookupStatus =
      statusRaw.toLowerCase() === "inactive"
        ? "found_inactive"
        : "found_active";

    const product: NafdacProduct = {
      registrationNumber: String(best.NAFDAC),
      productName: decodeHtml(String(best.product_name ?? "")).replace(
        /##\s*$/,
        "",
      ),
      status: statusRaw || "Unknown",
      applicantName: best.applicant_name ? String(best.applicant_name) : null,
      ingredientName: best.ingredient_name
        ? String(best.ingredient_name)
        : null,
      strength: best.strength ? String(best.strength) : null,
      formName: best.form_name ? String(best.form_name) : null,
      approvalDate: best.approval_date ? String(best.approval_date) : null,
      expiryDate: best.expiry_date ? String(best.expiry_date) : null,
      productId: typeof best.product_id === "number" ? best.product_id : null,
      nameMatchHint: nameMatchHint(
        body.productNameHint ?? null,
        best.product_name ?? null,
      ),
    };

    const detailUrl =
      product.productId != null
        ? `https://greenbook.nafdac.gov.ng/products/details/${product.productId}`
        : GREENBOOK;

    const result: NafdacLookupResult = {
      status: lookupStatus,
      query,
      product,
      message:
        lookupStatus === "found_inactive"
          ? "Found on the NAFDAC Greenbook, but the registration status is Inactive. This is not a genuine/fake verdict — ask a pharmacist and verify on official channels."
          : "Found on the NAFDAC Greenbook register. A registry match is not proof that this physical pack is genuine; use MAS scratch verification when available.",
      greenbookUrl: detailUrl,
      napamsUrl: NAPAMS,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "Greenbook lookup timed out. Try again or check the official site."
        : err instanceof Error
          ? err.message
          : "Greenbook lookup failed.";
    console.error("[/api/nafdac]", message);
    return NextResponse.json(errorResult(query, message), { status: 502 });
  }
}

function errorResult(query: string, message: string): NafdacLookupResult {
  return {
    status: "error",
    query,
    product: null,
    message,
    greenbookUrl: GREENBOOK,
    napamsUrl: NAPAMS,
  };
}

function decodeHtml(input: string): string {
  return input
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

const NAME_STOPWORDS = new Set([
  "tablet",
  "tablets",
  "capsule",
  "capsules",
  "syrup",
  "injection",
  "cream",
  "gel",
  "ointment",
  "oral",
  "suspension",
  "mg",
  "ml",
  "the",
  "and",
  "for",
]);

function nameMatchHint(
  hint: string | null,
  registeredName: string | null,
): NafdacProduct["nameMatchHint"] {
  if (!hint || !registeredName) return "unknown";
  const a = normalizeName(hint);
  const b = normalizeName(registeredName);
  if (!a || !b) return "unknown";
  if (a.includes(b) || b.includes(a)) return "likely_match";

  const tokens = (s: string) =>
    s.split(" ").filter((t) => t.length > 2 && !NAME_STOPWORDS.has(t));
  const aTokens = new Set(tokens(a));
  const bTokens = tokens(b);
  if (aTokens.size === 0 || bTokens.length === 0) return "possible_mismatch";

  const overlap = bTokens.filter((t) => aTokens.has(t)).length;
  // Require a real brand/ingredient token in common, not just form words.
  if (overlap >= 1) return "likely_match";
  return "possible_mismatch";
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/##/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
