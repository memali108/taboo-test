import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { readAttemptCookie } from "@/lib/session";
import { rateLimit } from "@/lib/ratelimit";
import { requestMeta } from "@/lib/request";
import { applyAnswer, AnswerError, isComplete } from "@/lib/answers";
import { STATEMENT_COUNT } from "@/config/test";
import { isE2ERequest } from "@/lib/e2e";

export const dynamic = "force-dynamic";

const Body = z.object({
  statement: z.number().int().min(0).max(STATEMENT_COUNT - 1),
  rating: z.number().int().min(1).max(5),
});

/**
 * Records one answer (SPEC §4). The attempt comes from the signed cookie, never from the
 * request body, so a caller cannot write into somebody else's attempt.
 */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const meta = await requestMeta();
  // Generous: a full run is 15 writes, and changing answers with Back adds more.
  if (meta.ipHash && !(await rateLimit(`answer:${meta.ipHash}`, 300, 600))) {
    return NextResponse.json({ error: "rate-limited" }, { status: 429 });
  }

  const id = await readAttemptCookie();
  const attempt = id ? await prisma.attempt.findUnique({ where: { id } }) : null;
  // `reset` tells the client to start over rather than showing a dead end — the cookie
  // has expired, or been signed with a rotated SESSION_SECRET.
  if (!attempt) return NextResponse.json({ error: "no-attempt", reset: true }, { status: 409 });
  if (attempt.status !== "started") {
    return NextResponse.json({ error: "not-editable", status: attempt.status }, { status: 409 });
  }

  let answers: string;
  try {
    answers = applyAnswer(attempt.answers, parsed.data.statement, parsed.data.rating);
  } catch (e) {
    if (e instanceof AnswerError) return NextResponse.json({ error: "bad-answer" }, { status: 400 });
    throw e;
  }

  const completed = isComplete(answers);
  const saved = await prisma.attempt.update({
    where: { id: attempt.id },
    data: {
      answers,
      ...(completed ? { status: "completed" as const, completedAt: new Date() } : {}),
    },
    select: { answers: true, status: true },
  });

  // Echoed back only to a caller holding E2E_TOKEN, so the Playwright suite can assert
  // that its rows really were flagged. Without this the flag is invisible from outside
  // the database, and "the seed flag is set" stays an assumption rather than a test.
  const seedEcho = (await isE2ERequest()) ? { isSeed: attempt.isSeed } : {};
  return NextResponse.json({ ok: true, answers: saved.answers, completed, ...seedEcho });
}
