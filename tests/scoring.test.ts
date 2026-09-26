import { describe, it, expect } from "vitest";
import { score, levelFor, isCompleteAnswers, MAX_SECTION_SCORE, MIN_SECTION_SCORE } from "@/lib/scoring";
import { SECTIONS, SECTION_SIZE, STATEMENTS, STATEMENT_COUNT, REVERSED, sectionIndices } from "@/config/test";

/** Every 1–5 pattern of length 5. */
const allSectionPatterns = (): string[] => {
  const out: string[] = [];
  const rec = (s: string) => {
    if (s.length === SECTION_SIZE) return void out.push(s);
    for (let d = 1; d <= 5; d++) rec(s + d);
  };
  rec("");
  return out;
};

/** Fill the other two sections with 3s so only the section under test varies. */
const answersWithSection = (section: (typeof SECTIONS)[number], pattern: string): string => {
  const parts = SECTIONS.map((s) => (s === section ? pattern : "33333"));
  return parts.join("");
};

describe("the locked test shape", () => {
  it("is 15 statements, 5 per section, in Sex → Death → Cash order", () => {
    expect(STATEMENTS).toHaveLength(STATEMENT_COUNT);
    expect(SECTIONS).toEqual(["sex", "death", "cash"]);
    for (const s of SECTIONS) expect(sectionIndices(s)).toHaveLength(SECTION_SIZE);
  });

  it("reverses exactly statements 2, 9, 12, 13 and 15 (SPEC §5.2)", () => {
    expect([...REVERSED].sort((a, b) => a - b)).toEqual([1, 8, 11, 12, 14]);
  });
});

describe("levels (SPEC §6)", () => {
  it("Low 5–11 · Medium 12–18 · High 19–25", () => {
    for (let t = 5; t <= 11; t++) expect(levelFor(t), String(t)).toBe("low");
    for (let t = 12; t <= 18; t++) expect(levelFor(t), String(t)).toBe("medium");
    for (let t = 19; t <= 25; t++) expect(levelFor(t), String(t)).toBe("high");
  });

  it("pins the boundaries at 11/12 and 18/19", () => {
    expect(levelFor(11)).toBe("low");
    expect(levelFor(12)).toBe("medium");
    expect(levelFor(18)).toBe("medium");
    expect(levelFor(19)).toBe("high");
  });
});

describe("section totals", () => {
  it("every one of the 3,125 patterns per section totals 5–25 with the right level", () => {
    const patterns = allSectionPatterns();
    expect(patterns).toHaveLength(3125);
    for (const section of SECTIONS) {
      for (const pattern of patterns) {
        const r = score(answersWithSection(section, pattern)).sections[section];
        expect(r.total, `${section} ${pattern}`).toBeGreaterThanOrEqual(MIN_SECTION_SCORE);
        expect(r.total, `${section} ${pattern}`).toBeLessThanOrEqual(MAX_SECTION_SCORE);
        expect(r.level, `${section} ${pattern}`).toBe(levelFor(r.total));
        expect(r.items.reduce((a, b) => a + b, 0)).toBe(r.total);
      }
    }
  });
});

describe("reversal (SPEC §6)", () => {
  it("all 5s gives Sex 21, Death 21, Cash 13", () => {
    const s = score("5".repeat(15));
    expect(s.sections.sex.total).toBe(21);
    expect(s.sections.death.total).toBe(21);
    expect(s.sections.cash.total).toBe(13);
  });

  it("all 1s gives Sex 9, Death 9, Cash 17", () => {
    const s = score("1".repeat(15));
    expect(s.sections.sex.total).toBe(9);
    expect(s.sections.death.total).toBe(9);
    expect(s.sections.cash.total).toBe(17);
  });

  it("stores raw ratings, never pre-reversed ones", () => {
    // Statement 2 (index 1) is reversed: a raw 5 must score 1.
    const s = score("15333333333333 3".replace(" ", ""));
    expect(s.sections.sex.items[1]).toBe(1);
  });
});

describe("terrain (SPEC §6)", () => {
  it("names the single lowest section, even when every section is High", () => {
    // Sex 25, Death 21, Cash 19 — all High, Cash still the terrain.
    const s = score("5" + "1" + "555" + "55515" + "51155");
    expect(s.sections.sex.level).toBe("high");
    expect(s.sections.death.level).toBe("high");
    expect(s.sections.cash.level).toBe("high");
    expect(s.terrain).toEqual(["cash"]);
    expect(s.sections.cash.total).toBeLessThan(s.sections.sex.total);
  });

  it("returns both when two tie for lowest", () => {
    const s = score("1".repeat(15)); // Sex 9, Death 9, Cash 17
    expect(s.terrain).toEqual(["sex", "death"]);
  });

  it("returns none when all three tie, so the page uses the all-equal variant", () => {
    const s = score("333333333333333"); // 15 / 15 / 15
    expect(s.sections.sex.total).toBe(15);
    expect(s.sections.death.total).toBe(15);
    expect(s.sections.cash.total).toBe(15);
    expect(s.terrain).toEqual([]);
  });
});

describe("input guard", () => {
  it("accepts only 15 characters of 1–5", () => {
    expect(isCompleteAnswers("333333333333333")).toBe(true);
    expect(isCompleteAnswers("33333333333333")).toBe(false);
    expect(isCompleteAnswers("3333333333333333")).toBe(false);
    expect(isCompleteAnswers("33333333333333x")).toBe(false);
    expect(isCompleteAnswers("333333333333330")).toBe(false);
    expect(isCompleteAnswers("333333333333336")).toBe(false);
  });

  it("throws rather than scoring a partial attempt", () => {
    expect(() => score("333")).toThrow();
  });
});
