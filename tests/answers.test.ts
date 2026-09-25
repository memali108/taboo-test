import { describe, it, expect } from "vitest";
import { applyAnswer, AnswerError, isComplete } from "@/lib/answers";
import { resumeScreenIndex, screenIndexOfStatement, SCREENS, STATEMENT_COUNT, isLastOfSection } from "@/config/test";

describe("applyAnswer", () => {
  it("appends the next answer", () => {
    expect(applyAnswer("", 0, 3)).toBe("3");
    expect(applyAnswer("3", 1, 5)).toBe("35");
    expect(applyAnswer("35", 2, 1)).toBe("351");
  });

  it("overwrites in place WITHOUT truncating what follows", () => {
    // The Tango difference: changing an earlier answer must not discard later ones.
    expect(applyAnswer("12345", 0, 5)).toBe("52345");
    expect(applyAnswer("12345", 2, 1)).toBe("12145");
    expect(applyAnswer("12345", 4, 2)).toBe("12342");
  });

  it("refuses to skip ahead, so answers.length never lies", () => {
    expect(() => applyAnswer("", 1, 3)).toThrow(AnswerError);
    expect(() => applyAnswer("123", 4, 3)).toThrow(AnswerError);
    expect(applyAnswer("123", 3, 3)).toBe("1233"); // the very next one is fine
  });

  it("rejects out-of-range statements and ratings", () => {
    expect(() => applyAnswer("", -1, 3)).toThrow(AnswerError);
    expect(() => applyAnswer("1".repeat(15), 15, 3)).toThrow(AnswerError);
    for (const bad of [0, 6, -1, 1.5, NaN]) expect(() => applyAnswer("", 0, bad)).toThrow(AnswerError);
  });

  it("completes at exactly 15", () => {
    let a = "";
    for (let i = 0; i < STATEMENT_COUNT; i++) {
      expect(isComplete(a)).toBe(false);
      a = applyAnswer(a, i, 3);
    }
    expect(isComplete(a)).toBe(true);
    expect(a).toHaveLength(15);
  });
});

describe("resumeScreenIndex (SPEC §4.2)", () => {
  it("starts on the first title card", () => {
    expect(resumeScreenIndex(0)).toBe(0);
    expect(SCREENS[0]).toEqual({ kind: "title", section: "sex" });
  });

  it("lands on the screen after the last answered statement", () => {
    expect(resumeScreenIndex(1)).toBe(screenIndexOfStatement(1));
    expect(resumeScreenIndex(3)).toBe(screenIndexOfStatement(3));
  });

  it("brings back the next section's title card rather than skipping it", () => {
    // Finished Sex (5 answered) -> the Death title card, not Death's first statement.
    const afterSex = resumeScreenIndex(5);
    expect(SCREENS[afterSex]).toEqual({ kind: "title", section: "death" });
    const afterDeath = resumeScreenIndex(10);
    expect(SCREENS[afterDeath]).toEqual({ kind: "title", section: "cash" });
  });

  it("never runs off the end", () => {
    for (let n = 0; n <= STATEMENT_COUNT; n++) {
      const i = resumeScreenIndex(n);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(SCREENS.length);
    }
  });
});

describe("isLastOfSection", () => {
  it("is true only on statements 5, 10 and 15", () => {
    const last = [...Array(STATEMENT_COUNT).keys()].filter(isLastOfSection);
    expect(last).toEqual([4, 9, 14]);
  });
});
