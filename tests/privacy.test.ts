import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  PRIVACY_EMAIL,
  PRIVACY_LAST_UPDATED,
  PRIVACY_SECTIONS,
  PRIVACY_TITLE,
} from "@/config/privacy";

/**
 * The page renders from `src/config/privacy.ts`; the document of record is
 * `docs/privacy-policy.md`. This reconstructs the full text from the structure and
 * compares it to the markdown, so the published policy cannot drift from the file it was
 * written in — silently saying something the policy does not.
 */
const squash = (s: string) => s.replace(/\s+/g, " ").trim();

/** Strip the markdown syntax, leaving the words in document order. */
function markdownText(md: string): string {
  return squash(
    md
      .split("\n")
      .map((line) => line.replace(/^#{1,6}\s+/, "").replace(/^-\s+/, "").replace(/\*\*/g, ""))
      .join(" "),
  );
}

/** The same words, in the same order, as the page renders them. */
function sectionsText(): string {
  const parts: string[] = [PRIVACY_TITLE, PRIVACY_LAST_UPDATED];
  for (const section of PRIVACY_SECTIONS) {
    if (section.heading) parts.push(section.heading);
    for (const block of section.blocks) {
      if ("ul" in block) {
        for (const item of block.ul) {
          parts.push(typeof item === "string" ? item : item.lead + item.text);
        }
      } else {
        parts.push((block.lead ?? "") + block.p);
      }
    }
  }
  return squash(parts.join(" "));
}

describe("the privacy policy", () => {
  const md = readFileSync("docs/privacy-policy.md", "utf8");

  it("is rendered verbatim from docs/privacy-policy.md", () => {
    expect(sectionsText()).toBe(markdownText(md));
  });

  it("carries the document's own Last updated date", () => {
    expect(md).toContain(PRIVACY_LAST_UPDATED);
    expect(PRIVACY_LAST_UPDATED).toBe("Last updated: September 26, 2026");
  });

  it("has every heading the document has, in order", () => {
    const fromMd = [...md.matchAll(/^###\s+(.+)$/gm)].map((m) => m[1].trim());
    const fromData = PRIVACY_SECTIONS.map((s) => s.heading).filter(Boolean);
    expect(fromData).toEqual(fromMd);
  });

  it("mentions the contact address so it becomes a mailto link", () => {
    expect(sectionsText()).toContain(PRIVACY_EMAIL);
  });
});
