import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { score, isCompleteAnswers } from "@/lib/scoring";
import { isPublicId } from "@/lib/public-id";
import { ResultsView } from "@/components/results/ResultsView";
import { ResultTracker } from "@/components/results/ResultTracker";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your results",
  // These are personal answers about sex, death and money. `Referrer-Policy: no-referrer`
  // for /r/* is set in next.config.ts.
  robots: { index: false, follow: false },
};

/**
 * The private results page (SPEC §7.5). Rendered from the database, reachable only by
 * the 24-character random `publicId` — which is the only guard, because the link has to
 * keep working from the results email.
 *
 * It shows NO first name, NO email address and NO past scores. Anyone can type any
 * address into /send, so past scores on this page would expose someone else's results;
 * they go in the email, which only reaches the address's owner (SPEC §2).
 */
export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  // Cheap shape check first, so a junk URL never reaches the database.
  if (!isPublicId(id)) notFound();

  const attempt = await prisma.attempt.findUnique({
    where: { publicId: id },
    select: { id: true, status: true, answers: true, testVersion: true, resultViewedAt: true },
  });
  if (!attempt || attempt.status !== "submitted" || !isCompleteAnswers(attempt.answers)) notFound();

  const sp = await searchParams;
  const source = (Array.isArray(sp.utm_source) ? sp.utm_source[0] : sp.utm_source) === "email" ? "email" : "submit";

  // First view only, so a re-read months later does not overwrite the original timestamp.
  if (!attempt.resultViewedAt) {
    await prisma.attempt
      .update({ where: { id: attempt.id }, data: { resultViewedAt: new Date() } })
      .catch(() => {});
  }

  return (
    <main className="flex min-h-dvh flex-col bg-paper">
      <ResultTracker source={source} />
      <ResultsView scored={score(attempt.answers, attempt.testVersion)} />
    </main>
  );
}
