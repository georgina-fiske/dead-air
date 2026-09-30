import Link from "next/link";
import { db } from "@/lib/db";
import { fmtDate } from "@/lib/format";

export default async function OffAirAdmin() {
  const list = await db.interview.findMany({ orderBy: { updatedAt: "desc" }, include: { _count: { select: { qa: true } } } });
  return (
    <section className="sec">
      <div className="sec-head"><h2>Off Air</h2><Link className="btn" href="/admin/off-air/new">New interview</Link></div>
      {list.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <table className="tbl">
          <thead><tr><th>Interview</th><th>Questions</th><th>Status</th><th>Updated</th></tr></thead>
          <tbody>
            {list.map((i) => (
              <tr key={i.id}>
                <td><Link href={`/admin/off-air/${i.id}`}>{i.artist}{i.subtitle ? ` – ${i.subtitle}` : ""}</Link>{i.isExample && <span className="tag">Example</span>}</td>
                <td>{i._count.qa}</td>
                <td><span className={`pill ${i.status === "PUBLISHED" ? "live" : ""}`}>{i.status.toLowerCase()}</span></td>
                <td className="mono">{fmtDate(i.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
