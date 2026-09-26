"use server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/session";
import { SETTING_KEYS, setSetting, webhookUrl } from "@/lib/settings";
import { deliverWebhook } from "@/lib/webhook";
import { buildPayload } from "@/lib/webhook-payload";
import { score } from "@/lib/scoring";
import { computeSubmission } from "@/lib/submit";

export type SettingsState = { message?: string; error?: string };

/** The proxy redirects unauthenticated humans; a mutation re-checks for itself. */
async function guard() {
  if (!(await isAdmin())) throw new Error("not-admin");
}

export async function saveWebhookUrl(_prev: SettingsState, form: FormData): Promise<SettingsState> {
  await guard();
  const raw = String(form.get("url") ?? "").trim();
  if (raw) {
    try {
      const u = new URL(raw);
      if (u.protocol !== "https:") return { error: "The webhook URL must be https." };
    } catch {
      return { error: "That doesn't look like a URL." };
    }
  }
  await setSetting(SETTING_KEYS.webhookUrl, raw);
  revalidatePath("/admin/settings");
  revalidatePath("/admin/health");
  return { message: raw ? "Saved." : "Cleared — the GHL_WEBHOOK_URL variable is the fallback." };
}

/**
 * A realistic fake result, so GoHighLevel can see every field and map them (SPEC §8.2).
 * `isSeed: false` deliberately: this is the one send that is *meant* to reach GHL.
 */
export async function sendTestPayload(): Promise<SettingsState> {
  await guard();
  const { url } = await webhookUrl();
  if (!url) return { error: "No webhook URL configured yet." };

  const scored = score("331215442443323");
  const payload = buildPayload({
    firstName: "Test",
    email: "test@example.com",
    publicId: "test".padEnd(24, "x"),
    answers: "331215442443323",
    testVersion: "v1",
    scored,
    marketingConsent: false,
    submittedAt: new Date(),
    attemptNumber: 1,
    tags: computeSubmission(null, scored).tags,
    previous: null,
  });

  const r = await deliverWebhook(payload, { isSeed: false }, url);
  if (!r.sent) return { error: "Nothing was sent." };
  return r.ok ? { message: `GoHighLevel accepted it (HTTP ${r.status}).` } : { error: `Failed: ${r.error ?? "unknown"}.` };
}
