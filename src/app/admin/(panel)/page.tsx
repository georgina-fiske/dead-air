import { db } from "@/lib/db";
import { addExamplesAction, removeExamplesAction } from "./exampleActions";

export default async function Overview() {
  const [incoming, offAir, rated, hotAir, releases, examples, recent] = await Promise.all([
    db.pressRelease.groupBy({ by: ["status"], _count: true }),
    db.interview.groupBy({ by: ["status"], _count: true }),
    db.review.groupBy({ by: ["status"], _count: true }),
    db.opinion.groupBy({ by: ["status"], _count: true }),
    db.release.count(),
    db.release.count({ where: { isExample: true } }),
    db.auditLog.findMany({ orderBy: { at: "desc" }, take: 8 }),
  ]);
  const cards = [
    { name: "Incoming", rows: incoming }, { name: "Off Air", rows: offAir },
    { name: "Rated", rows: rated }, { name: "Hot Air", rows: hotAir },
  ];
  const count = (rows: { status: string; _count: number }[], s: string) => rows.find((r) => r.status === s)?._count ?? 0;
  return (
    <>
      <section className="sec">
        <div className="sec-head"><h2>Overview</h2></div>
        <div className="stats">
          {cards.map((c) => (
            <div className="stat" key={c.name}>
              <div className="stat-n">{count(c.rows, "PUBLISHED")}</div>
              <div className="stat-l">{c.name} live</div>
              <div className="stat-s">{count(c.rows, "DRAFT")} drafts · {count(c.rows, "SCHEDULED")} scheduled</div>
            </div>
          ))}
          <div className="stat">
            <div className="stat-n">{releases}</div>
            <div className="stat-l">Releases</div>
            <div className="stat-s">{examples} example</div>
          </div>
        </div>
      </section>
      <section className="sec">
        <div className="sec-head"><h2>Example content</h2></div>
        <p className="note">Made-up entries so you can see the site working. Tagged Example on the public site. Remove them all before launch.</p>
        <div className="actions">
          <form action={addExamplesAction}><button type="submit" className="btn">Add examples</button></form>
          <form action={removeExamplesAction}><button type="submit" className="btn ghost">Remove all examples</button></form>
        </div>
      </section>
      <section className="sec">
        <div className="sec-head"><h2>Recent activity</h2></div>
        {recent.length === 0 ? <div className="empty">Nothing here yet.</div> : (
          <ul className="log">
            {recent.map((r) => (
              <li key={r.id}><span className="mono">{r.at.toISOString().slice(0, 16).replace("T", " ")}</span> {r.action}</li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
