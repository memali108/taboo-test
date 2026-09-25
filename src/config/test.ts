/**
 * The shape of the test: which statements exist, in which order, in which
 * section, and which are reversed. Client-safe — nothing here is secret.
 *
 * INVARIANT (SPEC §5.2, §6): order, wording and reversal flags are locked per
 * TEST_VERSION. `Attempt.answers` stores raw ratings positionally, so reordering
 * or re-flagging silently re-scores every historical row. Changing any of them
 * means bumping TEST_VERSION, never editing in place.
 *
 * Statement *wording* lives in src/config/copy.ts (SPEC §0.4: copy lives in one
 * file). This file owns the structure that scoring depends on.
 */
import { STATEMENT_TEXT_V1 } from "./copy";

export const TEST_ID = "taboo-test";
export const TEST_VERSION = "v1";

export const SECTIONS = ["sex", "death", "cash"] as const;
export type Section = (typeof SECTIONS)[number];

export const STATEMENT_COUNT = 15;
export const SECTION_SIZE = 5;

/**
 * Reversed statements, by zero-based index, keyed by version. A reversed item
 * scores `6 − rating`. The UI never flips the scale — see SPEC §2.
 */
export const REVERSED_BY_VERSION: Record<string, readonly number[]> = {
  v1: [1, 8, 11, 12, 14],
};

export const REVERSED = new Set(REVERSED_BY_VERSION[TEST_VERSION]);

export type Statement = {
  /** Zero-based position in the locked order. */
  index: number;
  section: Section;
  /** 1-based position within its section, for "the one statement you rated lowest". */
  positionInSection: number;
  text: string;
  reversed: boolean;
};

export const STATEMENTS: readonly Statement[] = STATEMENT_TEXT_V1.map((text, index) => ({
  index,
  section: SECTIONS[Math.floor(index / SECTION_SIZE)],
  positionInSection: (index % SECTION_SIZE) + 1,
  text,
  reversed: REVERSED.has(index),
}));

/** The five statement indices belonging to a section, in order. */
export const sectionIndices = (section: Section): number[] => {
  const start = SECTIONS.indexOf(section) * SECTION_SIZE;
  return Array.from({ length: SECTION_SIZE }, (_, i) => start + i);
};

export const statementsIn = (section: Section): Statement[] =>
  sectionIndices(section).map((i) => STATEMENTS[i]);

/** Screen order: a section title card, then that section's five statements. (SPEC §4) */
export type Screen =
  | { kind: "title"; section: Section }
  | { kind: "statement"; section: Section; statementIndex: number };

export const SCREENS: readonly Screen[] = SECTIONS.flatMap((section) => [
  { kind: "title", section } as Screen,
  ...sectionIndices(section).map((statementIndex) => ({ kind: "statement", section, statementIndex }) as Screen),
]);
