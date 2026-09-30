import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export default async function RatedAdmin() {
  const list = await db.review.findMany({ orderBy: { updatedAt: "desc" }, include: { release: true } });
  return (
    <section className="sec">
      <div className="sec-head"><h2>Rated</h2><Link className="btn" href="/admin/rated/new">New review</Link></div>
      {list.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <table className="tbl">
          <thead><tr><th>Release</th><th>Score</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/rated/${r.id}`}>{r.release.artist} {"–"} {r.release.title}</Link>{r.isExample && <span className="tag">Example</span>}</td>
                <td>{r.total ?? (r.replay === null ? "Replay to do" : "–")}</td>
                <td><span className={`pill ${r.status === "PUBLISHED" ? "live" : ""}`}>{r.status.toLowerCase()}</span></td>
                <td className="mono">{fmtDate(r.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
