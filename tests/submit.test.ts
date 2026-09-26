import { describe, it, expect } from "vitest";
import { computeSubmission, TAG_COMPLETED, TAG_RETAKEN, TAG_SUBSTACK, TAG_SOURCE } from "@/lib/submit";
import { score } from "@/lib/scoring";

const mixed = score("331215442443323"); // Sex 10 low, Death 21 high, Cash 15 medium, terrain sex
const tie = score("212121331441515"); // Sex & Cash tied lowest

/** Exactly the four tags the app emits now (SPEC §8.1). */
const ALL = [TAG_COMPLETED, TAG_SUBSTACK, TAG_SOURCE, TAG_RETAKEN];

describe("computeSubmission", () => {
  it("numbers a first submission 1 and does not mark it a retake", () => {
    const p = computeSubmission(null, mixed);
    expect(p.attemptNumber).toBe(1);
    expect(p.isRetake).toBe(false);
    expect(p.tags).not.toContain(TAG_RETAKEN);
  });

  it("emits exactly the four tags, and no per-section or terrain tags", () => {
    const p = computeSubmission(null, mixed);
    expect(p.tags.sort()).toEqual([TAG_COMPLETED, TAG_SUBSTACK, TAG_SOURCE].sort());
    // The levels and terrain travel as payload FIELDS, not as tags.
    expect(p.tags.some((t) => /^taboo-test-(sex|death|cash)-/.test(t))).toBe(false);
    expect(p.tags.some((t) => t.startsWith("taboo-test-terrain-"))).toBe(false);
  });

  it("increments the number and marks a retake", () => {
    const existing = { attemptCount: 1, tags: [TAG_COMPLETED, TAG_SUBSTACK, TAG_SOURCE] };
    const p = computeSubmission(existing, mixed);
    expect(p.attemptNumber).toBe(2);
    expect(p.isRetake).toBe(true);
    expect(p.tags).toContain(TAG_RETAKEN);
  });

  it("strips retired level and terrain tags left over from an earlier submission", () => {
    const existing = {
      attemptCount: 2,
      tags: [TAG_COMPLETED, TAG_SUBSTACK, "taboo-test-sex-high", "taboo-test-terrain-death", "taboo-test-cash-low"],
    };
    const p = computeSubmission(existing, mixed);
    expect(p.tags.filter((t) => /^taboo-test-(sex|death|cash)-|terrain-/.test(t))).toEqual([]);
    expect(p.tags.sort()).toEqual(ALL.sort());
  });

  it("never duplicates a tag across retakes", () => {
    let tags: string[] = [];
    for (let i = 0; i < 4; i++) {
      tags = computeSubmission({ attemptCount: i, tags }, i % 2 ? tie : mixed).tags;
    }
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags.sort()).toEqual(ALL.sort());
  });

  it("does not strip substack-subscriber when rebuilding tags", () => {
    // It is applied by the Substack CSV import too, and a GHL workflow keys off it —
    // dropping it on a retake would re-enrol someone in the Tango nurture sequence.
    const existing = { attemptCount: 2, tags: [TAG_SUBSTACK, "taboo-test-sex-high"] };
    expect(computeSubmission(existing, mixed).tags).toContain(TAG_SUBSTACK);
  });

  it("leaves tags this app does not manage alone", () => {
    const existing = { attemptCount: 1, tags: ["vip", "newsletter", "substack-paid"] };
    const p = computeSubmission(existing, mixed);
    for (const t of ["vip", "newsletter", "substack-paid"]) expect(p.tags).toContain(t);
  });
});
