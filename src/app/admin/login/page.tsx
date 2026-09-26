import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = (Array.isArray(sp.next) ? sp.next[0] : sp.next) ?? "/admin";
  return (
    <div className="mx-auto max-w-sm py-16">
      <h1 className="font-display text-3xl text-red">Admin</h1>
      <LoginForm next={next} />
    </div>
  );
}
