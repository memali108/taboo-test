import "server-only";
import { prisma } from "./db";
import { NOT_SEED } from "./seed";
import { SECTIONS, STATEMENTS, STATEMENT_COUNT, type Section } from "@/config/test";
import { itemScore, levelFor, type Level } from "./scoring";

/**
 * Admin numbers (SPEC §11).
 *
 * EVERY query here starts from `NOT_SEED`. Rows created by an automated test run must
 * never appear in the funnel — see src/lib/seed.ts.
 */

export type Range = { from: Date; to: Date };

/** Default window: the last 30 days, inclusive of today. */
export function defaultRange(): Range {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return { from, to };
}

export function parseRange(sp: Record<string, string | string[] | undefined>): Range {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const d = (s: string | undefined, fallback: Date) => {
    if (!s) return fallback;
    const parsed = new Date(s);
    return Number.isNaN(parsed.getTime()) ? fallback : parsed;
  };
  const base = defaultRange();
  const from = d(one("from"), base.from);
  const to = d(one("to"), base.to);
  // End of the chosen day, so "to = today" includes today's attempts.
  to.setHours(23, 59, 59, 999);
  return { from, to };
}

const inRange = (r: Range) => ({ ...NOT_SEED, startedAt: { gte: r.from, lte: r.to } });

export type Funnel = {
  started: number;
  completed: number;
  submitted: number;
  completionRate: number;
  submissionRate: number;
  medianCompletionMs: number | null;
};

export async function funnel(r: Range): Promise<Funnel> {
  const where = inRange(r);
  const [started, completed, submitted, times] = await Promise.all([
    prisma.attempt.count({ where }),
    prisma.attempt.count({ where: { ...where, completedAt: { not: null } } }),
    prisma.attempt.count({ where: { ...where, status: "submitted" } }),
    prisma.attempt.findMany({
      where: { ...where, completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
    }),
  ]);

  const durations = times
    .map((t) => (t.completedAt ? t.completedAt.getTime() - t.startedAt.getTime() : null))
    .filter((n): n is number => n !== null && n > 0)
    .sort((a, b) => a - b);

  return {
    started,
    completed,
    submitted,
    completionRate: started ? completed / started : 0,
    submissionRate: completed ? submitted / completed : 0,
    medianCompletionMs: durations.length ? durations[Math.floor(durations.length / 2)] : null,
  };
}

export type LevelStats = Record<Section, Record<Level, number>>;

/** Level distribution per section, plus how often each section is the terrain. */
export async function levelStats(r: Range): Promise<{ levels: LevelStats; terrain: Record<Section, number>; noTerrain: number; total: number }> {
  const rows = await prisma.attempt.findMany({
    where: { ...inRange(r), status: "submitted" },
    select: { sexLevel: true, deathLevel: true, cashLevel: true, terrain: true },
  });

  const levels = Object.fromEntries(
    SECTIONS.map((s) => [s, { low: 0, medium: 0, high: 0 }]),
  ) as LevelStats;
  const terrain = Object.fromEntries(SECTIONS.map((s) => [s, 0])) as Record<Section, number>;
  let noTerrain = 0;

  for (const row of rows) {
    const bySection = { sex: row.sexLevel, death: row.deathLevel, cash: row.cashLevel };
    for (const s of SECTIONS) {
      const l = bySection[s];
      if (l) levels[s][l as Level] += 1;
    }
    if (!row.terrain.length) noTerrain += 1;
    for (const t of row.terrain) if ((SECTIONS as readonly string[]).includes(t)) terrain[t as Section] += 1;
  }

  return { levels, terrain, noTerrain, total: rows.length };
}

export type StatementStat = { index: number; section: Section; text: string; mean: number; n: number };

/**
 * Mean item score per statement, AFTER reversal, lowest first — which statements hit
 * hardest (SPEC §11). Computed in JS from the raw answer strings rather than in SQL,
 * because reversal lives in `src/config/test.ts` and must not be reimplemented here.
 */
export async function statementStats(r: Range): Promise<StatementStat[]> {
  const rows = await prisma.attempt.findMany({
    where: { ...inRange(r), status: "submitted" },
    select: { answers: true },
  });

  const sums = new Array(STATEMENT_COUNT).fill(0);
  const counts = new Array(STATEMENT_COUNT).fill(0);
  for (const { answers } of rows) {
    if (answers.length !== STATEMENT_COUNT) continue;
    for (let i = 0; i < STATEMENT_COUNT; i++) {
      sums[i] += itemScore(Number(answers[i]), STATEMENTS[i].reversed);
      counts[i] += 1;
    }
  }

  return STATEMENTS.map((s) => ({
    index: s.index,
    section: s.section,
    text: s.text,
    n: counts[s.index],
    mean: counts[s.index] ? sums[s.index] / counts[s.index] : 0,
  })).sort((a, b) => a.mean - b.mean);
}

export { levelFor };

/**
 * The 7-day window the Health page alerts on.
 *
 * Deliberately evaluated per request: "the last 7 days" is relative to when someone
 * looks. It lives here rather than inline in the page because a Server Component body is
 * held to React's purity rule, and a clock read there reads as a bug even when it is not.
 */
export const HEALTH_WINDOW_DAYS = 7;
export function healthWindowStart(): Date {
  return new Date(Date.now() - HEALTH_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}
