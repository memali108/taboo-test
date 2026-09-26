import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { NOT_SEED } from "@/lib/seed";

export const dynamic = "force-dynamic";

/** RFC 4180: quote everything, double any embedded quote. */
const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  // A route handler is not covered by the proxy's page redirect, so it checks for itself.
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });

  const contacts = await prisma.contact.findMany({
    where: NOT_SEED,
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      firstName: true,
      attemptCount: true,
      lastSubmittedAt: true,
      consentAt: true,
      tags: true,
      createdAt: true,
      attempts: {
        where: { status: "submitted" },
        orderBy: { submittedAt: "desc" },
        take: 1,
        select: { sexScore: true, deathScore: true, cashScore: true, terrain: true, answers: true },
      },
    },
  });

  const head = [
    "email", "first_name", "attempt_count", "last_submitted_at", "marketing_consent_at",
    "tags", "created_at", "sex_score", "death_score", "cash_score", "terrain", "answers",
  ];
  const lines = [head.join(",")];
  for (const c of contacts) {
    const a = c.attempts[0];
    lines.push(
      [
        c.email, c.firstName, c.attemptCount,
        c.lastSubmittedAt?.toISOString() ?? "", c.consentAt?.toISOString() ?? "",
        c.tags.join(" "), c.createdAt.toISOString(),
        a?.sexScore ?? "", a?.deathScore ?? "", a?.cashScore ?? "",
        a?.terrain.join(" ") ?? "", a?.answers ?? "",
      ].map(cell).join(","),
    );
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="taboo-test-contacts-${stamp}.csv"`,
      // Personal data: never cached by a proxy on the way.
      "cache-control": "no-store",
    },
  });
}
