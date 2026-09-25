import { redirect } from "next/navigation";
import { currentAttempt } from "@/lib/attempt";
import { STATEMENT_COUNT } from "@/config/test";
import { SEND } from "@/config/copy";
import { Tbd } from "@/components/Tbd";
import { Tracker } from "@/components/Tracker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Where should I send your results?", robots: { index: false } };

/**
 * PHASE 2 STUB. The heading is settled copy (SPEC Appendix A); everything else on this
 * step is still `[COPY TBD]`, and the form itself — first name, email, the optional
 * mailing-list box and every safeguard from SPEC §7.4 — is Phase 3.
 *
 * It exists now because finishing statement 15 has to land somewhere (SPEC §4.3).
 */
export default async function SendPage() {
  const attempt = await currentAttempt();
  if (!attempt) redirect("/");
  if (attempt.status === "submitted") redirect(`/r/${attempt.publicId}`);
  if (attempt.status === "started") redirect("/test");

  return (
    <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-10 sm:px-8">
      <Tracker event="tbt_send_viewed" />
      <div className="animate-rise">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink">
          {STATEMENT_COUNT} of {STATEMENT_COUNT}
        </p>
        <h1 className="font-display text-[clamp(2.2rem,8vw,3.5rem)] text-red">{SEND.heading}</h1>

        <div className="mt-6 flex flex-col gap-4 text-lg leading-relaxed text-ink">
          <p>
            <Tbd>{SEND.body}</Tbd>
          </p>
          <p>
            <Tbd>{SEND.consentLabel}</Tbd>
          </p>
          <p>
            <Tbd>{SEND.button}</Tbd>
          </p>
          <p className="text-sm">
            <Tbd>{SEND.finePrint}</Tbd>
          </p>
        </div>

        <p className="mt-10 rounded-xl border border-line bg-paper-2 px-4 py-3 text-sm text-ink">
          Phase 2 preview · your 15 answers are saved. The form and its safeguards are Phase 3.
        </p>
      </div>
    </section>
  );
}
