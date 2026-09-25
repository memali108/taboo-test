"use server";
import { redirect } from "next/navigation";
import { clearAttemptCookie } from "@/lib/session";

/**
 * "Take it again" (SPEC §4.5). Clears the attempt cookie so the landing page starts a
 * fresh Attempt rather than resuming the submitted one. The old attempt is untouched —
 * every attempt is kept, and the results email compares them (SPEC §1).
 */
export async function retakeAction() {
  await clearAttemptCookie();
  redirect("/");
}
