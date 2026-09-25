import Link from "next/link";
import { LANDING } from "@/config/copy";
import { Tbd } from "@/components/Tbd";

export default function LandingPage() {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-10 sm:px-8">
      <div className="animate-rise">
        <h1 className="font-display text-[clamp(2.4rem,9vw,4.5rem)] text-red">{LANDING.title}</h1>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink">
          {LANDING.intro} <Tbd>{LANDING.introTbd}</Tbd>
        </p>

        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink">
          <Tbd>{LANDING.expectationTbd}</Tbd>
        </p>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.1em] text-ink">{LANDING.meta}</p>

        <div className="mt-6">
          <Link
            href="/test"
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-red px-10 text-base font-semibold text-white no-underline transition hover:bg-red-deep active:scale-[0.98]"
          >
            {LANDING.button}
          </Link>
        </div>
      </div>
    </section>
  );
}
