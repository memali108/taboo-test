"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SCREENS,
  STATEMENTS,
  STATEMENT_COUNT,
  isLastOfSection,
  resumeScreenIndex,
  type Screen,
} from "@/config/test";
import { SECTION_COPY } from "@/config/copy";
import { applyAnswer } from "@/lib/answers";
import { flush, setAttemptId, track } from "@/lib/tracking";
import { SectionTitleCard } from "./SectionTitleCard";
import { StatementCard } from "./StatementCard";

type Props = { attemptId: string; initialAnswers: string };

/**
 * The real test flow (SPEC §4.2): 3 title cards + 15 statements = 18 screens, resuming
 * where the person left off, with Back allowed and each answer written as it is given.
 */
export function TestFlow({ attemptId, initialAnswers }: Props) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [screen, setScreen] = useState(() => resumeScreenIndex(initialAnswers.length));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shownAt = useRef(0);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => setAttemptId(attemptId), [attemptId]);

  useEffect(() => {
    shownAt.current = Date.now();
    if (SCREENS[screen].kind === "statement") liveRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen]);

  const submit = useCallback(
    async (statementIndex: number, rating: number) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      const elapsed = Date.now() - shownAt.current;
      try {
        const res = await fetch("/api/answer", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ statement: statementIndex, rating }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (data.reset) {
            // The attempt cookie is gone or no longer verifies. Send them back to the
            // start rather than letting them answer into a void.
            router.push("/");
            return;
          }
          if (data.status === "completed") return void router.push("/send");
          if (data.status === "submitted") return void router.refresh();
          setError("Something went wrong saving that. Please try again.");
          return;
        }

        setAnswers(data.answers);
        track("tbt_answered", { statement: statementIndex + 1, value: rating, elapsed_ms: elapsed });
        if (isLastOfSection(statementIndex)) {
          track("tbt_section_completed", { section: STATEMENTS[statementIndex].section });
        }
        if (data.completed) {
          track("tbt_completed", { answers_length: String(data.answers).length });
          flush(false);
          router.push("/send");
          return;
        }
        setScreen((s) => Math.min(SCREENS.length - 1, s + 1));
      } catch {
        setError("We couldn't reach the server. Check your connection and try again.");
      } finally {
        setBusy(false);
      }
    },
    [busy, router],
  );

  const current: Screen = SCREENS[screen];
  const back = () => setScreen((s) => Math.max(0, s - 1));

  if (current.kind === "title") {
    return (
      <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 sm:px-8">
        <SectionTitleCard
          section={current.section}
          onBegin={() => setScreen((s) => Math.min(SCREENS.length - 1, s + 1))}
        />
        {screen > 0 && (
          <div className="py-4 text-sm">
            <button type="button" onClick={back} className="min-h-11 rounded-md px-2 text-ink underline-offset-4 hover:underline">
              ← Back
            </button>
          </div>
        )}
      </section>
    );
  }

  const statement = STATEMENTS[current.statementIndex];
  // The progress bar counts statements only — never the title cards (SPEC §4.2).
  const pct = Math.round((statement.index / STATEMENT_COUNT) * 100);
  const saved = answers[statement.index];

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-5 py-4 sm:px-8 sm:py-8">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-ink">
        <span>{SECTION_COPY[current.section].name}</span>
        <span>
          {statement.index + 1} of {STATEMENT_COUNT}
        </span>
      </div>
      <div className="mb-6 h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full bg-red transition-[width] duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>

      <div ref={liveRef} tabIndex={-1} aria-live="polite" aria-atomic="true" className="outline-none">
        <StatementCard
          key={statement.index}
          index={statement.index}
          statement={statement.text}
          selected={saved ? Number(saved) : null}
          disabled={busy}
          onSelect={(rating) => {
            // Optimistic, so Back feels instant if the write is still in flight; the
            // server's copy is authoritative and replaces this on the response.
            setAnswers((a) => applyAnswer(a, statement.index, rating));
            void submit(statement.index, rating);
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-bad-soft px-4 py-3 text-sm text-bad">
          {error}
        </p>
      )}

      <div className="mt-8 flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={back}
          disabled={busy}
          className="min-h-11 rounded-md px-2 text-ink underline-offset-4 hover:underline disabled:opacity-40"
        >
          ← Back
        </button>
        <span className="hidden text-ink sm:inline">Press 1–5 to choose</span>
      </div>
    </section>
  );
}
