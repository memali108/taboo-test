import "server-only";
import { prisma } from "./db";
import { newPublicId } from "./public-id";
import { requestMeta } from "./request";
import { readAttemptCookie, setAttemptCookie } from "./session";
import { TEST_ID, TEST_VERSION } from "@/config/test";
import type { Attempt } from "@prisma/client";

export type Entry = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
};

const trim = (v: string | null | undefined, max = 200) => (v ? v.slice(0, max) : null);

/**
 * Start an attempt and set the signed `tbt_attempt` cookie for 7 days (SPEC §4.1).
 * Entry attribution is captured once, here, because the landing URL is the only place
 * the UTM parameters exist.
 */
export async function createAttempt(entry: Entry): Promise<Attempt> {
  const meta = await requestMeta();
  const attempt = await prisma.attempt.create({
    data: {
      publicId: newPublicId(),
      testVersion: TEST_VERSION,
      utmSource: trim(entry.utmSource),
      utmMedium: trim(entry.utmMedium),
      utmCampaign: trim(entry.utmCampaign),
      utmContent: trim(entry.utmContent),
      referrer: trim(meta.referrer, 500),
      device: meta.device,
      country: meta.country,
      ipHash: meta.ipHash,
    },
  });
  await setAttemptCookie(attempt.id);
  // Recorded server-side rather than from the browser: this is the one event that must
  // not be lost to a redirect, an ad blocker or a beacon that never fires.
  await prisma.event
    .create({
      data: {
        attemptId: attempt.id,
        name: "tbt_started",
        props: { test_id: TEST_ID, test_version: TEST_VERSION, device: meta.device },
      },
    })
    .catch(() => {});
  return attempt;
}

/** The attempt this browser is carrying, or null. */
export async function currentAttempt(): Promise<Attempt | null> {
  const id = await readAttemptCookie();
  if (!id) return null;
  return prisma.attempt.findUnique({ where: { id } });
}
