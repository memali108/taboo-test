/**
 * What a submission does to a Contact, as a pure function (SPEC §8.1 tags, §9 numbering).
 * No database access here so it can be unit-tested; the server action wraps it in a
 * transaction.
 */
import { SECTIONS, type Section } from "@/config/test";
import type { Level, Scored } from "./scoring";

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

export const levelTag = (s: Section, l: Level) => `taboo-test-${s}-${l}`;
export const terrainTag = (s: Section) => `taboo-test-terrain-${s}`;

const LEVELS: Level[] = ["low", "medium", "high"];
/** Every tag this app manages, so a retake replaces rather than accumulates. */
const MANAGED = new Set<string>([
  ...SECTIONS.flatMap((s) => LEVELS.map((l) => levelTag(s, l))),
  ...SECTIONS.map(terrainTag),
]);

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

  // Drop the level and terrain tags from any previous attempt before adding this one's,
  // so a contact never carries two levels for the same section. Tags this app does not
  // manage — anything added by hand in GoHighLevel — are left alone.
  const tags = (existing?.tags ?? []).filter((t) => !MANAGED.has(t));

  for (const s of SECTIONS) tags.push(levelTag(s, scored.sections[s].level));
  // One tag per terrain section, so a two-way tie yields two and an all-equal result
  // yields none — matching `Attempt.terrain`, which is empty in that case (SPEC §6).
  for (const s of scored.terrain) tags.push(terrainTag(s));

  for (const t of [TAG_COMPLETED, TAG_SUBSTACK, TAG_SOURCE]) {
    if (!tags.includes(t)) tags.push(t);
  }
  if (isRetake && !tags.includes(TAG_RETAKEN)) tags.push(TAG_RETAKEN);

  return { attemptNumber, isRetake, tags };
}
