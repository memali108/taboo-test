import "server-only";
import { headers } from "next/headers";
import { sha256Hex, secret } from "./crypto";

export type RequestMeta = {
  device: "mobile" | "tablet" | "desktop";
  country: string | null;
  ipHash: string | null;
  referrer: string | null;
};

export function deviceFromUA(ua: string | null): RequestMeta["device"] {
  const u = (ua ?? "").toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(u)) return "tablet";
  if (/mobi|iphone|ipod|android/.test(u)) return "mobile";
  return "desktop";
}

export async function requestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const ip =
    h.get("cf-connecting-ip") ??
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;
  const country = h.get("cf-ipcountry") ?? h.get("x-vercel-ip-country") ?? h.get("x-country") ?? null;
  return {
    device: deviceFromUA(h.get("user-agent")),
    country: country && country !== "XX" ? country.toUpperCase().slice(0, 2) : null,
    ipHash: ip ? (await sha256Hex(ip + secret())).slice(0, 32) : null,
    referrer: h.get("referer"),
  };
}

export function referrerDomain(ref: string | null | undefined): string | null {
  if (!ref) return null;
  try {
    return new URL(ref).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}
