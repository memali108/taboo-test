"use client";
import { useActionState, useState, useTransition } from "react";
import { saveWebhookUrl, sendTestPayload, type SettingsState } from "./actions";

export function SettingsForms({ savedUrl, canTest }: { savedUrl: string; canTest: boolean }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(saveWebhookUrl, {});
  const [testState, setTestState] = useState<SettingsState>({});
  const [testing, startTest] = useTransition();

  const note = (s: SettingsState) =>
    s.error ? (
      <p role="alert" className="mt-2 rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">
        {s.error}
      </p>
    ) : s.message ? (
      <p className="mt-2 rounded-md bg-ok-soft px-3 py-2 text-sm text-ok">{s.message}</p>
    ) : null;

  return (
    <div className="flex flex-col gap-5">
      <form action={action} className="flex flex-col gap-3">
        <label htmlFor="url" className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
          Inbound webhook URL
        </label>
        <input
          id="url"
          name="url"
          type="url"
          inputMode="url"
          defaultValue={savedUrl}
          placeholder="https://services.leadconnectorhq.com/hooks/…"
          className="min-h-12 rounded-lg border border-line bg-white px-3 text-sm text-ink"
        />
        <div>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-full bg-red px-5 text-sm font-semibold text-white hover:bg-red-deep disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </div>
        {note(state)}
      </form>

      <div className="border-t border-line pt-4">
        <p className="text-sm text-ink">
          Sends one realistic fake result so GoHighLevel can see every field and map them.
        </p>
        <button
          type="button"
          disabled={!canTest || testing}
          onClick={() => startTest(async () => setTestState(await sendTestPayload()))}
          className="mt-3 min-h-11 rounded-full border border-red px-5 text-sm font-semibold text-red hover:bg-red-soft disabled:opacity-40"
        >
          {testing ? "Sending…" : "Send test payload"}
        </button>
        {note(testState)}
      </div>
    </div>
  );
}
