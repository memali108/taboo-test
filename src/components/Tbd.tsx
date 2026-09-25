/**
 * Renders an unwritten copy slot as-is, brackets and all, so it is visible in
 * review (SPEC §0.4). Marked up rather than styled away: a placeholder that
 * blends in is a placeholder that ships.
 */
export function Tbd({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span
      data-copy-tbd
      className={`rounded-sm border border-dashed border-ink-3 bg-paper-2 px-1.5 py-0.5 text-ink-3 ${className}`}
    >
      {children}
    </span>
  );
}
