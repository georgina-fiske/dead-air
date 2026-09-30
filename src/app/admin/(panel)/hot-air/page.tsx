import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";
import { wordCount } from "@/lib/voice";

export default async function HotAirAdmin() {
  const list = await db.opinion.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <section className="sec">
      <div className="sec-head"><h2>Hot Air</h2><Link className="btn" href="/admin/hot-air/new">New piece</Link></div>
      {list.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <table className="tbl">
          <thead><tr><th>Title</th><th>Words</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/hot-air/${o.id}`}>{o.title}</Link>{o.isExample && <span className="tag">Example</span>}</td>
                <td>{wordCount(o.body)}</td>
                <td><span className={`pill ${o.status === "PUBLISHED" ? "live" : ""}`}>{o.status.toLowerCase()}</span></td>
                <td className="mono">{fmtDate(o.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
