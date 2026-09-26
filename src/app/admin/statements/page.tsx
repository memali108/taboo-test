import { parseRange, statementStats } from "@/lib/admin-stats";
import { SECTION_COPY } from "@/config/copy";
import { STATEMENTS } from "@/config/test";
import { Card, Table } from "@/components/admin/ui";
import { RangePicker } from "@/components/admin/RangePicker";

export const dynamic = "force-dynamic";

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const range = parseRange(await searchParams);
  const stats = await statementStats(range);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl text-red">Statements</h1>
        <RangePicker from={range.from} to={range.to} />
      </div>

      <Card title="Mean item score, after reversal — lowest first">
        <Table
          head={["#", "Section", "Statement", "Mean", "n"]}
          rows={stats.map((s) => [
            s.index + 1,
            SECTION_COPY[s.section].name,
            <span key="t" className={STATEMENTS[s.index].reversed ? "italic" : undefined}>
              {s.text}
              {STATEMENTS[s.index].reversed && <span className="text-ink-3"> (reversed)</span>}
            </span>,
            s.n ? s.mean.toFixed(2) : "—",
            s.n,
          ])}
          empty="No submissions in this range."
        />
        <p className="mt-3 text-xs text-ink">
          Scores are after reversal, so 1 always means “most contracted” and 5 “most free”, whichever way the statement
          is worded. The lowest means are the statements people find hardest.
        </p>
      </Card>
    </div>
  );
}
