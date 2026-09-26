import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readAttemptCookie } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { requestMeta } from "@/lib/request";

export const dynamic = "force-dynamic";

const EVENT_NAMES = [
  "tbt_landing_viewed",
  "tbt_started",
  "tbt_answered",
  "tbt_section_completed",
  "tbt_completed",
  "tbt_send_viewed",
  "tbt_submitted",
  "tbt_result_viewed",
] as const;

const Body = z.object({
  events: z
    .array(
      z.object({
        name: z.enum(EVENT_NAMES),
        props: z.record(z.string(), z.unknown()).default({}),
      }),
    )
    .min(1)
    .max(50),
});

/**
 * Batched first-party tracking (SPEC §10). No GA4, no Meta Pixel.
 *
 * The attempt is taken from the signed cookie and the client's own `attemptId` is
 * ignored: it is unverified input, and trusting it would let anyone write events onto
 * someone else's attempt — or hand us an id that breaks the foreign key.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const meta = await requestMeta();
  if (meta.ipHash && !(await rateLimit(`events:${meta.ipHash}`, 400, 600))) {
    // Tracking is never worth failing a request over; just stop recording.
    return NextResponse.json({ ok: true, recorded: 0 });
  }

  const attemptId = await readAttemptCookie();
  const exists = attemptId ? await prisma.attempt.findUnique({ where: { id: attemptId }, select: { id: true } }) : null;

  await prisma.event
    .createMany({
      data: parsed.data.events.map((e) => ({
        attemptId: exists?.id ?? null,
        name: e.name,
        props: e.props as object,
      })),
    })
    .catch(() => {});

  return NextResponse.json({ ok: true, recorded: parsed.data.events.length });
}
