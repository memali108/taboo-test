"use client";
import { Tbd } from "@/components/Tbd";
import { flush, track } from "@/lib/tracking";

const isTbd = (s: string) => s.startsWith("[COPY TBD");

/** Kept small, at the bottom of the page (SPEC §4.5). */
export function RetakeLink({ label, action }: { label: string; action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={() => {
        track("tbt_retake_clicked");
        // The navigation follows immediately, so send it now rather than on the timer.
        flush(true);
      }}
    >
      <button type="submit" className="min-h-11 text-sm text-ink underline-offset-4 hover:underline">
        {isTbd(label) ? <Tbd>{label}</Tbd> : label}
      </button>
    </form>
  );
}
