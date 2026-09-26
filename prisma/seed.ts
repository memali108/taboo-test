/**
 * Demo data for the admin dashboard (SPEC §9): ~300 submitted attempts over 60 days.
 *
 * Every row is flagged `isSeed`, which means the admin pages exclude it and the webhook
 * never fires for it — the same flag the Playwright suite uses. So seeding a database
 * gives you a shaped dashboard without polluting the real numbers.
 *
 * **Set SEED=false in production.** The env var is the real guard; the "bail if seed rows
 * exist" check below only stops it running twice.
 */
import { PrismaClient } from "@prisma/client";
import { score } from "../src/lib/scoring";
import { computeSubmission } from "../src/lib/submit";
import { newPublicId } from "../src/lib/public-id";
import { TEST_VERSION } from "../src/config/test";

const prisma = new PrismaClient();
const COUNT = 300;
const DAYS = 60;

const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)];
const int = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));

/** Slightly centre-weighted, so the level mix looks like people rather than noise. */
const rating = () => String(Math.min(5, Math.max(1, Math.round((Math.random() + Math.random() + Math.random()) / 3 * 4 + 1))));
const answers = () => Array.from({ length: 15 }, rating).join("");

async function main() {
  if (process.env.SEED === "false") {
    console.log("[seed] SEED=false, skipping");
    return;
  }
  if (await prisma.attempt.findFirst({ where: { isSeed: true }, select: { id: true } })) {
    console.log("[seed] seed rows already exist, skipping");
    return;
  }

  const devices = ["mobile", "desktop", "tablet"] as const;
  const sources = [null, "substack", "substack", "email"] as const;

  for (let i = 0; i < COUNT; i++) {
    const startedAt = new Date(Date.now() - int(0, DAYS) * 86_400_000 - int(0, 86_399) * 1000);
    // Not everyone finishes: this is what makes the funnel worth looking at.
    const finishes = Math.random() < 0.78;
    const submits = finishes && Math.random() < 0.85;
    const a = answers();

    if (!finishes) {
      await prisma.attempt.create({
        data: {
          publicId: newPublicId(), testVersion: TEST_VERSION, isSeed: true,
          answers: a.slice(0, int(0, 14)), startedAt,
          device: pick(devices), utmSource: pick(sources),
        },
      });
      continue;
    }

    const completedAt = new Date(startedAt.getTime() + int(90, 420) * 1000);
    if (!submits) {
      await prisma.attempt.create({
        data: {
          publicId: newPublicId(), testVersion: TEST_VERSION, isSeed: true,
          answers: a, status: "completed", startedAt, completedAt,
          device: pick(devices), utmSource: pick(sources),
        },
      });
      continue;
    }

    const scored = score(a);
    const email = `seed${i}@example.com`;
    const existing = await prisma.contact.findUnique({ where: { email }, select: { attemptCount: true, tags: true } });
    const plan = computeSubmission(existing, scored);
    const submittedAt = new Date(completedAt.getTime() + int(10, 120) * 1000);

    const contact = await prisma.contact.upsert({
      where: { email },
      create: {
        email, firstName: `Seed${i}`, isSeed: true,
        attemptCount: plan.attemptNumber, lastSubmittedAt: submittedAt, tags: plan.tags,
      },
      update: { attemptCount: plan.attemptNumber, lastSubmittedAt: submittedAt, tags: plan.tags },
      select: { id: true },
    });

    await prisma.attempt.create({
      data: {
        publicId: newPublicId(), testVersion: TEST_VERSION, isSeed: true,
        answers: a, status: "submitted", startedAt, completedAt, submittedAt,
        contactId: contact.id, attemptNumber: plan.attemptNumber,
        sexScore: scored.sections.sex.total, deathScore: scored.sections.death.total, cashScore: scored.sections.cash.total,
        sexLevel: scored.sections.sex.level, deathLevel: scored.sections.death.level, cashLevel: scored.sections.cash.level,
        terrain: scored.terrain,
        device: pick(devices), utmSource: pick(sources),
      },
    });
  }

  console.log(`[seed] created ${COUNT} attempts, all flagged isSeed`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
