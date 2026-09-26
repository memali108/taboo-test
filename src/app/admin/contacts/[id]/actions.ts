"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/session";
import { score } from "@/lib/scoring";
import { computeSubmission } from "@/lib/submit";
import { previousSubmission } from "@/lib/history";
import { buildPayload } from "@/lib/webhook-payload";
import { deliverWebhook } from "@/lib/webhook";

async function guard() {
  if (!(await isAdmin())) throw new Error("not-admin");
}

/** Resend one person's result by hand after a delivery failure (SPEC §8.2). */
export async function resendWebhook(formData: FormData) {
  await guard();
  const attemptId = String(formData.get("attemptId") ?? "");
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { contact: { select: { id: true, email: true, firstName: true, attemptCount: true, tags: true } } },
  });
  if (!attempt?.contact || attempt.status !== "submitted") return;

  const scored = score(attempt.answers, attempt.testVersion);
  const previous = await previousSubmission(attempt.contact.id, attempt.id);
  await deliverWebhook(
    buildPayload({
      firstName: attempt.contact.firstName,
      email: attempt.contact.email,
      publicId: attempt.publicId,
      answers: attempt.answers,
      testVersion: attempt.testVersion,
      scored,
      submittedAt: attempt.submittedAt ?? new Date(),
      attemptNumber: attempt.attemptNumber ?? computeSubmission(null, scored).attemptNumber,
      tags: attempt.contact.tags,
      previous,
    }),
    { isSeed: attempt.isSeed },
  );
  revalidatePath(`/admin/contacts/${attempt.contact.id}`);
}

/**
 * Deletion request (SPEC §12). Removes the contact and every attempt, answer and event
 * belonging to them.
 *
 * `Attempt.contactId` is `onDelete: SetNull`, so deleting the contact alone would ORPHAN
 * the attempts — the answers would survive, detached, which is not what someone asking to
 * be deleted means. The attempts go first, explicitly.
 */
export async function deleteContact(formData: FormData) {
  await guard();
  const id = String(formData.get("contactId") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const contact = await prisma.contact.findUnique({ where: { id }, select: { email: true } });
  if (!contact) redirect("/admin/contacts");
  // Typing the address is the guard against a mis-click on an irreversible action.
  if (confirm.trim().toLowerCase() !== contact.email) {
    redirect(`/admin/contacts/${id}?error=confirm`);
  }

  await prisma.$transaction(async (tx) => {
    const attempts = await tx.attempt.findMany({ where: { contactId: id }, select: { id: true } });
    const ids = attempts.map((a) => a.id);
    if (ids.length) {
      await tx.event.deleteMany({ where: { attemptId: { in: ids } } });
      await tx.attempt.deleteMany({ where: { id: { in: ids } } });
    }
    await tx.contact.delete({ where: { id } });
  });

  redirect("/admin/contacts?deleted=1");
}
