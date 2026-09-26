"use client";
import { useActionState, useEffect, useRef } from "react";
import { SEND } from "@/config/copy";
import { Tbd } from "@/components/Tbd";
import { submitAction, type SendState } from "./actions";

const isTbd = (s: string) => s.startsWith("[COPY TBD");
const Copy = ({ text }: { text: string }) => (isTbd(text) ? <Tbd>{text}</Tbd> : <>{text}</>);

export function SendForm({ requireDataConsent }: { requireDataConsent: boolean }) {
  const [state, action, pending] = useActionState<SendState, FormData>(submitAction, {});

  /**
   * A failed submission must not empty the form. React resets the form once the action
   * resolves, and resets each field to its *current* default — so echoing the submitted
   * values back from the action and feeding them in as defaults is what repopulates it.
   * Controlled inputs do not work here: the reset unchecks the data-consent box in the
   * DOM and the `checked` prop does not re-assert. This also repopulates on the no-JS
   * path.
   */
  const v = state.values;

  /**
   * Stamped once on mount, via a ref to avoid an SSR/client time mismatch. Deliberately
   * not re-stamped after a failed submit: that would make a quick, legitimate retry trip
   * the minimum-time guard.
   */
  const renderedAt = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (renderedAt.current) renderedAt.current.value = String(Date.now());
  }, []);

  const err = (f: SendState["field"]) => (state.field === f ? state.error : undefined);
  const input =
    "mt-2 block w-full min-h-14 rounded-xl border bg-white px-4 text-base text-ink placeholder:text-ink focus:border-ink";

  return (
    <form action={action} className="mt-8 flex flex-col gap-5" noValidate>
      <input type="hidden" name="renderedAt" defaultValue="0" ref={renderedAt} />
      {/* Honeypot: hidden from humans, tempting to bots. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <div>
        <label htmlFor="firstName" className="text-sm font-semibold uppercase tracking-wider text-ink-3">
          First name
        </label>
        <input
          id="firstName"
          name="firstName"
          required
          autoComplete="given-name"
          maxLength={80}
          defaultValue={v?.firstName ?? ""}
          aria-invalid={!!err("firstName")}
          aria-describedby={err("firstName") ? "firstName-err" : undefined}
          className={`${input} ${err("firstName") ? "border-bad" : "border-line"}`}
        />
        {err("firstName") && (
          <p id="firstName-err" className="mt-1 text-sm text-bad">
            {err("firstName")}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="text-sm font-semibold uppercase tracking-wider text-ink-3">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          maxLength={254}
          defaultValue={v?.email ?? ""}
          aria-invalid={!!err("email")}
          aria-describedby={err("email") ? "email-err" : undefined}
          className={`${input} ${err("email") ? "border-bad" : "border-line"}`}
        />
        {err("email") && (
          <p id="email-err" className="mt-1 text-sm text-bad">
            {err("email")}
          </p>
        )}
      </div>

      {requireDataConsent && (
        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-base text-ink-2">
            <input
              type="checkbox"
              name="dataConsent"
              defaultChecked={v?.dataConsent ?? false}
              aria-invalid={!!err("dataConsent")}
              className="mt-1 size-5 shrink-0 accent-red"
            />
            <span>
              <Copy text={SEND.dataConsentLabel} />
            </span>
          </label>
          {err("dataConsent") && <p className="mt-1 text-sm text-bad">{err("dataConsent")}</p>}
        </div>
      )}

      {state.error && !state.field && (
        <p role="alert" className="rounded-md bg-bad-soft px-4 py-3 text-sm text-bad">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-14 items-center justify-center rounded-full bg-red px-10 text-base font-semibold text-white transition hover:bg-red-deep active:scale-[0.98] disabled:opacity-60"
      >
        <Copy text={SEND.button} />
      </button>

      <p className="text-xs leading-relaxed text-ink">
        <Copy text={SEND.finePrint} />{" "}
        <a href="/privacy" className="underline underline-offset-2 hover:text-ink" target="_blank" rel="noopener">
          Privacy Policy ↗
        </a>
      </p>
    </form>
  );
}
