"use server";
import { redirect } from "next/navigation";
import { createAttempt } from "@/lib/attempt";
import { currentAttempt } from "@/lib/attempt";

/**
 * "Begin" on the landing page (SPEC §4.1).
 *
 * Resumes rather than restarting when this browser already carries an attempt: a second
 * Attempt row for the same person would count as a second start in the funnel and orphan
 * the answers they already gave.
 */
export async function beginAction(form: FormData) {
  const existing = await currentAttempt();
  if (existing) {
    if (existing.status === "submitted") redirect(`/r/${existing.publicId}`);
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
