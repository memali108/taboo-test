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
 *
 * The track is OUTLINED and its zone edges are DRAWN, rather than relying on the
 * fills to separate themselves. On the white page, paper-3 against sea-soft is
 * 1.02:1 — a warm neutral and a cool tint of the same lightness cannot be told
 * apart by luminance, which is exactly the case colour-vision deficiency makes
 * worse. The dividers are `mute`, which is 2.86–3.77:1 against all three fills;
 * `line` would have been 1.07:1 against sea and vanished at that edge. `mute` is
 * barred from text, never from a rule.
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
        className="relative h-3 w-full overflow-hidden rounded-full border border-line"
        role="img"
        aria-label={`${score} out of ${MAX_SECTION_SCORE}, ${RESULTS.levelLabels[level]}`}
      >
        <div className="absolute inset-0 flex">
          {ZONES.map((z, i) => (
            <div
              key={z.key}
              className={`${z.className} ${i < ZONES.length - 1 ? "border-r border-mute" : ""}`}
              style={{ width: `${pct(z.to) - pct(z.from)}%` }}
            />
          ))}
        </div>
        <div
          className="absolute inset-y-0 w-1 -translate-x-1/2 rounded-full bg-red"
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
