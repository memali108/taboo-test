import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import * as COPY from "@/config/copy";
import { STATEMENTS, STATEMENT_COUNT } from "@/config/test";

const spec = readFileSync("SPEC.md", "utf8");

const strings = (v: unknown, path = "", out: [string, string][] = []): [string, string][] => {
  if (typeof v === "string") out.push([path, v]);
  else if (Array.isArray(v)) v.forEach((x, i) => strings(x, `${path}[${i}]`, out));
  else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) strings(x, `${path}.${k}`, out);
  return out;
};

const all = Object.entries(COPY)
  .filter(([, v]) => typeof v !== "function")
  .flatMap(([k, v]) => strings(v, k));

describe("copy is Appendix A, verbatim (SPEC §0.4)", () => {
  it("every written string appears in SPEC.md word for word", () => {
    const written = all.filter(([, v]) => !v.startsWith("[COPY TBD"));
    expect(written.length).toBeGreaterThan(50);
    for (const [path, v] of written) {
      expect(spec.includes(v), `${path}: ${JSON.stringify(v.slice(0, 80))}`).toBe(true);
    }
  });

  it("keeps the unwritten slots as visible bracketed placeholders", () => {
    const tbd = all.filter(([, v]) => v.startsWith("[COPY TBD"));
    expect(tbd.length).toBeGreaterThan(0);
    for (const [path, v] of tbd) expect(v.endsWith("]"), path).toBe(true);
  });
});

describe("statements are locked content", () => {
  it("has 15, in the spec's order", () => {
    expect(STATEMENTS).toHaveLength(STATEMENT_COUNT);
    expect(STATEMENTS[0].text).toBe("I feel sexy AF.");
    expect(STATEMENTS[5].text).toBe("I could die today and feel complete.");
    expect(STATEMENTS[10].text).toBe("I am fully confident I have everything I need.");
    expect(STATEMENTS[14].text).toBe("I feel guilty and unworthy when I indulge myself.");
  });

  it("leaves Sex statement 5 as a placeholder for Marie-Elizabeth to replace (SPEC §14.1)", () => {
    expect(STATEMENTS[4].text.startsWith("[COPY TBD")).toBe(true);
  });
});
