import { levelStats, parseRange } from "@/lib/admin-stats";
import { SECTIONS } from "@/config/test";
import { SECTION_COPY, RESULTS } from "@/config/copy";
import { Card, BarRow, Table } from "@/components/admin/ui";
import { RangePicker } from "@/components/admin/RangePicker";

export const dynamic = "force-dynamic";
const LEVELS = ["low", "medium", "high"] as const;

export default async function LevelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const range = parseRange(await searchParams);
  const { levels, terrain, noTerrain, total } = await levelStats(range);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl text-red">Levels</h1>
        <RangePicker from={range.from} to={range.to} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {SECTIONS.map((s) => (
          <Card key={s} title={SECTION_COPY[s].name}>
            {LEVELS.map((l) => (
              <BarRow key={l} label={RESULTS.levelLabels[l]} value={levels[s][l]} total={total} />
            ))}
          </Card>
        ))}
      </div>

      <Card title="How often each section is the terrain">
        {SECTIONS.map((s) => (
          <BarRow key={s} label={SECTION_COPY[s].name} value={terrain[s]} total={total} />
        ))}
        <BarRow label="No terrain" value={noTerrain} total={total} />
        <p className="mt-3 text-xs text-ink">
          A two-way tie counts for both sections, so these sum to more than the number of submissions. “No terrain” is
          an all-three tie.
        </p>
        <div className="mt-4">
          <Table
            head={["Section", "Low", "Medium", "High", "Terrain"]}
            rows={SECTIONS.map((s) => [
              SECTION_COPY[s].name,
              levels[s].low,
              levels[s].medium,
              levels[s].high,
              terrain[s],
            ])}
            empty="No submissions in this range."
          />
        </div>
      </Card>

      <p className="text-xs text-ink">{total} submitted attempts in range.</p>
    </div>
  );
}
