import { LANDING } from "@/config/copy";
import { Tbd } from "@/components/Tbd";
import { Tracker } from "@/components/Tracker";
import { beginAction } from "./actions";

// Reads the entry URL's UTM parameters, so it cannot be static.
export const dynamic = "force-dynamic";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-5 py-10 sm:px-8">
      <Tracker event="tbt_landing_viewed" />
      <div className="animate-rise">
        <h1 className="font-display text-[clamp(2.4rem,9vw,4.5rem)] text-red">{LANDING.title}</h1>

        <p className="mt-6 max-w-prose text-lg leading-relaxed text-ink">
          {LANDING.intro} <Tbd>{LANDING.introTbd}</Tbd>
        </p>

        <p className="mt-4 max-w-prose text-lg leading-relaxed text-ink">
          <Tbd>{LANDING.expectationTbd}</Tbd>
        </p>

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.1em] text-ink">{LANDING.meta}</p>

        {/*
          A form, not a link: starting the test writes an Attempt row and sets a signed
          cookie, so it has to be a POST. It also works with JavaScript disabled.
        */}
        <form action={beginAction} className="mt-6">
          {UTM_KEYS.map((k) => (
            <input key={k} type="hidden" name={k} defaultValue={one(k)} />
          ))}
          <button
            type="submit"
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-red px-10 text-base font-semibold text-white transition hover:bg-red-deep active:scale-[0.98]"
          >
            {LANDING.button}
          </button>
        </form>
      </div>
    </section>
  );
}
