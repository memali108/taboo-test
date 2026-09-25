import { RESULTS, SECTION_COPY } from "@/config/copy";
import { SECTIONS } from "@/config/test";
import { MAX_SECTION_SCORE, type Scored } from "@/lib/scoring";
import { terrainLine } from "@/lib/terrain";
import { Wordmark } from "@/components/Wordmark";
import { Tbd } from "@/components/Tbd";
import { ScoreMeter } from "./ScoreMeter";

const isTbd = (s: string) => s.startsWith("[COPY TBD");
const Copy = ({ text }: { text: string }) => (isTbd(text) ? <Tbd>{text}</Tbd> : <>{text}</>);

/**
 * The results page body (SPEC §7.5). Renders scores, levels, the terrain line
 * and only the copy for the level each section actually landed on.
 *
 * Never renders a first name, an email address, or any past attempt's scores —
 * anyone can type any email into /send, so past scores live in the email only
 * (SPEC §2).
 */
export function ResultsView({ scored }: { scored: Scored }) {
  const { sections, terrain } = scored;
  const isTerrain = (s: (typeof SECTIONS)[number]) => terrain.includes(s);

  return (
    <div className="mx-auto w-full max-w-2xl px-5 py-8 sm:px-8">
      <Wordmark />

      <h1 className="font-display mt-8 text-[clamp(2.2rem,8vw,3.75rem)] text-red">{RESULTS.heading}</h1>
      <p className="mt-5 max-w-prose text-lg leading-relaxed text-ink">{RESULTS.intro}</p>

      {/* Summary strip */}
      <div className="mt-10 flex flex-col gap-6 rounded-2xl border border-line bg-white p-5 sm:p-6">
        {SECTIONS.map((s) => {
          const r = sections[s];
          return (
            <div key={s}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="font-display text-2xl uppercase text-ink">{SECTION_COPY[s].name}</h2>
                <p className="text-sm text-ink">
                  <span className="font-semibold">
                    {r.total} / {MAX_SECTION_SCORE}
                  </span>{" "}
                  · {RESULTS.levelLabels[r.level]}
                </p>
              </div>
              <div className="mt-3">
                <ScoreMeter score={r.total} level={r.level} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Terrain line */}
      <p className="mt-8 max-w-prose text-lg leading-relaxed text-ink">
        <Copy text={terrainLine(terrain)} />
      </p>

      {/* Section blocks, always in Sex → Death → Cash order */}
      <div className="mt-12 flex flex-col gap-10">
        {SECTIONS.map((s) => {
          const r = sections[s];
          const copy = SECTION_COPY[s];
          const here = isTerrain(s);
          return (
            <section
              key={s}
              className={here ? "rounded-2xl bg-sea-soft p-5 sm:p-6" : undefined}
              aria-labelledby={`sec-${s}`}
            >
              {here && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
                  {RESULTS.terrainLabel}
                </p>
              )}
              <h2 id={`sec-${s}`} className="font-display text-[clamp(2rem,7vw,3rem)] uppercase text-red">
                {copy.name}
              </h2>
              <p className="mt-1 text-lg italic text-ink-2">{copy.subtitle}</p>
              <p className="mt-4 max-w-prose leading-relaxed text-ink">{copy.description}</p>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.1em] text-ink-3">
                {RESULTS.levelLabels[r.level]} · {r.total} / {MAX_SECTION_SCORE}
              </h3>
              {copy.levels[r.level].page.map((p, i) => (
                <p key={i} className="mt-4 max-w-prose leading-relaxed text-ink">
                  {p}
                </p>
              ))}
            </section>
          );
        })}
      </div>

      {/* Closing */}
      <div className="mt-14 border-t border-line pt-8">
        <p className="max-w-prose text-lg leading-relaxed text-ink">
          <Copy text={RESULTS.loopLine} />
        </p>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-ink">{RESULTS.deliverabilityNote}</p>
        <p className="mt-10 text-sm">
          <Copy text={RESULTS.retakeLink} />
        </p>
      </div>
    </div>
  );
}
