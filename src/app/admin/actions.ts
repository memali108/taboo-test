"use server";
import { redirect } from "next/navigation";
import { clearAdminCookie, setAdminCookie } from "@/lib/session";
import { timingSafeEqual } from "@/lib/crypto";
import { rateLimit } from "@/lib/ratelimit";
import { requestMeta } from "@/lib/request";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const expected = process.env.ADMIN_PASSWORD ?? "";
  // Fail closed: an unset password must never authenticate, least of all an empty box.
  if (expected.length < 8) return { error: "Admin is not configured." };

  const meta = await requestMeta();
  if (meta.ipHash && !(await rateLimit(`login:${meta.ipHash}`, 8, 900))) {
    return { error: "Too many attempts. Try again in a few minutes." };
  }

  const given = String(form.get("password") ?? "");
  if (!timingSafeEqual(given, expected)) return { error: "Wrong password." };

  await setAdminCookie();
  const next = String(form.get("next") ?? "/admin");
  // Only ever bounce to a path on this site.
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logoutAction() {
  await clearAdminCookie();
  redirect("/admin/login");
}
