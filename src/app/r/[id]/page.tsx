import type { Metadata } from "next";
import { ResultsView } from "@/components/results/ResultsView";
import { score } from "@/lib/scoring";
import { PHASE1_SAMPLE_ANSWERS, sampleAnswersFor } from "@/lib/phase1-samples";

/**
 * PHASE 1 ONLY — the look, not the data.
 *
 * Nothing is read from the database yet. The id is turned into a plausible
 * answer string so the page can be reviewed against real scoring, real levels
 * and real terrain logic. Phase 3 replaces this with the Attempt lookup and a
 * 404 for unknown ids (SPEC §15).
 *
 * Named ids render the interesting cases:
 *   /r/sample-mixed   one lowest section
 *   /r/sample-tie     two sections tied for lowest
 *   /r/sample-equal   all three tied — no terrain
 *   /r/sample-low     every section Low
 *   /r/sample-high    every section High
 * Any other id hashes to a stable pattern of its own.
 */
export const metadata: Metadata = {
  title: "Your results",
  // These are personal answers about sex, death and money.
  robots: { index: false, follow: false },
};

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const answers = PHASE1_SAMPLE_ANSWERS[id] ?? sampleAnswersFor(id);
  return (
    <main className="flex min-h-dvh flex-col bg-paper">
      <ResultsView scored={score(answers)} />
      <p className="mx-auto w-full max-w-2xl px-5 pb-10 text-xs text-ink-3 sm:px-8">
        Phase 1 preview · scores generated from the URL, not from a saved attempt.
      </p>
    </main>
  );
}
