"use client";
import { SECTION_COPY } from "@/config/copy";
import type { Section } from "@/config/test";

/**
 * Full-screen card on aubergine that opens each section (SPEC §5.3, §7.3).
 * Paper headline, sea subtitle — sea on aubergine measures 9.88:1.
 * Tap anywhere, or the Begin button.
 */
export function SectionTitleCard({ section, onBegin }: { section: Section; onBegin: () => void }) {
  const copy = SECTION_COPY[section];
  return (
    <button
      type="button"
      onClick={onBegin}
      className="group animate-reveal -mx-5 flex flex-1 cursor-pointer flex-col items-start justify-center gap-6 bg-aubergine px-5 py-16 text-left sm:-mx-8 sm:px-8"
    >
      <h2 className="font-display text-[clamp(3.5rem,18vw,7rem)] uppercase text-paper">{copy.name}</h2>
      <p className="text-xl italic text-sea">{copy.subtitle}</p>
      {/* Sea glass, not red: red on aubergine is 1.17:1 and the button vanishes.
          Aubergine on sea is 9.88:1. */}
      <span className="mt-4 inline-flex min-h-14 items-center justify-center rounded-full bg-sea px-10 text-base font-semibold text-aubergine transition group-hover:bg-sea-deep">
        Begin
      </span>
    </button>
  );
}
