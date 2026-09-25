/**
 * Rows created by an automated test run.
 *
 * Playwright drives the deployed app against the live database (there is no separate dev
 * database), so its rows have to be distinguishable from real ones. A run sends a secret
 * header; anything created while it is present is flagged `isSeed`.
 *
 * Two invariants hang off that flag, both of which matter:
 *
 *   1. **A seed row NEVER triggers the GoHighLevel webhook.** Otherwise a test run mails
 *      a real person, or burns a real GHL contact record.
 *   2. **Admin stats exclude seed rows**, so test traffic never shows up in the funnel.
 *
 * The decision is taken from the stored row, not from the request that happens to be in
 * flight: an attempt flagged at creation stays flagged through submission even if that
 * later request arrives without the header.
 */

/** Prisma `where` fragment for "real rows only". Every admin query starts from this. */
export const NOT_SEED = { isSeed: false } as const;

/**
 * The webhook guard. Phase 4's sender must call this and deliver only when it is true.
 * It exists now, ahead of the sender, so the rule is written down and tested rather than
 * remembered.
 */
export function shouldDeliverWebhook(attempt: { isSeed: boolean }): boolean {
  return !attempt.isSeed;
}
