import { describe, it, expect } from "vitest";
import { score, isCompleteAnswers } from "@/lib/scoring";
import { PHASE1_SAMPLE_ANSWERS, sampleAnswersFor } from "@/lib/phase1-samples";

/** PHASE 1 ONLY — delete with src/lib/phase1-samples.ts in Phase 3. */
describe("the Phase 1 results-page samples", () => {
  it("are all valid answer strings", () => {
    for (const [id, a] of Object.entries(PHASE1_SAMPLE_ANSWERS)) {
      expect(isCompleteAnswers(a), id).toBe(true);
    }
  });

  it("cover one terrain, a two-way tie and a three-way tie", () => {
    expect(score(PHASE1_SAMPLE_ANSWERS["sample-mixed"]).terrain).toHaveLength(1);
    expect(score(PHASE1_SAMPLE_ANSWERS["sample-tie"]).terrain).toHaveLength(2);
    expect(score(PHASE1_SAMPLE_ANSWERS["sample-equal"]).terrain).toHaveLength(0);
  });

  it("cover one of each level on a single page", () => {
    const m = score(PHASE1_SAMPLE_ANSWERS["sample-mixed"]).sections;
    expect([m.sex.level, m.death.level, m.cash.level]).toEqual(["low", "high", "medium"]);
  });

  it("cover an all-Low and an all-High page", () => {
    const low = score(PHASE1_SAMPLE_ANSWERS["sample-low"]).sections;
    expect([low.sex.level, low.death.level, low.cash.level]).toEqual(["low", "low", "low"]);
    const high = score(PHASE1_SAMPLE_ANSWERS["sample-high"]).sections;
    expect([high.sex.level, high.death.level, high.cash.level]).toEqual(["high", "high", "high"]);
  });

  it("gives any other id a stable, valid pattern", () => {
    for (const id of ["abc", "x".repeat(24), "", "whatever"]) {
      expect(isCompleteAnswers(sampleAnswersFor(id)), id).toBe(true);
      expect(sampleAnswersFor(id)).toBe(sampleAnswersFor(id));
    }
  });
});
