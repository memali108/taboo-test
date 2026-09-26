/**
 * Scoring — SPEC §6. A pure function over the raw answer string, so it is
 * unit-testable and runs identically on the server and in the seed.
 *
 * INVARIANTS:
 * - `answers` holds RAW ratings ("1".."5"), never pre-reversed values.
 * - Item score = rating, or 6 − rating when the statement is reversed.
 * - Section total = sum of its 5 item scores → 5–25.
 * - Level: Low 5–11 · Medium 12–18 · High 19–25.
 * - Terrain = the section(s) with the LOWEST total. Two tied → both. All three
 *   tied → none, and the page uses the all-equal copy variant.
 *
 * There is no "lowest statement per section" here any more: nothing consumed it once the
 * `taboo_*_lowest_statement` payload fields were dropped, and the Medium copy asks the
 * reader to identify their own lowest-rated statement rather than being told it.
 *
 * Nothing here is secret (SPEC §6), so there is no `server-only` guard — but a
 * client-computed score is still never trusted. Scoring runs at /send submit.
 */
import {
  REVERSED_BY_VERSION,
  SECTIONS,
  SECTION_SIZE,
  STATEMENT_COUNT,
  TEST_VERSION,
  sectionIndices,
  type Section,
} from "@/config/test";

export type Level = "low" | "medium" | "high";

export type SectionResult = {
  section: Section;
  /** 5–25 */
  total: number;
  level: Level;
  /** The five item scores, after reversal, in statement order. */
  items: number[];
};

export type Scored = {
  testVersion: string;
  sections: Record<Section, SectionResult>;
  /** Lowest-scoring section(s). Empty when all three tie. */
  terrain: Section[];
};

export const MIN_SECTION_SCORE = SECTION_SIZE * 1;
export const MAX_SECTION_SCORE = SECTION_SIZE * 5;

export function levelFor(total: number): Level {
  if (total <= 11) return "low";
  if (total <= 18) return "medium";
  return "high";
}

/** True when the string is exactly 15 characters, each "1".."5". */
export function isCompleteAnswers(answers: string): boolean {
  return answers.length === STATEMENT_COUNT && /^[1-5]{15}$/.test(answers);
}

function reversedSet(version: string): Set<number> {
  const list = REVERSED_BY_VERSION[version];
  if (!list) throw new Error(`Unknown TEST_VERSION "${version}"`);
  return new Set(list);
}

/** Item score for one statement: the rating, flipped if the statement is reversed. */
export function itemScore(rating: number, reversed: boolean): number {
  return reversed ? 6 - rating : rating;
}

export function score(answers: string, version: string = TEST_VERSION): Scored {
  if (!isCompleteAnswers(answers)) {
    throw new Error(`score() needs ${STATEMENT_COUNT} ratings of 1–5, got ${JSON.stringify(answers)}`);
  }
  const reversed = reversedSet(version);
  const ratings = answers.split("").map(Number);

  const sections = {} as Record<Section, SectionResult>;
  for (const section of SECTIONS) {
    const idx = sectionIndices(section);
    const items = idx.map((i) => itemScore(ratings[i], reversed.has(i)));
    const total = items.reduce((a, b) => a + b, 0);
    sections[section] = { section, total, level: levelFor(total), items };
  }

  const totals = SECTIONS.map((s) => sections[s].total);
  const min = Math.min(...totals);
  const lowestSections = SECTIONS.filter((s) => sections[s].total === min);
  // All three equal means there is no single terrain (SPEC §6).
  const terrain = lowestSections.length === SECTIONS.length ? [] : lowestSections;

  return { testVersion: version, sections, terrain };
}
