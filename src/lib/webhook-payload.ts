/**
 * The GoHighLevel payload (SPEC §8.1). Pure, so it can be snapshot-tested without a
 * database or a network.
 *
 * The prefix is `taboo_`, deliberately different from Taboo Tango's `tt_`, so the two
 * apps' GHL custom fields never collide.
 *
 * **Every copy field must be a single paragraph of plain text** — no HTML, no line
 * breaks — so it renders cleanly as a GHL merge field. `flatten()` enforces that rather
 * than trusting the copy to stay that way, and a test pins it.
 */
import { CHANGE_LINE_TBD, SECTION_COPY } from "@/config/copy";
import { SECTIONS, STATEMENTS, type Section } from "@/config/test";
import { terrainLine, terrainName } from "./terrain";
import type { Scored } from "./scoring";
import type { PreviousSubmission } from "./history";
import { emailResultUrl } from "./site";

/** Collapse any whitespace run — newline included — to a single space. */
export const flatten = (s: string) => s.replace(/\s+/g, " ").trim();

const titleCase = (l: string) => l.charAt(0).toUpperCase() + l.slice(1);

export type PayloadInput = {
  firstName: string;
  email: string;
  publicId: string;
  answers: string;
  testVersion: string;
  scored: Scored;
  submittedAt: Date;
  attemptNumber: number;
  tags: string[];
  previous: PreviousSubmission | null;
};

export type WebhookPayload = Record<string, string | number | boolean>;

export function buildPayload(i: PayloadInput): WebhookPayload {
  const out: WebhookPayload = {
    first_name: i.firstName,
    email: i.email,
    submitted_at: i.submittedAt.toISOString(),
    // No `marketing_consent`: the mailing-list box is gone. Takers are already Substack
    // subscribers, and the results email plus the quarterly retake are the service they
    // asked for by submitting. The `substack-subscriber` tag carries the list state now.
    source: "taboo-test",
    taboo_test_version: i.testVersion,
  };

  for (const s of SECTIONS) {
    const r = i.scored.sections[s];
    out[`taboo_${s}_score`] = r.total;
    out[`taboo_${s}_level`] = titleCase(r.level);
    out[`taboo_${s}_start_here`] = flatten(SECTION_COPY[s].levels[r.level].startHere);
    // The statement they rated lowest in this section — the Medium Sex and Medium Cash
    // copy tells them to go and look at it, so the email has to name it.
    out[`taboo_${s}_lowest_statement`] = flatten(STATEMENTS[r.lowestStatementIndex].text);
  }

  out.taboo_terrain = terrainName(i.scored.terrain as Section[]);
  out.taboo_terrain_line = flatten(terrainLine(i.scored.terrain as Section[]));
  out.taboo_result_url = emailResultUrl(i.publicId);
  out.taboo_attempt_number = i.attemptNumber;

  // Empty strings, not omitted keys: GHL maps fields by name, and a key that disappears
  // on a first attempt leaves the previous run's value sitting in the contact record.
  out.taboo_prev_taken_at = i.previous ? i.previous.submittedAt.toISOString() : "";
  out.taboo_prev_sex_score = i.previous ? i.previous.sexScore : "";
  out.taboo_prev_death_score = i.previous ? i.previous.deathScore : "";
  out.taboo_prev_cash_score = i.previous ? i.previous.cashScore : "";
  out.taboo_change_line = i.previous ? flatten(CHANGE_LINE_TBD) : "";

  out.taboo_answers = i.answers;
  out.taboo_tags = i.tags.join(", ");
  return out;
}

/** Field names, in payload order — rendered on the admin Settings page and in the docs. */
export const PAYLOAD_FIELDS = Object.keys(
  buildPayload({
    firstName: "Jane",
    email: "jane@example.com",
    publicId: "a".repeat(24),
    answers: "3".repeat(15),
    testVersion: "v1",
    scored: {
      testVersion: "v1",
      sections: {
        sex: { section: "sex", total: 15, level: "medium", items: [3, 3, 3, 3, 3], lowestStatementIndex: 0 },
        death: { section: "death", total: 15, level: "medium", items: [3, 3, 3, 3, 3], lowestStatementIndex: 5 },
        cash: { section: "cash", total: 15, level: "medium", items: [3, 3, 3, 3, 3], lowestStatementIndex: 10 },
      },
      terrain: [],
    },
    submittedAt: new Date(0),
    attemptNumber: 1,
    tags: [],
    previous: null,
  }),
);
