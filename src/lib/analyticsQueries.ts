import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { referrerGroup } from "@/lib/analyticsCore";
import { sydneyToDate } from "@/lib/adminContent";

// "at" is stored as UTC. Days are Sydney days.
const LOCAL = Prisma.raw(`("at" AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Sydney')`);
const DAY = Prisma.raw(`("at" AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Sydney')::date`);
const VISITOR = Prisma.raw(`(("at" AT TIME ZONE 'UTC' AT TIME ZONE 'Australia/Sydney')::date::text || "sessionHash")`);

export type Period = { from: Date; to: Date; label: string; days: number; fromDate: string; toDate: string };
export type Range = { current: Period; previous: Period; preset: string };

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (iso: string, n: number) => isoDay(new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000));
const todaySydney = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date()); // YYYY-MM-DD

function period(fromDate: string, toDate: string): Period {
  const from = sydneyToDate(`${fromDate}T00:00`)!;
  const to = sydneyToDate(`${addDays(toDate, 1)}T00:00`)!; // exclusive
  const days = Math.round((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000) + 1;
  return { from, to, days, fromDate, toDate, label: fromDate === toDate ? fromDate : `${fromDate} to ${toDate}` };
}

export function parseRange(sp: { range?: string; from?: string; to?: string }): Range {
  const today = todaySydney();
  const ok = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  let fromDate: string, toDate: string, preset = sp.range ?? "30";
  if (ok(sp.from) && ok(sp.to) && sp.from! <= sp.to!) {
    fromDate = sp.from!; toDate = sp.to!; preset = "custom";
  } else {
    const n = ["7", "30", "90", "365"].includes(preset) ? Number(preset) : 30;
    preset = String(n); toDate = today; fromDate = addDays(today, -(n - 1));
  }
  const current = period(fromDate, toDate);
  const prevTo = addDays(fromDate, -1);
  const previous = period(addDays(prevTo, -(current.days - 1)), prevTo);
  return { current, previous, preset };
}

const n = (v: unknown) => Number(v ?? 0);

export async function totals(p: Period) {
  const [t] = await db.$queryRaw<{ views: bigint; visitors: bigint }[]>`
    SELECT count(*) AS views, count(DISTINCT ${VISITOR}) AS visitors
    FROM "PageView" WHERE "at" >= ${p.from} AND "at" < ${p.to}`;
  // Returning = the same weekly hash was already seen on an earlier day.
  const [r] = await db.$queryRaw<{ returning: bigint; fresh: bigint }[]>`
    WITH days AS (
      SELECT DISTINCT ${DAY} AS d, "weekHash" AS w FROM "PageView" WHERE "weekHash" IS NOT NULL AND "at" < ${p.to}
    ), firsts AS (SELECT w, min(d) AS first_d FROM days GROUP BY w)
    SELECT count(*) FILTER (WHERE days.d > firsts.first_d) AS returning,
           count(*) FILTER (WHERE days.d = firsts.first_d) AS fresh
    FROM days JOIN firsts USING (w)
    WHERE days.d >= ${p.fromDate}::date AND days.d <= ${p.toDate}::date`;
  return { views: n(t?.views), visitors: n(t?.visitors), returning: n(r?.returning), fresh: n(r?.fresh) };
}

export type Gran = "day" | "week" | "month";
export async function series(p: Period, gran: Gran) {
  const g = Prisma.raw(`'${gran}'`);
  const rows = await db.$queryRaw<{ bucket: Date; views: bigint; visitors: bigint }[]>`
    SELECT date_trunc(${g}, ${LOCAL})::date AS bucket, count(*) AS views, count(DISTINCT ${VISITOR}) AS visitors
    FROM "PageView" WHERE "at" >= ${p.from} AND "at" < ${p.to}
    GROUP BY 1 ORDER BY 1`;
  const map = new Map(rows.map((r) => [isoDay(r.bucket), { views: n(r.views), visitors: n(r.visitors) }]));
  // Fill empty buckets so a quiet day shows as zero.
  const out: { date: string; views: number; visitors: number }[] = [];
  let cur = new Date(`${p.fromDate}T00:00:00Z`);
  const end = new Date(`${p.toDate}T00:00:00Z`);
  const key = (d: Date) => {
    const t = new Date(d);
    if (gran === "week") t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
    if (gran === "month") t.setUTCDate(1);
    return isoDay(t);
  };
  const seen = new Set<string>();
  while (cur <= end) {
    const k = key(cur);
    if (!seen.has(k)) { seen.add(k); out.push({ date: k, ...(map.get(k) ?? { views: 0, visitors: 0 }) }); }
    cur = new Date(cur.getTime() + 86_400_000);
  }
  return out;
}

export async function topPages(p: Period, limit = 15) {
  const rows = await db.$queryRaw<{ path: string; views: bigint; visitors: bigint }[]>`
    SELECT path, count(*) AS views, count(DISTINCT ${VISITOR}) AS visitors FROM "PageView"
    WHERE "at" >= ${p.from} AND "at" < ${p.to} GROUP BY path ORDER BY views DESC, path LIMIT ${limit}`;
  return rows.map((r) => ({ path: r.path, views: n(r.views), visitors: n(r.visitors) }));
}

export async function bySection(p: Period) {
  const rows = await db.$queryRaw<{ k: string | null; views: bigint }[]>`
    SELECT "contentType" AS k, count(*) AS views FROM "PageView"
    WHERE "at" >= ${p.from} AND "at" < ${p.to} GROUP BY 1 ORDER BY views DESC`;
  const names: Record<string, string> = { home: "Home", incoming: "Incoming", offair: "Off Air", rated: "Rated", hotair: "Hot Air", ranked: "Ranked" };
  return rows.map((r) => ({ section: names[r.k ?? ""] ?? r.k ?? "Other", views: n(r.views) }));
}

export async function referrers(p: Period) {
  const rows = await db.$queryRaw<{ ref: string | null; views: bigint }[]>`
    SELECT referrer AS ref, count(*) AS views FROM "PageView"
    WHERE "at" >= ${p.from} AND "at" < ${p.to} AND (referrer IS NULL OR referrer <> '(internal)') GROUP BY 1`;
  const map = new Map<string, number>();
  for (const r of rows) { const g = referrerGroup(r.ref); map.set(g, (map.get(g) ?? 0) + n(r.views)); }
  return [...map.entries()].map(([source, views]) => ({ source, views })).sort((a, b) => b.views - a.views);
}

const AU_STATES: Record<string, string> = { "01": "ACT", "02": "NSW", "03": "NT", "04": "QLD", "05": "SA", "06": "TAS", "07": "VIC", "08": "WA" };
export async function places(p: Period) {
  const countries = await db.$queryRaw<{ k: string | null; views: bigint }[]>`
    SELECT country AS k, count(*) AS views FROM "PageView" WHERE "at" >= ${p.from} AND "at" < ${p.to} GROUP BY 1 ORDER BY views DESC LIMIT 15`;
  const states = await db.$queryRaw<{ k: string | null; views: bigint }[]>`
    SELECT region AS k, count(*) AS views FROM "PageView" WHERE "at" >= ${p.from} AND "at" < ${p.to} AND country = 'AU' GROUP BY 1 ORDER BY views DESC`;
  return {
    countries: countries.map((r) => ({ country: r.k ?? "Unknown", views: n(r.views) })),
    states: states.map((r) => ({ state: AU_STATES[r.k ?? ""] ?? r.k ?? "Unknown", views: n(r.views) })),
  };
}

export async function devices(p: Period) {
  const rows = await db.$queryRaw<{ k: string | null; views: bigint }[]>`
    SELECT device AS k, count(*) AS views FROM "PageView" WHERE "at" >= ${p.from} AND "at" < ${p.to} GROUP BY 1 ORDER BY views DESC`;
  return rows.map((r) => ({ device: r.k ?? "unknown", views: n(r.views) }));
}

// Views per release/review, this period against the last one, with a daily line.
export async function contentViews(p: Period, prev: Period) {
  const rows = await db.$queryRaw<{ type: string; id: string; cur: bigint; prev: bigint }[]>`
    SELECT "contentType" AS type, "contentId" AS id,
      count(*) FILTER (WHERE "at" >= ${p.from} AND "at" < ${p.to}) AS cur,
      count(*) FILTER (WHERE "at" >= ${prev.from} AND "at" < ${prev.to}) AS prev
    FROM "PageView" WHERE "contentId" IS NOT NULL AND "contentType" IN ('rated', 'incoming') AND "at" >= ${prev.from} AND "at" < ${p.to}
    GROUP BY 1, 2 ORDER BY cur DESC, prev DESC LIMIT 40`;
  const ids = rows.map((r) => r.id);
  const daily = ids.length
    ? await db.$queryRaw<{ id: string; d: Date; v: bigint }[]>`
        SELECT "contentId" AS id, ${DAY} AS d, count(*) AS v FROM "PageView"
        WHERE "contentId" IN (${Prisma.join(ids)}) AND "at" >= ${p.from} AND "at" < ${p.to} GROUP BY 1, 2`
    : [];
  const [reviews, press] = await Promise.all([
    db.review.findMany({ where: { id: { in: ids } }, include: { release: true } }),
    db.pressRelease.findMany({ where: { id: { in: ids } }, include: { release: true } }),
  ]);
  const name = new Map<string, string>();
  reviews.forEach((r) => name.set(r.id, `${r.release.artist} – ${r.release.title}`));
  press.forEach((r) => name.set(r.id, `${r.release.artist} – ${r.release.title}`));
  const days: string[] = [];
  for (let d = p.fromDate; d <= p.toDate; d = addDays(d, 1)) days.push(d);
  return rows.filter((r) => name.has(r.id)).map((r) => {
    const cur = n(r.cur), prevV = n(r.prev);
    const byDay = new Map(daily.filter((x) => x.id === r.id).map((x) => [isoDay(x.d), n(x.v)]));
    // Growing: at least 5 views and up at least 50% on the last period (or new with 5+).
    const growing = cur >= 5 && (prevV === 0 || cur >= prevV * 1.5);
    return { section: r.type === "rated" ? "Rated" : "Incoming", name: name.get(r.id)!, views: cur, previous: prevV, growing, line: days.map((d) => byDay.get(d) ?? 0) };
  });
}

export async function rankedPerformance(p: Period) {
  const rows = await db.$queryRaw<{ k: string | null; views: bigint }[]>`
    SELECT "contentId" AS k, count(*) AS views FROM "PageView"
    WHERE "contentType" = 'ranked' AND "at" >= ${p.from} AND "at" < ${p.to} GROUP BY 1 ORDER BY views DESC`;
  return rows.map((r) => {
    const [view, by] = (r.k ?? "releases:total").split(":");
    return { view: view === "artists" ? "Artists" : "Releases", sortedBy: by === "average" ? "Average" : by.charAt(0).toUpperCase() + by.slice(1), views: n(r.views) };
  });
}
