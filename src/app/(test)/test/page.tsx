import { redirect } from "next/navigation";
import { currentAttempt } from "@/lib/attempt";
import { TestFlow } from "@/components/test/TestFlow";

export const dynamic = "force-dynamic";
export const metadata = { title: "The Taboo Test", robots: { index: false } };

/**
 * The 18 screens (SPEC §4.2). An attempt has to exist first — the landing page's Begin
 * is what creates it — and a finished one goes where it belongs rather than being
 * answered twice (SPEC §4.5).
 */
export default async function TestPage() {
  const attempt = await currentAttempt();
  if (!attempt) redirect("/");
  if (attempt.status === "submitted") redirect(`/r/${attempt.publicId}`);
  if (attempt.status === "completed") redirect("/send");

  return <TestFlow attemptId={attempt.id} initialAnswers={attempt.answers} />;
}
