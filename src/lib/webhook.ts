import "server-only";
import { prisma } from "./db";
import { webhookUrl } from "./settings";
import { shouldDeliverWebhook } from "./seed";
import type { WebhookPayload } from "./webhook-payload";

/**
 * Delivery to GoHighLevel (SPEC §8.2). Timeout 8s, one retry after 2s, every outcome
 * logged to `DeliveryLog`.
 *
 * **This never throws into the request path.** GHL is the only route to the respondent,
 * but a failure there must not cost them their results page — they see their scores
 * either way, and the failure surfaces as an alert on /admin/health.
 */
const TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 2000;

export type DeliveryOutcome =
  | { sent: false; reason: "no-url" | "seed" }
  | { sent: true; ok: boolean; status: number | null; error: string | null; attempts: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function postOnce(url: string, payload: WebhookPayload) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return { ok: res.ok, status: res.status, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, status: null, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * POST the payload and log the outcome. `attempt` decides whether we send at all: a row
 * created by an automated test run must never reach GoHighLevel (src/lib/seed.ts).
 */
export async function deliverWebhook(
  payload: WebhookPayload,
  attempt: { isSeed: boolean },
  explicitUrl?: string,
): Promise<DeliveryOutcome> {
  if (!shouldDeliverWebhook(attempt)) return { sent: false, reason: "seed" };

  const url = explicitUrl ?? (await webhookUrl()).url;
  if (!url) {
    // Not an error state to hide: /admin/health warns when no URL is configured.
    return { sent: false, reason: "no-url" };
  }

  let r = await postOnce(url, payload);
  let attempts = 1;
  if (!r.ok) {
    await sleep(RETRY_DELAY_MS);
    r = await postOnce(url, payload);
    attempts = 2;
  }

  if (!r.ok) console.error("[webhook] delivery failed", r.status ?? "", r.error);
  await prisma.deliveryLog
    .create({
      data: {
        kind: "webhook",
        ok: r.ok,
        target: String(payload.email ?? ""),
        error: r.ok ? null : `${r.error ?? "unknown"}${attempts > 1 ? " (after retry)" : ""}`,
      },
    })
    .catch(() => {});

  return { sent: true, ok: r.ok, status: r.status, error: r.error, attempts };
}

/** Fire and forget, for the request path. Swallows everything. */
export function deliverInBackground(payload: WebhookPayload, attempt: { isSeed: boolean }) {
  void deliverWebhook(payload, attempt).catch(() => {});
}
