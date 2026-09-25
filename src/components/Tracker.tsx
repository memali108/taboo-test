"use client";
import { useEffect } from "react";
import { track, type EventName } from "@/lib/tracking";

/** Fires one first-party event on mount. */
export function Tracker({ event, props }: { event: EventName; props?: Record<string, string | number | boolean> }) {
  useEffect(() => {
    track(event, props);
    // Once per mount, deliberately: re-firing on a prop identity change would double-count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
