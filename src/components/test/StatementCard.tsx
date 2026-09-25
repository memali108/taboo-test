"use client";
import { useEffect, useRef, useState } from "react";
import { SCALE } from "@/config/copy";

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
                  ? "border-red bg-red text-white shadow-[0_8px_24px_-12px_rgba(98,8,27,0.6)]"
                  // The page is white, so an unselected card carries a tint of its own —
                  // a white fill would dissolve into the page. Hover steps one tone darker.
                  : "border-line bg-paper-2 text-ink hover:border-ink-3 hover:bg-paper-3 active:scale-[0.99]",
              ].join(" ")}
            >
              <span
                className={[
                  "font-display flex size-9 shrink-0 items-center justify-center rounded-full border text-lg",
                  isSel ? "border-white/40 bg-white/10 text-white" : "border-line bg-white text-ink group-hover:border-ink-3",
                ].join(" ")}
                aria-hidden="true"
              >
                {value}
              </span>
              <span className="text-[1.0625rem] leading-snug">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
