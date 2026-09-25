import { STATEMENT_COUNT } from "@/config/test";

/**
 * `Attempt.answers` is a dense prefix of raw ratings, "1".."5", at most 15 characters
 * (SPEC §6). Pure so it can be unit-tested; the route handler is the only caller.
 *
 * Unlike Taboo Tango, answering statement *n* again OVERWRITES in place and does not
 * truncate what follows. Tango truncates because its key is positional across the whole
 * quiz and a changed answer re-scores everything after it. Here each statement scores
 * independently inside its section, so there is nothing downstream to invalidate — and
 * truncating would silently throw away answers the person already gave.
 */
export class AnswerError extends Error {}

export function applyAnswer(answers: string, index: number, rating: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= STATEMENT_COUNT) {
    throw new AnswerError(`statement index out of range: ${index}`);
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AnswerError(`rating out of range: ${rating}`);
  }
  // No gaps: you may overwrite an answered statement or add the next one, never skip
  // ahead. A gap would make `answers.length` lie about how far along someone is.
  if (index > answers.length) {
    throw new AnswerError(`cannot answer statement ${index} with only ${answers.length} answered`);
  }
  return answers.slice(0, index) + String(rating) + answers.slice(index + 1);
}

export const answeredCount = (answers: string) => answers.length;
export const isComplete = (answers: string) => answers.length >= STATEMENT_COUNT;
