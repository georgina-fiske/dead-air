import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export default async function IncomingAdmin() {
  const list = await db.pressRelease.findMany({ orderBy: { updatedAt: "desc" }, include: { release: true } });
  return (
    <section className="sec">
      <div className="sec-head"><h2>Incoming</h2><Link className="btn" href="/admin/incoming/new">New press release</Link></div>
      {list.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <table className="tbl">
          <thead><tr><th>Release</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td><Link href={`/admin/incoming/${p.id}`}>{p.release.artist} {"–"} {p.release.title}</Link>{p.isExample && <span className="tag">Example</span>}</td>
                <td><span className={`pill ${p.status === "PUBLISHED" ? "live" : ""}`}>{p.status.toLowerCase()}</span></td>
                <td className="mono">{fmtDate(p.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
