const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Date range, as a plain GET form so the range lives in the URL and can be shared. */
export function RangePicker({ from, to }: { from: Date; to: Date }) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      {(
        [
          ["from", "From", iso(from)],
          ["to", "To", iso(to)],
        ] as const
      ).map(([name, label, value]) => (
        <label key={name} className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-3">
          {label}
          <input
            type="date"
            name={name}
            defaultValue={value}
            className="mt-1 block min-h-11 rounded-lg border border-line bg-white px-3 text-sm text-ink"
          />
        </label>
      ))}
      <button type="submit" className="min-h-11 rounded-full bg-red px-5 text-sm font-semibold text-white hover:bg-red-deep">
        Apply
      </button>
    </form>
  );
}
