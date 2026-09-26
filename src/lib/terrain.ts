import { SECTION_COPY, TERRAIN_LINE } from "@/config/copy";
import { SECTIONS, type Section } from "@/config/test";

/**
 * Terrain sections always come back in Sex → Death → Cash order, because `score()`
 * builds them by filtering `SECTIONS`. Both the name and the line depend on that, so it
 * is asserted here rather than assumed.
 */
const ordered = (terrain: Section[]): Section[] => SECTIONS.filter((s) => terrain.includes(s));

/** "Cash", "Sex & Cash", or "" when all three tie (SPEC §8.1 `taboo_terrain`). */
export function terrainName(terrain: Section[]): string {
  return ordered(terrain).map((s) => SECTION_COPY[s].name).join(" & ");
}

/** Fill each `{Section}` placeholder, left to right, from `names`. */
function fill(template: string, names: string[]): string {
  let i = 0;
  return template.replace(/\{Section\}/g, () => names[i++] ?? "");
}

/**
 * The full sentence naming their lowest section(s), handling every tie case so
 * GoHighLevel needs no logic of its own (SPEC §8.1 `taboo_terrain_line`).
 *
 * An empty `terrain` means all three tied — see `score()` — which is the all-equal
 * variant, not a missing value.
 */
export function terrainLine(terrain: Section[]): string {
  const names = ordered(terrain).map((s) => SECTION_COPY[s].name);
  if (names.length === 0) return TERRAIN_LINE.all;
  if (names.length === 1) return fill(TERRAIN_LINE.one, names);
  return fill(TERRAIN_LINE.two, names);
}
