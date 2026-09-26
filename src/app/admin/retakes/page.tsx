import Link from "next/link";
import { prisma } from "@/lib/db";
import { NOT_SEED } from "@/lib/seed";
import { SECTIONS } from "@/config/test";
import { SECTION_COPY } from "@/config/copy";
import { Card, Table, Kpi } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const signed = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : n.toFixed(1));

/** People with 2+ submitted attempts, and how their scores moved (SPEC §11). */
export default async function RetakesPage() {
  const contacts = await prisma.contact.findMany({
    where: { ...NOT_SEED, attemptCount: { gte: 2 } },
    orderBy: { lastSubmittedAt: "desc" },
    select: {
      id: true,
      email: true,
      attemptCount: true,
      attempts: {
        where: { status: "submitted" },
        orderBy: { submittedAt: "asc" },
        select: { submittedAt: true, sexScore: true, deathScore: true, cashScore: true },
      },
    },
  });

  const rows = contacts
    .map((c) => {
      const a = c.attempts;
      if (a.length < 2) return null;
      const first = a[0];
      const last = a[a.length - 1];
      const delta = {
        sex: (last.sexScore ?? 0) - (first.sexScore ?? 0),
        death: (last.deathScore ?? 0) - (first.deathScore ?? 0),
        cash: (last.cashScore ?? 0) - (first.cashScore ?? 0),
      };
      return { c, first, last, delta, n: a.length };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const mean = (k: "sex" | "death" | "cash") =>
    rows.length ? rows.reduce((s, r) => s + r.delta[k], 0) / rows.length : 0;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-red">Retakes</h1>

      <div className="grid gap-4 sm:grid-cols-4">
        <Kpi label="People with 2+" value={rows.length} />
        {SECTIONS.map((s) => (
          <Kpi key={s} label={`Avg ${SECTION_COPY[s].name} move`} value={rows.length ? signed(mean(s)) : "—"} hint="first → latest" />
        ))}
      </div>

      <Card title="Movement per person, first to latest">
        <Table
          head={["Email", "Attempts", "First", "Latest", ...SECTIONS.map((s) => `${SECTION_COPY[s].name} Δ`)]}
          rows={rows.map((r) => [
            <Link key="e" href={`/admin/contacts/${r.c.id}`} className="text-red underline underline-offset-2">
              {r.c.email}
            </Link>,
            r.n,
            r.first.submittedAt?.toISOString().slice(0, 10) ?? "—",
            r.last.submittedAt?.toISOString().slice(0, 10) ?? "—",
            ...SECTIONS.map((s) => signed(r.delta[s])),
          ])}
          empty="Nobody has taken it twice yet."
        />
      </Card>
    </div>
  );
}
