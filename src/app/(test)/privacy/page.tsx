import { Tbd } from "@/components/Tbd";

export const metadata = { title: "Privacy" };

/**
 * PHASE 1 stub. The policy is copy, so it is not written here (SPEC §0.4) —
 * it lands in Phase 5. What SPEC §12 requires it to say is listed below as
 * visible placeholders so the footer link works and the gaps are reviewable.
 *
 * §12 also flags that answers about someone's sex life are special-category
 * data under the GDPR. Whether /send needs a required consent line is a
 * question for whoever advises on the policy; the checkbox is built behind
 * REQUIRE_DATA_CONSENT, off by default.
 */
const REQUIRED_POINTS = [
  "[COPY TBD: that answers and scores are stored (Railway) and sent to GoHighLevel to deliver the results email]",
  "[COPY TBD: that they are kept until the person asks for deletion]",
  "[COPY TBD: that there are no third-party cookies, and no GA4 or Meta Pixel]",
  "[COPY TBD: the legal basis, and how to ask for deletion]",
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto w-full max-w-2xl flex-1 px-5 py-10 sm:px-8">
      <h1 className="font-display text-[clamp(2.2rem,8vw,3.5rem)] text-red">Privacy</h1>
      <p className="mt-6 text-ink">
        <Tbd>[COPY TBD: the privacy policy. Phase 5.]</Tbd>
      </p>
      <p className="mt-8 text-sm font-semibold uppercase tracking-[0.1em] text-ink-3">
        It must cover, per SPEC §12:
      </p>
      <ul className="mt-3 flex flex-col gap-3">
        {REQUIRED_POINTS.map((p) => (
          <li key={p} className="text-sm leading-relaxed">
            <Tbd>{p}</Tbd>
          </li>
        ))}
      </ul>
    </section>
  );
}
