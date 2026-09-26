import { MAX_SECTION_SCORE, MIN_SECTION_SCORE, type Level } from "@/lib/scoring";
import { RESULTS } from "@/config/copy";

/**
 * The 5–25 meter from SPEC §7.5: three zones with a red marker at the score.
 *
 * The zones are the three sea tints, which step evenly — 1.22 / 1.58 / 2.03 against the
 * white page, 1.29 between neighbours — so the ramp reads as a ramp. (The earlier mix of
 * a warm neutral and a cool tint sat 1.02 apart and could not be separated by luminance
 * at all; the hairlines were carrying the whole boundary.)
 *
 * The hairlines stay, but their job has changed: they now mark exactly where 11.5 and
 * 18.5 fall, so you can see which side of a level edge the marker is on.
 *
 * Colour never carries the meaning on its own — the level is always written out in text
 * beside the meter, and the zone labels sit under the track.
 */
const SPAN = MAX_SECTION_SCORE - MIN_SECTION_SCORE; // 20
const pct = (score: number) => ((score - MIN_SECTION_SCORE) / SPAN) * 100;

const ZONES = [
  { key: "low" as const, from: MIN_SECTION_SCORE, to: 11.5, className: "bg-sea-soft" },
  { key: "medium" as const, from: 11.5, to: 18.5, className: "bg-sea" },
  { key: "high" as const, from: 18.5, to: MAX_SECTION_SCORE, className: "bg-sea-deep" },
];

export function ScoreMeter({ score, level }: { score: number; level: Level }) {
  return (
    <div>
      {/*
        The marker sits in this wrapper rather than inside the track, because the track
        clips to its rounded ends and the dot is taller than the track on purpose.
      */}
      <div
        className="relative"
        role="img"
        aria-label={`${score} out of ${MAX_SECTION_SCORE}, ${RESULTS.levelLabels[level]}`}
      >
        <div className="flex h-3 w-full overflow-hidden rounded-full border border-line">
          {ZONES.map((z, i) => (
            <div
              key={z.key}
              className={`${z.className} ${i < ZONES.length - 1 ? "border-r border-mute" : ""}`}
              style={{ width: `${pct(z.to) - pct(z.from)}%` }}
            />
          ))}
        </div>
        {/*
          Red on every zone: 10.95 on Low, 8.47 on Medium, 6.58 on High, so the dot clears
          the 3:1 SC 1.4.11 threshold wherever it lands and does not depend on the white
          ring to be seen. The ring is what keeps it crisp against the darker zones.
        */}
        <div
          className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red shadow-[0_1px_3px_rgba(46,31,42,0.35)]"
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
