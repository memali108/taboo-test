import "server-only";
import { prisma } from "./db";

export type PreviousSubmission = {
  submittedAt: Date;
  sexScore: number;
  deathScore: number;
  cashScore: number;
};

/**
 * The contact's most recent submitted attempt BEFORE this one, or null on a first take.
 *
 * Feeds `taboo_prev_*` and `taboo_change_line` in the GoHighLevel payload (SPEC §8.1).
 * It is deliberately not used by the results page: anyone can type any email into /send,
 * so showing past scores there would expose someone else's results. They belong only in
 * the email, which reaches the address's owner (SPEC §2).
 */
export async function previousSubmission(
  contactId: string,
  excludeAttemptId: string,
): Promise<PreviousSubmission | null> {
  const prev = await prisma.attempt.findFirst({
    where: {
      contactId,
      status: "submitted",
      id: { not: excludeAttemptId },
      submittedAt: { not: null },
      sexScore: { not: null },
    },
    orderBy: { submittedAt: "desc" },
    select: { submittedAt: true, sexScore: true, deathScore: true, cashScore: true },
  });
  if (!prev?.submittedAt || prev.sexScore === null || prev.deathScore === null || prev.cashScore === null) {
    return null;
  }
  return {
    submittedAt: prev.submittedAt,
    sexScore: prev.sexScore,
    deathScore: prev.deathScore,
    cashScore: prev.cashScore,
  };
}
