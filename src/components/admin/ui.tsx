import type { ReactNode } from "react";

export function Card({ title, children, tone = "plain" }: { title?: string; children: ReactNode; tone?: "plain" | "bad" | "warn" | "ok" }) {
  const tones = {
    plain: "border-line bg-white",
    bad: "border-bad bg-bad-soft",
    warn: "border-warn bg-warn-soft",
    ok: "border-ok bg-ok-soft",
  } as const;
  return (
    <section className={`rounded-xl border p-5 ${tones[tone]}`}>
      {title && <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.1em] text-ink-3">{title}</h2>}
      {children}
    </section>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">{label}</p>
      <p className="font-display mt-1 text-4xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink">{hint}</p>}
    </div>
  );
}

/**
 * Every chart gets a table with the numbers (SPEC §11). There are no charts here yet —
 * the bars below ARE the table, with the value written in each row, so nothing depends on
 * reading a length.
 */
export function BarRow({ label, value, total, suffix = "" }: { label: string; value: number; total: number; suffix?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-28 shrink-0 text-sm text-ink">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper-3">
        <span className="block h-full rounded-full bg-sea-deep" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-24 shrink-0 text-right text-sm tabular-nums text-ink">
        {value}
        {suffix} <span className="text-ink-3">({pct}%)</span>
      </span>
    </div>
  );
}

export function Table({ head, rows, empty = "Nothing yet." }: { head: string[]; rows: ReactNode[][]; empty?: string }) {
  if (!rows.length) return <p className="text-sm text-ink">{empty}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[32rem] border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-line px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-ink-3">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => (
                <td key={j} className="border-b border-line px-2 py-2 text-ink">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
