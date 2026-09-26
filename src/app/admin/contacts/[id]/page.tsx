import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { SECTION_COPY, RESULTS } from "@/config/copy";
import { SECTIONS } from "@/config/test";
import { resultUrl } from "@/lib/site";
import { Card, Table } from "@/components/admin/ui";
import { DeleteContact } from "./DeleteContact";
import { resendWebhook } from "./actions";

export const dynamic = "force-dynamic";

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: { attempts: { orderBy: { startedAt: "desc" } } },
  });
  if (!contact) notFound();

  const submitted = contact.attempts.filter((a) => a.status === "submitted");
  const failures = await prisma.deliveryLog.findMany({
    where: { kind: "webhook", target: contact.email },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-4xl text-red">{contact.email}</h1>
        <p className="mt-1 text-sm text-ink">
          {contact.firstName} · {contact.attemptCount} attempt{contact.attemptCount === 1 ? "" : "s"}
          {contact.isSeed && " · SEED (test data, never sent to GHL)"}
        </p>
      </div>

      {sp.error === "confirm" && (
        <Card tone="bad">
          <p className="text-sm text-ink">The address you typed didn&rsquo;t match, so nothing was deleted.</p>
        </Card>
      )}

      <Card title="Score history">
        <Table
          head={["Submitted", "#", ...SECTIONS.map((s) => SECTION_COPY[s].name), "Terrain", "Results", "Resend"]}
          rows={submitted.map((a) => [
            a.submittedAt?.toISOString().slice(0, 16).replace("T", " ") ?? "—",
            a.attemptNumber ?? "—",
            ...SECTIONS.map((s) => {
              const scoreKey = `${s}Score` as const;
              const levelKey = `${s}Level` as const;
              const v = a[scoreKey];
              const l = a[levelKey];
              return v === null ? "—" : `${v} · ${l ? RESULTS.levelLabels[l] : "—"}`;
            }),
            a.terrain.length ? a.terrain.map((t) => SECTION_COPY[t as (typeof SECTIONS)[number]].name).join(" & ") : "—",
            <a key="r" href={resultUrl(a.publicId)} className="text-red underline underline-offset-2" target="_blank" rel="noopener">
              open ↗
            </a>,
            <form key="f" action={resendWebhook}>
              <input type="hidden" name="attemptId" value={a.id} />
              <button type="submit" className="min-h-11 text-sm text-red underline underline-offset-2">
                Resend
              </button>
            </form>,
          ])}
          empty="No submitted attempts."
        />
      </Card>

      <Card title="Delivery log for this address">
        <Table
          head={["When", "OK", "Error"]}
          rows={failures.map((d) => [
            d.createdAt.toISOString().replace("T", " ").slice(0, 16),
            d.ok ? "yes" : "no",
            d.error ?? "—",
          ])}
          empty="Nothing delivered for this address yet."
        />
      </Card>

      <Card title="Delete" tone="bad">
        <p className="mb-3 text-sm text-ink">
          Removes this contact and every attempt, answer and event belonging to them. This cannot be undone, and it
          does not reach GoHighLevel — delete them there too.
        </p>
        <DeleteContact contactId={contact.id} email={contact.email} />
      </Card>
    </div>
  );
}
