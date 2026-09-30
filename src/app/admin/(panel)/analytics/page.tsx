import Link from "next/link";
import { BarChart, Spark } from "@/components/charts";
import * as q from "@/lib/analyticsQueries";
import type { Gran } from "@/lib/analyticsQueries";

export const dynamic = "force-dynamic";
type SP = { range?: string; from?: string; to?: string; gran?: string };

function delta(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? "new" : "–";
  const p = Math.round(((cur - prev) / prev) * 100);
  return `${p > 0 ? "+" : ""}${p}%`;
}

function Kpi({ label, value, prev, hint }: { label: string; value: number; prev: number; hint?: string }) {
  return (
    <div className="stat">
      <div className="stat-n">{value.toLocaleString("en-AU")}</div>
      <div className="stat-l">{label}</div>
      <div className="stat-s">{delta(value, prev)} vs previous{hint ? ` · ${hint}` : ""}</div>
    </div>
  );
}

function BarTable({ title, rows, table, qs, cols }: { title: string; rows: { label: string; value: number; extra?: string }[]; table: string; qs: string; cols?: [string, string] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="sec">
      <div className="sec-head"><h2>{title}</h2><a className="mono" href={`/admin/analytics/export?table=${table}&${qs}`}>CSV</a></div>
      {rows.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <table className="tbl bt">
          <thead><tr><th>{cols?.[0] ?? "Name"}</th><th></th><th style={{ textAlign: "right" }}>{cols?.[1] ?? "Views"}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="bt-l">{r.label}</td>
                <td className="bt-b"><i style={{ width: `${(r.value / max) * 100}%` }} /></td>
                <td style={{ textAlign: "right" }}>{r.value.toLocaleString("en-AU")}{r.extra && <span className="mono"> {r.extra}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function Analytics({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const range = q.parseRange(sp);
  const cur = range.current, prev = range.previous;
  const gran: Gran = sp.gran === "week" || sp.gran === "month" ? sp.gran : "day";
  const qs = range.preset === "custom" ? `from=${cur.fromDate}&to=${cur.toDate}` : `range=${range.preset}`;

  const [t, tp, s, sPrev, pages, sections, refs, where, dev, content, ranked] = await Promise.all([
    q.totals(cur), q.totals(prev), q.series(cur, gran), q.series(prev, gran),
    q.topPages(cur), q.bySection(cur), q.referrers(cur), q.places(cur), q.devices(cur), q.contentViews(cur, prev), q.rankedPerformance(cur),
  ]);
  const presets = [["7", "7 days"], ["30", "30 days"], ["90", "90 days"], ["365", "12 months"]];

  return (
    <>
      <section className="sec">
        <div className="sec-head"><h2>Analytics</h2></div>
        <p className="note">No cookies. No IP addresses kept. Bots, Do Not Track and your own visits are left out. Days are Sydney days.</p>
        <div className="rangebar">
          <div className="controls">
            {presets.map(([v, l]) => <Link key={v} href={`/admin/analytics?range=${v}&gran=${gran}`} aria-current={range.preset === v}>{l}</Link>)}
          </div>
          <form method="get" className="customrange">
            <input type="hidden" name="gran" value={gran} />
            <label>From <input type="date" name="from" defaultValue={cur.fromDate} /></label>
            <label>To <input type="date" name="to" defaultValue={cur.toDate} /></label>
            <button className="btn ghost" type="submit">Apply</button>
          </form>
        </div>
        <p className="mono">{cur.label} compared with {prev.label}</p>

        <div className="stats">
          <Kpi label="Page views" value={t.views} prev={tp.views} />
          <Kpi label="Visitors" value={t.visitors} prev={tp.visitors} hint="unique per day" />
          <Kpi label="New visitors" value={t.fresh} prev={tp.fresh} hint="first seen this week" />
          <Kpi label="Returning" value={t.returning} prev={tp.returning} hint="seen on an earlier day" />
        </div>
      </section>

      <section className="sec">
        <div className="sec-head">
          <h2>Views over time</h2>
          <span className="controls" style={{ margin: 0 }}>
            {(["day", "week", "month"] as const).map((g) => <Link key={g} href={`/admin/analytics?${qs}&gran=${g}`} aria-current={gran === g}>{g}</Link>)}
          </span>
        </div>
        <BarChart label={`Page views per ${gran}, ${cur.label}`} data={s.map((d) => ({ date: d.date, views: d.views }))} previous={gran === "day" ? sPrev.map((d) => d.views) : null} />
        <details>
          <summary className="mono">Table view</summary>
          <table className="tbl"><thead><tr><th>{gran}</th><th>Views</th><th>Visitors</th></tr></thead>
            <tbody>{s.map((d) => <tr key={d.date}><td>{d.date}</td><td>{d.views}</td><td>{d.visitors}</td></tr>)}</tbody></table>
        </details>
        <p className="mono"><a href={`/admin/analytics/export?table=series&${qs}&gran=${gran}`}>CSV</a></p>
      </section>

      <div className="split2">
        <BarTable title="Top pages" table="pages" qs={qs} cols={["Page", "Views"]} rows={pages.map((p) => ({ label: p.path, value: p.views, extra: `(${p.visitors} visitor${p.visitors === 1 ? "" : "s"})` }))} />
        <BarTable title="Sections" table="sections" qs={qs} cols={["Section", "Views"]} rows={sections.map((x) => ({ label: x.section, value: x.views }))} />
        <BarTable title="Where they came from" table="referrers" qs={qs} cols={["Source", "Views"]} rows={refs.map((x) => ({ label: x.source, value: x.views }))} />
        <BarTable title="Devices" table="devices" qs={qs} cols={["Device", "Views"]} rows={dev.map((x) => ({ label: x.device, value: x.views }))} />
        <BarTable title="Countries" table="countries" qs={qs} cols={["Country", "Views"]} rows={where.countries.map((x) => ({ label: x.country, value: x.views }))} />
        <BarTable title="Australian states" table="states" qs={qs} cols={["State", "Views"]} rows={where.states.map((x) => ({ label: x.state, value: x.views }))} />
      </div>

      <section className="sec">
        <div className="sec-head"><h2>Content</h2><a className="mono" href={`/admin/analytics/export?table=content&${qs}`}>CSV</a></div>
        <p className="note">Views per release and review. Growing means 5 or more views and up at least 50% on the previous period.</p>
        {content.length === 0 ? <div className="empty">Nothing here yet.</div> : (
          <table className="tbl">
            <thead><tr><th>Release</th><th>Section</th><th>Trend</th><th style={{ textAlign: "right" }}>Views</th><th style={{ textAlign: "right" }}>Change</th></tr></thead>
            <tbody>
              {content.map((c, i) => (
                <tr key={i}>
                  <td>{c.name} {c.growing && <span className="pill live">Growing</span>}</td>
                  <td className="mono">{c.section}</td>
                  <td><Spark values={c.line} /></td>
                  <td style={{ textAlign: "right" }}>{c.views}</td>
                  <td style={{ textAlign: "right" }} className="mono">{delta(c.views, c.previous)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <BarTable title="Ranked page" table="ranked" qs={qs} cols={["View and sort", "Views"]} rows={ranked.map((r) => ({ label: `${r.view}, by ${r.sortedBy}`, value: r.views }))} />
      <p className="mono">Search terms: not available. Google no longer tells sites what people searched.</p>
    </>
  );
}
