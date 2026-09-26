import { prisma } from "@/lib/db";
import { webhookUrl } from "@/lib/settings";
import { NOT_SEED } from "@/lib/seed";
import { siteUrl } from "@/lib/site";
import { requiresDataConsent } from "@/lib/config";
import { healthWindowStart, HEALTH_WINDOW_DAYS } from "@/lib/admin-stats";
import { Card, Table } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/**
 * Leads with the alert (SPEC §8.2): a webhook failure means someone completed the test
 * and received nothing, and there is no second delivery path.
 */
export default async function HealthPage() {
  const since = healthWindowStart();
  const [wh, failures, recent, submittedNoContact, dupes] = await Promise.all([
    webhookUrl(),
    prisma.deliveryLog.count({ where: { kind: "webhook", ok: false, createdAt: { gte: since } } }),
    prisma.deliveryLog.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.attempt.count({ where: { ...NOT_SEED, status: "submitted", contactId: null } }),
    prisma.$queryRaw<{ lower: string; n: bigint }[]>`
      SELECT lower(email) AS lower, count(*) AS n FROM "Contact" GROUP BY lower(email) HAVING count(*) > 1
    `,
  ]);

  const alerts: { tone: "bad" | "warn"; title: string; body: string }[] = [];
  if (!wh.url) {
    alerts.push({
      tone: "bad",
      title: "No GoHighLevel webhook is configured",
      body: "Nobody who submits is receiving a results email. Set the URL in Settings, or GHL_WEBHOOK_URL on the service.",
    });
  }
  if (failures > 0) {
    alerts.push({
      tone: "bad",
      title: `${failures} webhook ${failures === 1 ? "delivery has" : "deliveries have"} failed in the last ${HEALTH_WINDOW_DAYS} days`,
      body: "Each one is a person who completed the test and received nothing. Resend from their contact page.",
    });
  }
  if (siteUrl().includes("localhost")) {
    alerts.push({
      tone: "warn",
      title: "NEXT_PUBLIC_SITE_URL still points at localhost",
      body: "Result links in the GoHighLevel payload are permanent once emailed. Set it before the first real send.",
    });
  }
  if (submittedNoContact > 0) {
    alerts.push({
      tone: "warn",
      title: `${submittedNoContact} submitted attempts have no contact`,
      body: "A submission should always upsert a contact. Worth investigating.",
    });
  }
  if (dupes.length > 0) {
    alerts.push({
      tone: "warn",
      title: `${dupes.length} email addresses differ only by case`,
      body: "Addresses are normalised on submit, so these predate that or were created by hand.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-red">Health</h1>

      {alerts.length === 0 ? (
        <Card tone="ok">
          <p className="text-sm text-ink">No alerts. Webhook configured, nothing failed in the last 7 days.</p>
        </Card>
      ) : (
        alerts.map((a) => (
          <Card key={a.title} tone={a.tone}>
            <p className="font-semibold text-ink">{a.title}</p>
            <p className="mt-1 text-sm text-ink">{a.body}</p>
          </Card>
        ))
      )}

      <Card title="Configuration">
        <Table
          head={["Setting", "Value"]}
          rows={[
            ["Webhook URL", wh.url ? `set (from ${wh.source})` : "not set"],
            ["NEXT_PUBLIC_SITE_URL", siteUrl()],
            ["REQUIRE_DATA_CONSENT", requiresDataConsent() ? "on" : "off"],
            ["SEED", process.env.SEED === "false" ? "false (correct for production)" : (process.env.SEED ?? "unset")],
            ["E2E_TOKEN", (process.env.E2E_TOKEN ?? "").length >= 16 ? "set" : "not set"],
          ]}
        />
      </Card>

      <Card title={`Delivery log, last ${HEALTH_WINDOW_DAYS} days`}>
        <Table
          head={["When", "Kind", "OK", "Target", "Error"]}
          rows={recent.map((d) => [
            d.createdAt.toISOString().replace("T", " ").slice(0, 16),
            d.kind,
            d.ok ? "yes" : "no",
            d.target ?? "—",
            d.error ?? "—",
          ])}
          empty={`Nothing delivered in the last ${HEALTH_WINDOW_DAYS} days.`}
        />
      </Card>
    </div>
  );
}
