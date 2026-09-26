import { describe, it, expect } from "vitest";
import { terrainLine } from "@/lib/terrain";
import { score } from "@/lib/scoring";
import { SECTIONS, type Section } from "@/config/test";

const ALL_TERRAINS: Section[][] = [
  [],
  ["sex"], ["death"], ["cash"],
  ["sex", "death"], ["sex", "cash"], ["death", "cash"],
];

describe("terrainLine", () => {
  it("fills the section name for a single lowest section", () => {
    expect(terrainLine(["death"])).toBe(
      "Your lowest score is in Death. That's your most interesting terrain right now, and where a real shift is possible.",
    );
  });

  it("fills both names for a tie, in Sex → Death → Cash order", () => {
    expect(terrainLine(["cash", "sex"])).toBe(
      "Sex and Cash tied for your lowest score. Both are interesting terrain right now. Start with the one you'd rather avoid.",
    );
    expect(terrainLine(["death", "cash"])).toBe(
      "Death and Cash tied for your lowest score. Both are interesting terrain right now. Start with the one you'd rather avoid.",
    );
  });

  it("uses the all-equal variant when every section ties", () => {
    expect(terrainLine([])).toBe(
      "All three sections scored the same. Your terrain is whichever one you'd most like to skip. Start there.",
    );
  });

  it("never leaves an unfilled placeholder or a doubled space", () => {
    for (const t of ALL_TERRAINS) {
      const line = terrainLine(t);
      expect(line, JSON.stringify(t)).not.toContain("{Section}");
      expect(line, JSON.stringify(t)).not.toContain("{");
      expect(line, JSON.stringify(t)).not.toMatch(/ {2}/);
      expect(line.endsWith("."), JSON.stringify(t)).toBe(true);
    }
  });

  it("names the section the scorer actually picked, for real answer patterns", () => {
    // Sex 10 low, Death 21 high, Cash 15 medium -> terrain Sex
    expect(terrainLine(score("331215442443323").terrain as Section[])).toContain("in Sex.");
    // Sex 12, Death 16, Cash 12 -> Sex and Cash tied
    expect(terrainLine(score("212121331441515").terrain as Section[])).toContain("Sex and Cash tied");
    // 15 / 15 / 15 -> all equal
    expect(terrainLine(score("333333333333333").terrain as Section[])).toContain("All three sections");
  });

  it("covers every terrain the scorer can produce", () => {
    const seen = new Set<string>();
    const rec = (s: string) => {
      if (s.length === 15) {
        seen.add(JSON.stringify(score(s).terrain));
        return;
      }
      // Sample rather than brute-force 5^15: vary one section at a time.
      for (const d of ["1", "3", "5"]) rec(s + d.repeat(5));
    };
    rec("");
    for (const t of seen) {
      const line = terrainLine(JSON.parse(t) as Section[]);
      expect(line).not.toContain("{");
      expect(line.length).toBeGreaterThan(40);
    }
    expect(seen.size).toBeGreaterThan(1);
    expect(SECTIONS).toHaveLength(3);
  });
});
