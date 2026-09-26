"use client";
import { deleteContact } from "./actions";

export function DeleteContact({ contactId, email }: { contactId: string; email: string }) {
  return (
    <form action={deleteContact} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="contactId" value={contactId} />
      <label className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
        Type <code className="normal-case">{email}</code> to confirm
        <input
          name="confirm"
          required
          autoComplete="off"
          className="mt-1 block min-h-11 w-72 max-w-full rounded-lg border border-line bg-white px-3 text-sm text-ink"
        />
      </label>
      <button type="submit" className="min-h-11 rounded-full bg-bad px-5 text-sm font-semibold text-white hover:opacity-90">
        Delete permanently
      </button>
    </form>
  );
}
