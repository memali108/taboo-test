/**
 * Public origin of this deployment, without a trailing slash.
 *
 * Single source for absolute URLs so the app and the GoHighLevel webhook payload
 * point at the same place. NEXT_PUBLIC_* is inlined at build time, so changing it
 * needs a redeploy.
 *
 * The fallback uses `||`, not `??`, on purpose. The Dockerfile sets
 * `ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL`, which is the EMPTY STRING
 * when no build arg is passed — `??` would let that through and `new URL("")`
 * throws. See taboo-quiz docs/DECISIONS.md, "Domain move".
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
}

/** Absolute URL of a results page. */
export function resultUrl(publicId: string): string {
  return `${siteUrl()}/r/${publicId}`;
}

/** Results page URL as linked from the results email, carrying attribution (SPEC §8.1). */
export function emailResultUrl(publicId: string): string {
  const u = new URL(resultUrl(publicId));
  u.searchParams.set("utm_source", "email");
  u.searchParams.set("utm_medium", "results");
  return u.toString();
}
