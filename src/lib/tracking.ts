"use client";
import { TEST_ID, TEST_VERSION } from "@/config/test";

/** First-party only. No GA4, no Meta Pixel — same privacy stance as taboo-quiz (SPEC §2). */
export type EventName =
  | "tbt_landing_viewed"
  | "tbt_started"
  | "tbt_answered"
  | "tbt_section_completed"
  | "tbt_completed"
  | "tbt_send_viewed"
  | "tbt_submitted"
  | "tbt_result_viewed";

type Props = Record<string, string | number | boolean | null | undefined>;
type Queued = { name: EventName; props: Props; ts: number };

const queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let bound = false;

function bind() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}

export function flush(beacon = false) {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  if (!queue.length) return;
  const body = JSON.stringify({ events: queue.splice(0, queue.length) });
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon("/api/events", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/events", {
      method: "POST",
      body,
      headers: { "content-type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }
}

/**
 * No browser storage is written here. `/api/events` takes the attempt from the signed
 * cookie and ignores anything the client sends, so the `sessionStorage` copy of the
 * attempt id that used to live here was never read — and it made the privacy policy's
 * "one cookie" claim untrue for no benefit at all.
 */
export function track(name: EventName, props: Props = {}) {
  if (typeof window === "undefined") return;
  bind();
  queue.push({
    name,
    props: { test_id: TEST_ID, test_version: TEST_VERSION, ...props },
    ts: Date.now(),
  });
  if (!timer) timer = setTimeout(() => flush(false), 800);
}
