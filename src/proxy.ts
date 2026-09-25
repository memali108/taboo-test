import { NextResponse, type NextRequest } from "next/server";
import { verify } from "@/lib/crypto";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts`. This is admin auth only —
 * the redirect for unauthenticated humans. Server actions that mutate admin
 * state re-check `isAdmin()` themselves; keep doing that.
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const d = await verify<{ role: string }>(req.cookies.get("tbt_admin")?.value);
    if (d?.role !== "admin") {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
