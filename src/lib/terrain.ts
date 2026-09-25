import { TERRAIN_LINE } from "@/config/copy";
import { SECTION_COPY } from "@/config/copy";
import type { Section } from "@/config/test";

/** "Cash", "Sex & Cash", or "" when all three tie (SPEC §8.1 `taboo_terrain`). */
export function terrainName(terrain: Section[]): string {
  return terrain.map((s) => SECTION_COPY[s].name).join(" & ");
}

/**
 * The full sentence naming their lowest section(s), handling every tie case so
 * GoHighLevel needs no logic of its own (SPEC §8.1 `taboo_terrain_line`).
 *
 * All three variants are still `[COPY TBD]`; this picks the right slot.
 */
export function terrainLine(terrain: Section[]): string {
  if (terrain.length === 0) return TERRAIN_LINE.all;
  if (terrain.length === 1) return TERRAIN_LINE.one;
  return TERRAIN_LINE.two;
}
