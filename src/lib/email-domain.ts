import "server-only";
import { promises as dns } from "node:dns";

/**
 * Domain-level email checking: does this domain look capable of receiving mail?
 *
 * This validates the DOMAIN ONLY. It cannot tell whether a mailbox exists — nothing short of
 * sending can — so `jane@gmail.com` and `notarealperson@gmail.com` are equally acceptable here.
 * Its job is to catch `gmial.com`, `gmail.con` and domains that do not exist at all.
 *
 * It FAILS OPEN. A slow resolver, SERVFAIL, or an offline container accepts the address rather
 * than blocking a real person at the last step before conversion. Only a definitive negative from
 * DNS rejects: the domain does not exist (NXDOMAIN), or it exists and publishes no MX (ENODATA).
 *
 * An MX record is required, with no fallback to A/AAAA. RFC 5321 does permit delivery to a
 * domain's address record when it publishes no MX, but parked typo domains are exactly the case
 * that exploits: gmial.com has no MX and an A record pointing at an ad page, so an A fallback
 * would wave through the single most common typo this check exists to catch. Domains that
 * genuinely receive mail publish MX.
 */
const LOOKUP_TIMEOUT_MS = 2000;

/** Definitive answers only, for the lifetime of the process. Fail-open results are never cached. */
const cache = new Map<string, boolean>();

/** The domain part of an address, lower-cased, or null if there isn't one. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0) return null;
  return email.slice(at + 1).trim().toLowerCase() || null;
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("DNS_TIMEOUT")), ms);
  });
  return Promise.race([work, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

/** DNS said the name does not resolve, rather than failing to answer. */
const isDefinitiveMiss = (e: unknown) => {
  const code = (e as { code?: string }).code;
  return code === "ENOTFOUND" || code === "ENODATA";
};

/**
 * RFC 2606 reserves these for documentation and testing, so they will never have MX records.
 * The Playwright suite unlocks with `@example.com` addresses on every run; without this the
 * whole e2e suite would fail on an address that is correct for its purpose.
 */
const RESERVED_DOMAIN = /(^|\.)(example\.(com|net|org)|test|invalid|localhost)$/;

/** True if the domain can plausibly receive mail. Fails open; see the note at the top. */
export async function domainCanReceiveMail(domain: string): Promise<boolean> {
  if (RESERVED_DOMAIN.test(domain)) return true;

  const cached = cache.get(domain);
  if (cached !== undefined) return cached;
  try {
    const mx = await withTimeout(dns.resolveMx(domain), LOOKUP_TIMEOUT_MS);
    // RFC 7505 "null MX": a single record whose exchange is the root ("." — Node reports it as an
    // empty string) is a domain explicitly declaring that it accepts no mail. yahooo.com does
    // this, so counting records alone would wave it through.
    const usable = mx.filter((r) => r.exchange !== "" && r.exchange !== ".");
    const ok = usable.length > 0;
    cache.set(domain, ok);
    return ok;
  } catch (e) {
    if (isDefinitiveMiss(e)) {
      cache.set(domain, false); // NXDOMAIN, or the domain exists with no MX
      return false;
    }
    return true; // timeout or transient DNS failure: accept, and don't poison the cache
  }
}

/** Testing seam: the cache is process-wide and otherwise never cleared. */
export function __clearDomainCache() {
  cache.clear();
}
