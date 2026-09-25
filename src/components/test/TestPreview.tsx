"use client";
import { useEffect, useRef, useState } from "react";
import { SCREENS, SECTION_COPY, type Screen } from "@/config/test-screens";
import { STATEMENTS, STATEMENT_COUNT } from "@/config/test";
import { SectionTitleCard } from "./SectionTitleCard";
import { StatementCard } from "./StatementCard";

/**
 * PHASE 1 ONLY — the look, not the flow.
 *
 * Screens advance in local state and NOTHING IS SAVED: no Attempt, no
 * /api/answer, no cookie, no resume. Phase 2 replaces this with the real flow
 * (SPEC §15). Kept as one component so that swap is a single file.
 */
export function TestPreview() {
  const [screen, setScreen] = useState(0);
  const [ratings, setRatings] = useState<Record<number, number>>({});
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    liveRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  const current: Screen = SCREENS[screen];
  const back = () => setScreen((s) => Math.max(0, s - 1));
  const next = () => setScreen((s) => Math.min(SCREENS.length - 1, s + 1));

  if (current.kind === "title") {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 sm:px-8">
        <SectionTitleCard section={current.section} onBegin={next} />
      </section>
    );
  }

  const statement = STATEMENTS[current.statementIndex];
  // The progress bar counts statements only — "4 of 15" — not title cards.
  const answeredBefore = statement.index;
  const pct = Math.round((answeredBefore / STATEMENT_COUNT) * 100);

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-4 sm:px-8 sm:py-8">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-ink">
        <span>{SECTION_COPY[current.section].name}</span>
        <span>
          {statement.index + 1} of {STATEMENT_COUNT}
        </span>
      </div>
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-paper-3" aria-hidden="true">
        <div className="h-full bg-red transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>

      <div ref={liveRef} tabIndex={-1} aria-live="polite" aria-atomic="true" className="outline-none">
        <StatementCard
          key={statement.index}
          index={statement.index}
          statement={statement.text}
          selected={ratings[statement.index] ?? null}
          disabled={false}
          onSelect={(rating) => {
            setRatings((r) => ({ ...r, [statement.index]: rating }));
            next();
          }}
        />
      </div>

      <div className="mt-8 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={back}
          className="min-h-11 rounded-md px-2 text-ink underline-offset-4 hover:underline"
        >
          ← Back
        </button>
        <span className="hidden text-ink sm:inline">Press 1–5 to choose</span>
      </div>
    </section>
  );
}
