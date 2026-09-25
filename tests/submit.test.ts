import { describe, it, expect } from "vitest";
import { computeSubmission, TAG_COMPLETED, TAG_RETAKEN, levelTag, terrainTag } from "@/lib/submit";
import { score } from "@/lib/scoring";

const mixed = score("331215442443323"); // Sex 10 low, Death 21 high, Cash 15 medium, terrain sex
const tie = score("212121331441515"); // Sex & Cash tied lowest
const equal = score("333333333333333"); // all 15 -> no terrain

describe("computeSubmission", () => {
  it("numbers a first submission 1 and does not mark it a retake", () => {
    const p = computeSubmission(null, mixed);
    expect(p.attemptNumber).toBe(1);
    expect(p.isRetake).toBe(false);
    expect(p.tags).not.toContain(TAG_RETAKEN);
    expect(p.tags).toContain(TAG_COMPLETED);
  });

  it("tags one level per section and one tag per terrain section", () => {
    const p = computeSubmission(null, mixed);
    expect(p.tags).toContain(levelTag("sex", "low"));
    expect(p.tags).toContain(levelTag("death", "high"));
    expect(p.tags).toContain(levelTag("cash", "medium"));
    expect(p.tags.filter((t) => t.startsWith("taboo-test-terrain-"))).toEqual([terrainTag("sex")]);
  });

  it("emits a terrain tag for each section when two tie", () => {
    const p = computeSubmission(null, tie);
    expect(p.tags.filter((t) => t.startsWith("taboo-test-terrain-")).sort()).toEqual(
      [terrainTag("sex"), terrainTag("cash")].sort(),
    );
  });

  it("emits no terrain tag when all three tie", () => {
    const p = computeSubmission(null, equal);
    expect(p.tags.filter((t) => t.startsWith("taboo-test-terrain-"))).toEqual([]);
  });

  it("increments the number and marks a retake", () => {
    const existing = { attemptCount: 1, tags: [TAG_COMPLETED, levelTag("sex", "high"), terrainTag("death")] };
    const p = computeSubmission(existing, mixed);
    expect(p.attemptNumber).toBe(2);
    expect(p.isRetake).toBe(true);
    expect(p.tags).toContain(TAG_RETAKEN);
  });

  it("replaces the previous level and terrain tags rather than accumulating them", () => {
    const existing = { attemptCount: 2, tags: [TAG_COMPLETED, TAG_RETAKEN, levelTag("sex", "high"), terrainTag("death")] };
    const p = computeSubmission(existing, mixed);
    expect(p.tags).not.toContain(levelTag("sex", "high"));
    expect(p.tags).toContain(levelTag("sex", "low"));
    expect(p.tags).not.toContain(terrainTag("death"));
    expect(p.tags.filter((t) => t.startsWith("taboo-test-sex-"))).toHaveLength(1);
    expect(p.tags.filter((t) => t === TAG_COMPLETED)).toHaveLength(1);
    expect(p.tags.filter((t) => t === TAG_RETAKEN)).toHaveLength(1);
  });

  it("leaves tags this app does not manage alone", () => {
    const existing = { attemptCount: 1, tags: ["vip", "newsletter", levelTag("cash", "low")] };
    const p = computeSubmission(existing, mixed);
    expect(p.tags).toContain("vip");
    expect(p.tags).toContain("newsletter");
  });
});
