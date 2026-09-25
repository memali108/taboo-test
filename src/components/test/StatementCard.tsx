"use client";
import { useEffect, useRef, useState } from "react";
import { SCALE } from "@/config/copy";

/**
 * The red look. Hover and keyboard focus adopt it as well as the selected state, so a
 * card reads the same whether you are pointing at it or have chosen it (see
 * docs/DECISIONS.md — this makes hover and selected deliberately indistinguishable).
 *
 * Written out in full rather than composed at runtime: Tailwind scans source text, so
 * a class name built by concatenation is never generated.
 */
const CARD_RED = "border-red bg-red text-white shadow-[0_8px_24px_-12px_rgba(98,8,27,0.6)]";
const CARD_RED_ON_HOVER_FOCUS =
  "hover:border-red hover:bg-red hover:text-white hover:shadow-[0_8px_24px_-12px_rgba(98,8,27,0.6)] " +
  "focus-visible:border-red focus-visible:bg-red focus-visible:text-white focus-visible:shadow-[0_8px_24px_-12px_rgba(98,8,27,0.6)]";

const CIRCLE_RED = "border-white/40 bg-white/10 text-white";
const CIRCLE_RED_ON_HOVER_FOCUS =
  "group-hover:border-white/40 group-hover:bg-white/10 group-hover:text-white " +
  "group-focus-visible:border-white/40 group-focus-visible:bg-white/10 group-focus-visible:text-white";


type Props = {
  index: number;
  statement: string;
  selected: number | null;
  disabled: boolean;
  onSelect: (rating: number) => void;
};

/**
 * Taboo Tango's QuestionCard, with the 1–5 rating in the circle where Tango
 * shows a letter. The scale is identical on every statement and shown on every
 * card; reversed statements are flipped in scoring, never here (SPEC §2, §5.1).
 */
export function StatementCard({ index, statement, selected, disabled, onSelect }: Props) {
  const [focus, setFocus] = useState<number | null>(selected);
  const [pending, setPending] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const choose = (i: number) => {
    if (disabled || pending !== null) return;
    setPending(i);
    // Brief pause so the selected state is visible before the screen changes.
    window.setTimeout(() => onSelect(SCALE[i].value), 260);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (disabled) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (/^[1-5]$/.test(e.key)) {
        e.preventDefault();
        const i = Number(e.key) - 1;
        setFocus(i);
        refs.current[i]?.focus();
        choose(i);
      } else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const cur = focus ?? -1;
        const nxt = e.key === "ArrowDown" ? (cur + 1) % SCALE.length : (cur - 1 + SCALE.length) % SCALE.length;
        setFocus(nxt);
        refs.current[nxt]?.focus();
      } else if (e.key === "Enter" && focus !== null && document.activeElement?.getAttribute("role") !== "radio") {
        e.preventDefault();
        choose(focus);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, disabled, pending]);

  const shownValue = pending !== null ? SCALE[pending].value : selected;

  return (
    <div className="animate-rise">
      <h2 id={`s-${index}`} className="font-display text-[clamp(1.75rem,6vw,3rem)] text-ink">
        {statement}
      </h2>
      <div role="radiogroup" aria-labelledby={`s-${index}`} className="mt-6 flex flex-col gap-3">
        {SCALE.map(({ value, label }, i) => {
          const isSel = shownValue === value;
          // The SAVED answer, which is what has to stay identifiable when a different
          // card goes red under the pointer. Gated on `isSel` as well so that while a
          // different card is mid-selection the old one drops its mark with its fill,
          // rather than leaving a red badge floating on a light card for 260ms.
          const showSavedMark = selected === value && isSel;
          return (
            <button
              key={value}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={isSel}
              tabIndex={focus === i || (focus === null && i === 0) ? 0 : -1}
              disabled={disabled}
              onFocus={() => setFocus(i)}
              onClick={() => choose(i)}
              className={[
                "group flex min-h-[4.5625rem] w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-[background-color,border-color,transform,box-shadow] duration-200",
                isSel
                  ? CARD_RED
                  // The page is white, so an unselected card carries a tint of its own —
                  // a white fill would dissolve into the page.
                  : `border-line bg-paper-2 text-ink active:scale-[0.99] ${CARD_RED_ON_HOVER_FOCUS}`,
              ].join(" ")}
            >
              <span
                className={[
                  "font-display relative flex size-9 shrink-0 items-center justify-center rounded-full border text-lg",
                  isSel ? CIRCLE_RED : `border-line bg-white text-ink ${CIRCLE_RED_ON_HOVER_FOCUS}`,
                ].join(" ")}
                aria-hidden="true"
              >
                {value}
                {showSavedMark && (
                  // `text-white` and `bg-red` are set explicitly rather than inherited:
                  // the disc guarantees the check is always white-on-red (13.38:1),
                  // whatever it happens to overlap.
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red text-white">
                    <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2.5 6.25 4.75 8.5 9.5 3.5" />
                    </svg>
                  </span>
                )}
              </span>
              <span className="text-[1.0625rem] leading-snug">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
