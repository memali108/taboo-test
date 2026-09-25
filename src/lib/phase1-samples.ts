/**
 * PHASE 1 ONLY. Fake answer strings so the results page can be reviewed before
 * the Attempt model exists. Delete this file in Phase 3 together with the
 * fallback in src/app/r/[id]/page.tsx.
 *
 * Each string is 15 raw ratings of 1–5, in the locked statement order.
 */
export const PHASE1_SAMPLE_ANSWERS: Record<string, string> = {
  // Sex 10 Low · Death 21 High · Cash 15 Medium → terrain Sex. One of each level.
  "sample-mixed": "331215442443323",
  // Sex 12 · Death 16 · Cash 12 → Sex and Cash tied for lowest
  "sample-tie": "212121331441515",
  // 15 · 15 · 15 → all three tied, no terrain, all-equal copy variant
  "sample-equal": "333333333333333",
  // Sex 5 · Death 9 · Cash 7 → every section Low
  "sample-low": "151111225315535",
  // Sex 25 · Death 25 · Cash 21 → every section High, and Cash is still the terrain
  "sample-high": "515555551551155",
};

/** A stable, arbitrary pattern for any other id, so every link renders. */
export function sampleAnswersFor(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = "";
  for (let i = 0; i < 15; i++) {
    h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
    out += String((h % 5) + 1);
  }
  return out;
}
