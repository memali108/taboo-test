import "server-only";
import { headers } from "next/headers";
import { timingSafeEqual } from "./crypto";

/**
 * Recognises a request from the Playwright suite, so the rows it creates can be flagged
 * `isSeed` (see src/lib/seed.ts).
 *
 * This is a privileged marker — it suppresses the GoHighLevel webhook — so it fails
 * closed in every ambiguous case:
 *
 * - no `E2E_TOKEN` configured, or one shorter than 16 characters, and it is always false.
 *   That is what stops an empty or unset variable matching an empty or absent header,
 *   which would silently flag every real attempt as seed and mail nobody.
 * - the comparison is timing-safe.
 *
 * It only ever *adds* a flag. It cannot read anything, skip a rate limit, or reach admin.
 */
export const E2E_HEADER = "x-taboo-e2e";
const MIN_TOKEN_LENGTH = 16;

export async function isE2ERequest(): Promise<boolean> {
  const token = process.env.E2E_TOKEN?.trim();
  if (!token || token.length < MIN_TOKEN_LENGTH) return false;
  const sent = (await headers()).get(E2E_HEADER);
  if (!sent) return false;
  return timingSafeEqual(sent, token);
}
