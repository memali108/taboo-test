import "server-only";
import { prisma } from "./db";

export const SETTING_KEYS = { webhookUrl: "ghl_webhook_url" } as const;

export async function getSetting(key: string): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? "";
}

export async function setSetting(key: string, value: string) {
  return prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

/** Saved setting wins; GHL_WEBHOOK_URL is the fallback (SPEC §8.2). */
export async function webhookUrl(): Promise<{ url: string | null; source: "setting" | "env" | "none" }> {
  const saved = (await getSetting(SETTING_KEYS.webhookUrl)).trim();
  if (saved) return { url: saved, source: "setting" };
  const env = process.env.GHL_WEBHOOK_URL?.trim();
  return env ? { url: env, source: "env" } : { url: null, source: "none" };
}
