"use server";
import { redirect } from "next/navigation";
import { createAttempt } from "@/lib/attempt";
import { currentAttempt } from "@/lib/attempt";

/**
 * "Begin" on the landing page (SPEC §4.1).
 *
 * Resumes an UNFINISHED attempt rather than restarting it: a second Attempt row for the
 * same person would count as a second start in the funnel and orphan the answers they
 * already gave.
 *
 * A SUBMITTED attempt starts a fresh one instead. The attempt cookie lasts 7 days and
 * retakes now come from the quarterly email (SPEC §4.5), so bouncing them to their old
 * results would leave anyone who wants to retake inside that window with no way into the
 * test at all — that escape hatch used to be the "Take it again" link, which is gone.
 * Their old attempt and its results URL are untouched; every attempt is kept.
 */
export async function beginAction(form: FormData) {
  const existing = await currentAttempt();
  if (existing && existing.status !== "submitted") {
    if (existing.status === "completed") redirect("/send");
    redirect("/test");
  }

  const str = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  await createAttempt({
    utmSource: str("utm_source"),
    utmMedium: str("utm_medium"),
    utmCampaign: str("utm_campaign"),
    utmContent: str("utm_content"),
  });
  redirect("/test");
}
