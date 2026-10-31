export type NafdacLookupStatus =
  | "found_active"
  | "found_inactive"
  | "not_found"
  | "error"
  | "no_number";

export type NafdacProduct = {
  registrationNumber: string;
  productName: string;
  status: string;
  applicantName: string | null;
  ingredientName: string | null;
  strength: string | null;
  formName: string | null;
  approvalDate: string | null;
  expiryDate: string | null;
  productId: number | null;
  nameMatchHint: "likely_match" | "possible_mismatch" | "unknown";
};

export type NafdacLookupResult = {
  status: NafdacLookupStatus;
  query: string | null;
  product: NafdacProduct | null;
  message: string;
  greenbookUrl: string;
  napamsUrl: string;
};

/** Register hit + product name aligns with the label (when a label name exists). */
export function isNafdacVerified(
  result: NafdacLookupResult | null | undefined,
  productNameHint?: string | null,
): boolean {
  if (!result) return false;
  if (result.status !== "found_active" && result.status !== "found_inactive") {
    return false;
  }
  if (!result.product) return false;

  const hasHint = Boolean(productNameHint?.trim());
  if (!hasHint) {
    // No label name to compare — accept register hit only.
    return true;
  }

  return result.product.nameMatchHint === "likely_match";
}

export function nafdacFailureReason(
  result: NafdacLookupResult | null | undefined,
  productNameHint?: string | null,
  networkError?: string | null,
): string {
  if (networkError) return "NAFDAC verification failed.";
  if (!result) return "NAFDAC verification failed.";

  if (
    result.status === "found_active" ||
    result.status === "found_inactive"
  ) {
    if (
      productNameHint?.trim() &&
      result.product?.nameMatchHint === "possible_mismatch"
    ) {
      return "NAFDAC verification failed — register name doesn’t match this product.";
    }
    if (
      productNameHint?.trim() &&
      result.product?.nameMatchHint === "unknown"
    ) {
      return "NAFDAC verification failed — couldn’t confirm the product name.";
    }
  }

  if (result.status === "not_found") {
    return "NAFDAC verification failed — number not found on the register.";
  }
  if (result.status === "no_number") {
    return "NAFDAC verification failed — no registration number to check.";
  }
  return "NAFDAC verification failed.";
}

export async function lookupNafdac(
  registrationNumber: string,
  productNameHint?: string | null,
  signal?: AbortSignal,
): Promise<NafdacLookupResult> {
  const res = await fetch("/api/nafdac", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      registrationNumber,
      productNameHint: productNameHint ?? null,
    }),
    signal,
  });

  const body = (await res.json().catch(() => ({}))) as NafdacLookupResult & {
    error?: string;
  };

  if (!res.ok) {
    throw new Error(
      body.error || body.message || `NAFDAC lookup failed (${res.status})`,
    );
  }

  return body;
}
