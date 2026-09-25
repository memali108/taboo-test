"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { currentAttempt } from "@/lib/attempt";
import { isE2ERequest } from "@/lib/e2e";
import { normalizeEmail, isValidEmail } from "@/lib/contact";
import { domainCanReceiveMail, emailDomain } from "@/lib/email-domain";
import { rateLimit } from "@/lib/ratelimit";
import { requestMeta } from "@/lib/request";
import { score } from "@/lib/scoring";
import { computeSubmission } from "@/lib/submit";
import { isComplete } from "@/lib/answers";
import { requiresDataConsent } from "@/lib/config";
import { SECTIONS } from "@/config/test";

export type SendState = {
  error?: string;
  field?: "firstName" | "email" | "dataConsent";
  /**
   * Echoed back on every failure so the form repopulates. This is the last step before
   * they get their results; making someone retype their email over a validation slip
   * loses them (taboo-quiz DECISIONS, "Email validation and form-state preservation").
   */
  values?: { firstName: string; email: string; consent: boolean; dataConsent: boolean };
};

const Schema = z.object({
  firstName: z.string().trim().min(1).max(80),
  email: z.string().trim().max(254),
  // Optional: the results email is the service they asked for by submitting. This box is
  // consent to the ongoing mailing list only, so its absence is not an error.
  consent: z.string().optional(),
  // Only required when REQUIRE_DATA_CONSENT is on (SPEC §12).
  dataConsent: z.string().optional(),
  renderedAt: z.coerce.number(),
  website: z.string().max(0), // honeypot
});

export async function submitAction(_prev: SendState, form: FormData): Promise<SendState> {
  const raw = Object.fromEntries(form.entries());
  const values = {
    firstName: String(form.get("firstName") ?? ""),
    email: String(form.get("email") ?? ""),
    consent: form.get("consent") === "on",
    dataConsent: form.get("dataConsent") === "on",
  };
  const fail = (error: string, field?: SendState["field"]): SendState => ({ error, field, values });

  const parsed = Schema.safeParse({ ...raw, website: raw.website ?? "" });
  if (!parsed.success) {
    const path = parsed.error.issues[0]?.path[0];
    if (path === "website") return fail("Something went wrong. Please try again.");
    if (path === "firstName") return fail("Please tell us your first name.", "firstName");
    return fail("Please check your email address.", "email");
  }

  const { firstName, renderedAt } = parsed.data;
  const marketingConsent = parsed.data.consent === "on";
  const email = normalizeEmail(parsed.data.email);
  if (!isValidEmail(email)) return fail("Please check your email address.", "email");

  if (requiresDataConsent() && parsed.data.dataConsent !== "on") {
    return fail("Please tick the box so I can store your answers and send your results.", "dataConsent");
  }

  // Humans don't submit within 2 seconds of the form rendering.
  if (Date.now() - renderedAt < 2000) return fail("Please take a moment and try again.");

  const meta = await requestMeta();
  if (meta.ipHash && !(await rateLimit(`send:${meta.ipHash}`, 20, 900))) {
    return fail("Too many attempts from this connection. Please try again in a few minutes.");
  }

  // Domain-level MX check, after the rate limit so this cannot be used as an open DNS
  // resolver. Fails open on timeout — see src/lib/email-domain.ts.
  const domain = emailDomain(email);
  if (domain && !(await domainCanReceiveMail(domain))) {
    return fail("That email domain doesn't look right — can you check it?", "email");
  }

  const attempt = await currentAttempt();
  if (!attempt) redirect("/");
  // Browser-back onto an already submitted attempt: reuse it rather than scoring twice.
  if (attempt.status === "submitted") redirect(`/r/${attempt.publicId}`);
  if (attempt.status === "started" || !isComplete(attempt.answers)) redirect("/test");

  const scored = score(attempt.answers, attempt.testVersion);
  const isSeed = attempt.isSeed || (await isE2ERequest());
  const now = new Date();

  const existing = await prisma.contact.findUnique({
    where: { email },
    select: { id: true, attemptCount: true, tags: true },
  });
  const plan = computeSubmission(existing ? { attemptCount: existing.attemptCount, tags: existing.tags } : null, scored);

  await prisma.$transaction(async (tx) => {
    const contact = await tx.contact.upsert({
      where: { email },
      create: {
        email,
        firstName,
        attemptCount: plan.attemptNumber,
        lastSubmittedAt: now,
        tags: plan.tags,
        // consentAt/consentSource mean MARKETING consent, and are set only when the
        // optional box was ticked — never as a side effect of submitting.
        ...(marketingConsent ? { consentAt: now, consentSource: "taboo-test" } : {}),
        // A contact created by a test run must never reach GoHighLevel either.
        isSeed,
      },
      update: {
        firstName,
        attemptCount: plan.attemptNumber,
        lastSubmittedAt: now,
        tags: plan.tags,
        ...(marketingConsent ? { consentAt: now, consentSource: "taboo-test" } : {}),
      },
      select: { id: true },
    });

    await tx.attempt.update({
      where: { id: attempt.id },
      data: {
        contactId: contact.id,
        status: "submitted",
        submittedAt: now,
        attemptNumber: plan.attemptNumber,
        sexScore: scored.sections.sex.total,
        deathScore: scored.sections.death.total,
        cashScore: scored.sections.cash.total,
        sexLevel: scored.sections.sex.level,
        deathLevel: scored.sections.death.level,
        cashLevel: scored.sections.cash.level,
        terrain: scored.terrain,
      },
    });

    await tx.event.create({
      data: {
        attemptId: attempt.id,
        name: "tbt_submitted",
        props: {
          attempt_number: plan.attemptNumber,
          is_retake: plan.isRetake,
          marketing_consent: marketingConsent,
          ...Object.fromEntries(SECTIONS.map((s) => [`${s}_score`, scored.sections[s].total])),
        },
      },
    });
  });

  // Phase 4 fires the GoHighLevel webhook here — never blocking, never throwing, and
  // never for a seed attempt (`shouldDeliverWebhook`). GHL is not configured yet.

  redirect(`/r/${attempt.publicId}`);
}
