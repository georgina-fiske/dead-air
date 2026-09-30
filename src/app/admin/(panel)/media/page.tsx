import { db } from "@/lib/db";
import { Uploader } from "@/components/Uploader";
import { deleteMedia } from "./actions";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const list = await db.mediaImage.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, filename: true, width: true, height: true, bytes: true, releases: { select: { artist: true, title: true } } },
  });
  return (
    <section className="sec">
      <div className="sec-head"><h2>Media</h2></div>
      <p className="note">Images are resized on upload: longest side 1400px, WebP. Pick them as cover art on a release.</p>
      <Uploader />
      {list.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <div className="media-grid">
          {list.map((m) => (
            <figure key={m.id} className="media-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/media/${m.id}`} alt={m.filename} loading="lazy" />
              <figcaption>
                <b>{m.filename}</b>
                <span className="mono">{m.width}×{m.height} · {Math.round(m.bytes / 1024)} KB</span>
                <span className="mono">{m.releases.length ? `Used by ${m.releases.map((r) => `${r.artist} – ${r.title}`).join(", ")}` : "Not used"}</span>
                <form action={deleteMedia}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="btn ghost" style={{ padding: "2px 8px" }}>Delete</button>
                </form>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
