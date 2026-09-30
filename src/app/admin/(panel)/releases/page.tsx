import Link from "next/link";
import { db } from "@/lib/db";
import { TYPE_LABEL, fmtDate } from "@/lib/format";

export default async function Releases() {
  const list = await db.release.findMany({ orderBy: { createdAt: "desc" }, include: { review: { select: { status: true } }, pressRelease: { select: { status: true } } } });
  return (
    <section className="sec">
      <div className="sec-head"><h2>Releases</h2><Link className="btn" href="/admin/releases/new">New release</Link></div>
      {list.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <table className="tbl">
          <thead><tr><th>Artist</th><th>Title</th><th>Type</th><th>Date</th><th>Incoming</th><th>Rated</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td><Link href={`/admin/releases/${r.id}`}>{r.artist}</Link>{r.isExample && <span className="tag">Example</span>}</td>
                <td>{r.title}</td><td>{TYPE_LABEL[r.type]}</td><td>{fmtDate(r.releaseDate)}</td>
                <td>{r.pressRelease ? r.pressRelease.status.toLowerCase() : ""}</td>
                <td>{r.review ? r.review.status.toLowerCase() : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
