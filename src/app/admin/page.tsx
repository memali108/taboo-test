import { funnel, parseRange } from "@/lib/admin-stats";
import { Card, Kpi, BarRow, Table } from "@/components/admin/ui";
import { RangePicker } from "@/components/admin/RangePicker";

export const dynamic = "force-dynamic";

const pct = (n: number) => `${Math.round(n * 100)}%`;
const duration = (ms: number | null) => {
  if (ms === null) return "—";
  const s = Math.round(ms / 1000);
  return s < 90 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
};

export default async function OverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const range = parseRange(await searchParams);
  const f = await funnel(range);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl text-red">Overview</h1>
        <RangePicker from={range.from} to={range.to} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Started" value={f.started} />
        <Kpi label="Completed" value={f.completed} hint={`${pct(f.completionRate)} of started`} />
        <Kpi label="Submitted" value={f.submitted} hint={`${pct(f.submissionRate)} of completed`} />
        <Kpi label="Median time" value={duration(f.medianCompletionMs)} hint="start → 15th statement" />
      </div>

      <Card title="Funnel">
        <BarRow label="Started" value={f.started} total={f.started} />
        <BarRow label="Completed" value={f.completed} total={f.started} />
        <BarRow label="Submitted" value={f.submitted} total={f.started} />
        <div className="mt-4">
          <Table
            head={["Step", "Count", "Of started"]}
            rows={[
              ["Started", f.started, "100%"],
              ["Completed", f.completed, pct(f.completionRate)],
              ["Submitted", f.submitted, f.started ? pct(f.submitted / f.started) : "—"],
            ]}
          />
        </div>
      </Card>

      <p className="text-xs text-ink">
        Cohorts are by attempt start date. Rows created by an automated test run (<code>isSeed</code>) are excluded
        everywhere in admin.
      </p>
    </div>
  );
}
