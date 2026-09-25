"use client";
import { useEffect } from "react";
import { track } from "@/lib/tracking";

/** `tbt_result_viewed` with where the visit came from (SPEC §10). */
export function ResultTracker({ source }: { source: "submit" | "email" }) {
  useEffect(() => {
    track("tbt_result_viewed", { source });
  }, [source]);
  return null;
}
