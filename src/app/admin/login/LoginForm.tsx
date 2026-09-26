"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <label htmlFor="password" className="text-sm font-semibold uppercase tracking-wider text-ink-3">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="min-h-14 rounded-xl border border-line bg-white px-4 text-base text-ink"
      />
      {state.error && (
        <p role="alert" className="rounded-md bg-bad-soft px-4 py-3 text-sm text-bad">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-14 items-center justify-center rounded-full bg-red px-8 text-base font-semibold text-white hover:bg-red-deep disabled:opacity-60"
      >
        {pending ? "Checking…" : "Log in"}
      </button>
    </form>
  );
}
