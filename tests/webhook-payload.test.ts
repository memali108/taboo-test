import { describe, it, expect } from "vitest";
import { buildPayload, flatten, PAYLOAD_FIELDS } from "@/lib/webhook-payload";
import { score } from "@/lib/scoring";
import { computeSubmission } from "@/lib/submit";
import { SECTION_COPY } from "@/config/copy";

const base = {
  firstName: "Jane",
  email: "jane@example.com",
  publicId: "abcdefghijkmnopqrstuvwxy".slice(0, 24),
  answers: "331215442443323",
  testVersion: "v1",
  marketingConsent: false,
  submittedAt: new Date("2026-06-03T10:30:00.000Z"),
  attemptNumber: 1,
  previous: null,
};

const scored = score(base.answers); // Sex 10 low, Death 21 high, Cash 15 medium, terrain sex
const tags = computeSubmission(null, scored).tags;

describe("the GoHighLevel payload (SPEC §8.1)", () => {
  it("matches its snapshot", () => {
    expect(buildPayload({ ...base, scored, tags })).toMatchInlineSnapshot(`
      {
        "email": "jane@example.com",
        "first_name": "Jane",
        "marketing_consent": false,
        "source": "taboo-test",
        "submitted_at": "2026-06-03T10:30:00.000Z",
        "taboo_answers": "331215442443323",
        "taboo_attempt_number": 1,
        "taboo_cash_level": "Medium",
        "taboo_cash_lowest_statement": "I'm totally on top of my finances, accounting, and even taxes.",
        "taboo_cash_score": 15,
        "taboo_cash_start_here": "Write about the last 3 purchases you made. What motivated you? How do you feel about them in your head and your body? The answer might be something like, Tylenol, pickles, and a thrifted top, and even so, there's good information there for you to unpack.",
        "taboo_change_line": "",
        "taboo_death_level": "High",
        "taboo_death_lowest_statement": "Knowing I will die one day inspires me to live full-out in each moment.",
        "taboo_death_score": 21,
        "taboo_death_start_here": "Journal about where you could bring your life into greater alignment with how you define a well-lived and well-rounded life. For example, who you want to spend time with, what you spend your money on, how much you allow yourself to rest, how much time you spend outdoors, and how much you create.",
        "taboo_prev_cash_score": "",
        "taboo_prev_death_score": "",
        "taboo_prev_sex_score": "",
        "taboo_prev_taken_at": "",
        "taboo_result_url": "http://localhost:3000/r/abcdefghijkmnopqrstuvwxy?utm_source=email&utm_medium=results",
        "taboo_sex_level": "Low",
        "taboo_sex_lowest_statement": "I'm fully comfortable expressing my sexual desires.",
        "taboo_sex_score": 10,
        "taboo_sex_start_here": "Write down the three words you most wish someone would use to describe you sexually. Example: Hot, luscious, creative. Don't edit. Notice what comes up for you when you read them over and decide on the first step you could take to embody the first word. Then take that step.",
        "taboo_tags": "taboo-test-sex-low, taboo-test-death-high, taboo-test-cash-medium, taboo-test-terrain-sex, taboo-test-completed",
        "taboo_terrain": "Sex",
        "taboo_terrain_line": "[COPY TBD: terrain line, one lowest section. Built from: "The section where you scored lowest is your most interesting terrain right now, and where a real shift is possible."]",
        "taboo_test_version": "v1",
      }
    `);
  });

  it("sends every copy field as ONE plain-text paragraph", () => {
    const p = buildPayload({ ...base, scored, tags });
    for (const [k, v] of Object.entries(p)) {
      if (typeof v !== "string") continue;
      expect(v, `${k} contains a line break`).not.toMatch(/[\r\n]/);
      expect(v, `${k} contains HTML`).not.toMatch(/<[a-z/]/i);
      expect(v, `${k} has a double space`).not.toMatch(/ {2}/);
    }
  });

  it("flattens multi-line copy rather than trusting it to stay flat", () => {
    expect(flatten("one\n\ntwo   three\t four ")).toBe("one two three four");
  });

  it("names the lowest-rated statement in each section", () => {
    const p = buildPayload({ ...base, scored, tags });
    // Sex ratings 3,3,1,2,1; statement 2 is reversed so items are 3,3,1,2,1. The first
    // minimum is item 3, i.e. statement index 2.
    expect(scored.sections.sex.items).toEqual([3, 3, 1, 2, 1]);
    expect(scored.sections.sex.lowestStatementIndex).toBe(2);
    expect(p.taboo_sex_lowest_statement).toBe("I'm fully comfortable expressing my sexual desires.");
  });

  it("carries the previous scores and a change line on a retake", () => {
    const p = buildPayload({
      ...base,
      scored,
      tags,
      attemptNumber: 2,
      previous: {
        submittedAt: new Date("2026-03-01T09:00:00.000Z"),
        sexScore: 12,
        deathScore: 15,
        cashScore: 9,
      },
    });
    expect(p.taboo_attempt_number).toBe(2);
    expect(p.taboo_prev_taken_at).toBe("2026-03-01T09:00:00.000Z");
    expect(p.taboo_prev_sex_score).toBe(12);
    expect(p.taboo_change_line).not.toBe("");
  });

  it("sends empty strings, not missing keys, on a first attempt", () => {
    const p = buildPayload({ ...base, scored, tags });
    for (const k of ["taboo_prev_taken_at", "taboo_prev_sex_score", "taboo_change_line"]) {
      expect(Object.keys(p)).toContain(k);
      expect(p[k]).toBe("");
    }
  });

  it("joins two tied terrain sections with an ampersand and sends none when all three tie", () => {
    const tie = score("212121331441515"); // Sex & Cash
    expect(buildPayload({ ...base, scored: tie, tags: [] }).taboo_terrain).toBe("Sex & Cash");
    const equal = score("333333333333333");
    expect(buildPayload({ ...base, scored: equal, tags: [] }).taboo_terrain).toBe("");
  });

  it("sends the START HERE paragraph for the level actually reached", () => {
    const p = buildPayload({ ...base, scored, tags });
    expect(p.taboo_sex_start_here).toBe(flatten(SECTION_COPY.sex.levels.low.startHere));
    expect(p.taboo_death_start_here).toBe(flatten(SECTION_COPY.death.levels.high.startHere));
    expect(p.taboo_cash_start_here).toBe(flatten(SECTION_COPY.cash.levels.medium.startHere));
  });

  it("exposes the field list for the admin Settings page", () => {
    expect(PAYLOAD_FIELDS).toContain("taboo_terrain_line");
    expect(PAYLOAD_FIELDS.length).toBeGreaterThan(25);
  });
});
