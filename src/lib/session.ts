import "server-only";
import { cookies } from "next/headers";
import { sign, verify } from "./crypto";

/**
 * Cookie names are prefixed `tbt_`, deliberately different from the Taboo Tango
 * quiz's `tt_`, so the two apps never collide if they ever share a domain.
 *
 * There is no result cookie here: the results page is guarded by an unguessable
 * 24-char `publicId` instead, because the link has to keep working from the
 * email (SPEC §2).
 */
export const ATTEMPT_COOKIE = "tbt_attempt";
export const ADMIN_COOKIE = "tbt_admin";
const ATTEMPT_TTL = 60 * 60 * 24 * 7;
const ADMIN_TTL = 60 * 60 * 24 * 7;

const base = { httpOnly: true, sameSite: "lax" as const, path: "/", secure: process.env.NODE_ENV === "production" };

export async function setAttemptCookie(attemptId: string) {
  const c = await cookies();
  c.set(ATTEMPT_COOKIE, await sign({ aid: attemptId }, ATTEMPT_TTL), { ...base, maxAge: ATTEMPT_TTL });
}
export async function readAttemptCookie(): Promise<string | null> {
  const c = await cookies();
  const d = await verify<{ aid: string }>(c.get(ATTEMPT_COOKIE)?.value);
  return d?.aid ?? null;
}
export async function clearAttemptCookie() {
  const c = await cookies();
  c.delete(ATTEMPT_COOKIE);
}

export async function setAdminCookie() {
  const c = await cookies();
  c.set(ADMIN_COOKIE, await sign({ role: "admin" }, ADMIN_TTL), { ...base, maxAge: ADMIN_TTL });
}
export async function clearAdminCookie() {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
}
export async function isAdmin(): Promise<boolean> {
  const c = await cookies();
  const d = await verify<{ role: string }>(c.get(ADMIN_COOKIE)?.value);
  return d?.role === "admin";
}
