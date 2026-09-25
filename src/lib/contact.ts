/**
 * Pure contact helpers. No DB access, so the logic is unit-testable.
 * `isValidEmail` / `normalizeEmail` are copied from taboo-quiz along with their
 * tests (SPEC §3).
 */

export const TAG_COMPLETED = "taboo-test-completed";
export const TAG_RETAKEN = "taboo-test-retaken";

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Deliberately stricter than RFC 5322. The old pattern was "no spaces, one @, a dot somewhere",
 * which accepted `a@b..com`, `.jane@x.com` and `jane@x.c0m`. Addresses like those are legal in
 * some readings of the spec but are typos every time in this context. Structure only — whether
 * the domain can actually receive mail is `domainCanReceiveMail()` in src/lib/email-domain.ts.
 */
const EMAIL_RE =
  /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;

export function isValidEmail(email: string): boolean {
  if (email.length > 254) return false;
  const at = email.lastIndexOf("@");
  if (at < 1 || at > 64) return false; // local part must be 1–64 characters
  return EMAIL_RE.test(email);
}
