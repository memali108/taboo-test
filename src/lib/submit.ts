/**
 * What a submission does to a Contact, as a pure function (SPEC §8.1 tags, §9 numbering).
 * No database access here so it can be unit-tested; the server action wraps it in a
 * transaction.
 */
import type { Scored } from "./scoring";

export const TAG_COMPLETED = "taboo-test-completed";
export const TAG_RETAKEN = "taboo-test-retaken";

/**
 * Applied to everyone who submits, because taking the test means they came from the
 * Substack list. `substack-subscriber` is load-bearing in GoHighLevel: a workflow removes
 * the contact from the Taboo Tango nurture sequence when it appears, so a subscriber does
 * not get courted as a new lead. The monthly Substack CSV import applies it too; both
 * paths agreeing is the point. See docs/GHL_SETUP.md.
 */
export const TAG_SUBSTACK = "substack-subscriber";
export const TAG_SOURCE = "source-taboo-test";

/**
 * Tags this app used to emit, one per section level and one per terrain section. They are
 * gone: the emails read the `taboo_*_level` and `taboo_terrain_line` fields directly, so
 * the tags were duplicating payload data as GoHighLevel state that then had to be kept in
 * step. Any that survive on a contact are stripped on their next submission.
 *
 * Note this only cleans up OUR record. Tags already applied inside GoHighLevel stay there
 * until removed in GHL — see docs/GHL_SETUP.md.
 */
const RETIRED_TAG = /^taboo-test-(sex|death|cash)-(low|medium|high)$|^taboo-test-terrain-(sex|death|cash)$/;

export type ContactSnapshot = { attemptCount: number; tags: string[] } | null;

export type SubmissionPlan = {
  /** 1 on a first submission, incrementing per email thereafter. */
  attemptNumber: number;
  isRetake: boolean;
  tags: string[];
};

export function computeSubmission(existing: ContactSnapshot, scored: Scored): SubmissionPlan {
  const isRetake = (existing?.attemptCount ?? 0) > 0;
  const attemptNumber = (existing?.attemptCount ?? 0) + 1;

  // Strip any retired level/terrain tags. Tags this app does not manage — anything added
  // by hand in GoHighLevel — are left alone.
  const tags = (existing?.tags ?? []).filter((t) => !RETIRED_TAG.test(t));

  for (const t of [TAG_COMPLETED, TAG_SUBSTACK, TAG_SOURCE]) {
    if (!tags.includes(t)) tags.push(t);
  }
  if (isRetake && !tags.includes(TAG_RETAKEN)) tags.push(TAG_RETAKEN);

  return { attemptNumber, isRetake, tags };
}
