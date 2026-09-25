import { MAX_SECTION_SCORE, MIN_SECTION_SCORE, type Level } from "@/lib/scoring";
import { RESULTS } from "@/config/copy";

/**
 * The 5–25 meter from SPEC §7.5: three zones behind a red marker at the score.
 *
 * Zones are paper-3 / sea-soft / sea. Colour never carries the meaning on its
 * own — the level is always written out in text beside it, and the zone labels
 * sit under the track.
 *
 * Zone edges sit on the half-point between adjacent levels (11|12 → 11.5,
 * 18|19 → 18.5) so a score of 11 lands inside Low rather than on its boundary.
 */
const SPAN = MAX_SECTION_SCORE - MIN_SECTION_SCORE; // 20
const pct = (score: number) => ((score - MIN_SECTION_SCORE) / SPAN) * 100;

const ZONES = [
  { key: "low" as const, from: MIN_SECTION_SCORE, to: 11.5, className: "bg-paper-3" },
  { key: "medium" as const, from: 11.5, to: 18.5, className: "bg-sea-soft" },
  { key: "high" as const, from: 18.5, to: MAX_SECTION_SCORE, className: "bg-sea" },
];

export function ScoreMeter({ score, level }: { score: number; level: Level }) {
  return (
    <div>
      <div
        className="relative h-3 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`${score} out of ${MAX_SECTION_SCORE}, ${RESULTS.levelLabels[level]}`}
      >
        <div className="absolute inset-0 flex">
          {ZONES.map((z) => (
            <div key={z.key} className={z.className} style={{ width: `${pct(z.to) - pct(z.from)}%` }} />
          ))}
        </div>
        <div
          className="absolute top-0 h-3 w-1 -translate-x-1/2 rounded-full bg-red"
          style={{ left: `${pct(score)}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1 flex justify-between text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink-3">
        <span>{RESULTS.zoneLabels.low}</span>
        <span>{RESULTS.zoneLabels.medium}</span>
        <span>{RESULTS.zoneLabels.high}</span>
      </div>
    </div>
  );
}
