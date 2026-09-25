"use client";
import { SECTION_COPY, SECTION_TITLE } from "@/config/copy";
import type { Section } from "@/config/test";

/**
 * Full-screen card on red that opens each section (SPEC §5.3, §7.3).
 * White headline (13.38:1), sea subtitle (8.47:1). Tap anywhere, or the Begin button.
 *
 * Nothing from the ink scale may go on this card: ink is 1.17:1 on red, ink-3 is 1.91
 * and mute is 2.96. Only white and the sea family are legible here.
 */
export function SectionTitleCard({ section, onBegin }: { section: Section; onBegin: () => void }) {
  const copy = SECTION_COPY[section];
  return (
    <button
      type="button"
      onClick={onBegin}
      className="group animate-reveal -mx-5 flex flex-1 cursor-pointer flex-col items-start justify-center gap-6 bg-red px-5 py-16 text-left sm:-mx-8 sm:px-8"
    >
      <h2 className="font-display text-[clamp(3.5rem,18vw,7rem)] uppercase text-white">{copy.name}</h2>
      <p className="text-xl italic text-sea">{copy.subtitle}</p>
      {/* Sea glass, which now also keeps the button from disappearing into the card it
          sits on: sea against red is 8.47:1. Aubergine on sea is 9.88:1, and on the
          sea-deep hover 8.57:1. */}
      <span className="mt-4 inline-flex min-h-14 items-center justify-center rounded-full bg-sea px-10 text-base font-semibold text-aubergine transition group-hover:bg-sea-deep">
        {SECTION_TITLE.button}
      </span>
    </button>
  );
}
