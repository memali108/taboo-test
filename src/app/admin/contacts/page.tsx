import Link from "next/link";
import { prisma } from "@/lib/db";
import { NOT_SEED } from "@/lib/seed";
import { Card, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";
const PAGE = 100;

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const q = String((Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "").trim();

  const contacts = await prisma.contact.findMany({
    where: { ...NOT_SEED, ...(q ? { email: { contains: q, mode: "insensitive" as const } } : {}) },
    orderBy: { lastSubmittedAt: "desc" },
    take: PAGE,
    select: { id: true, email: true, firstName: true, attemptCount: true, lastSubmittedAt: true, consentAt: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl text-red">Contacts</h1>
        <div className="flex items-end gap-3">
          <form className="flex items-end gap-2">
            <label className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
              Search email
              <input
                name="q"
                defaultValue={q}
                className="mt-1 block min-h-11 rounded-lg border border-line bg-white px-3 text-sm text-ink"
              />
            </label>
            <button type="submit" className="min-h-11 rounded-full bg-red px-5 text-sm font-semibold text-white hover:bg-red-deep">
              Search
            </button>
          </form>
          {/* A plain anchor on purpose: this is a file download, and next/link would
              client-navigate to it instead of letting the browser save it. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/admin/contacts/export"
            className="min-h-11 rounded-full border border-red px-5 py-2.5 text-sm font-semibold text-red hover:bg-red-soft"
          >
            CSV
          </a>
        </div>
      </div>

      <Card title={`${contacts.length}${contacts.length === PAGE ? "+" : ""} contacts`}>
        <Table
          head={["Email", "First name", "Attempts", "Last submitted", "Mailing list"]}
          rows={contacts.map((c) => [
            <Link key="e" href={`/admin/contacts/${c.id}`} className="text-red underline underline-offset-2">
              {c.email}
            </Link>,
            c.firstName,
            c.attemptCount,
            c.lastSubmittedAt ? c.lastSubmittedAt.toISOString().slice(0, 10) : "—",
            c.consentAt ? "yes" : "no",
          ])}
          empty={q ? "No contacts match that search." : "No contacts yet."}
        />
      </Card>
    </div>
  );
}
