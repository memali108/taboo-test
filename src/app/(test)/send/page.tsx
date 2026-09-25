import { redirect } from "next/navigation";
import { currentAttempt } from "@/lib/attempt";
import { requiresDataConsent } from "@/lib/config";
import { STATEMENT_COUNT } from "@/config/test";
import { SEND } from "@/config/copy";
import { Tbd } from "@/components/Tbd";
import { Tracker } from "@/components/Tracker";
import { SendForm } from "./SendForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Where should I send your results?", robots: { index: false } };

/** First name + email, after the last statement (SPEC §4.3, §7.4). */
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
        <p className="mt-4 text-lg leading-relaxed text-ink">
          <Tbd>{SEND.body}</Tbd>
        </p>
        <SendForm requireDataConsent={requiresDataConsent()} />
      </div>
    </section>
  );
}
