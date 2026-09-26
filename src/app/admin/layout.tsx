import Link from "next/link";
import { isAdmin } from "@/lib/session";
import { logoutAction } from "./actions";

const NAV = [
  ["/admin", "Overview"],
  ["/admin/levels", "Levels"],
  ["/admin/statements", "Statements"],
  ["/admin/contacts", "Contacts"],
  ["/admin/retakes", "Retakes"],
  ["/admin/settings", "Settings"],
  ["/admin/health", "Health"],
] as const;

export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // src/proxy.ts already redirects unauthenticated visitors. This is the second check:
  // the proxy is a redirect for humans, not the only guard.
  const authed = await isAdmin();

  return (
    <div className="min-h-dvh bg-paper-2">
      {authed && (
        <header className="border-b border-line bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
            <span className="font-display text-xl text-red">Taboo Test</span>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {NAV.map(([href, label]) => (
                <Link key={href} href={href} className="text-ink underline-offset-4 hover:underline">
                  {label}
                </Link>
              ))}
            </nav>
            <form action={logoutAction} className="ml-auto">
              <button type="submit" className="min-h-11 text-sm text-ink underline-offset-4 hover:underline">
                Log out
              </button>
            </form>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
