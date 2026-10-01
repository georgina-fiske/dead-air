import type { CSSProperties } from "react";
import { db } from "@/lib/db";
import { deleteIcon } from "./actions";
import { IconUploader } from "./IconUploader";

export const dynamic = "force-dynamic";

export default async function IconsPage() {
  const icons = await db.pressIcon.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  return (
    <section className="sec">
      <div className="sec-head"><h2>Icons</h2></div>
      <p className="note">Upload each icon once, with a name. Then pick it from the menu on any press release link button.</p>
      <IconUploader />
      {icons.length === 0 ? <div className="empty">Nothing here yet.</div> : (
        <div className="media-grid" style={{ marginTop: 20 }}>
          {icons.map((i) => (
            <figure key={i.id} className="media-item">
              <div style={{ padding: 22, display: "grid", placeItems: "center", background: "var(--soft)" }}>
                <span className="ico" style={{ "--ico": `url(/icons/${i.id})`, width: 48, height: 48 } as CSSProperties} aria-hidden="true" />
              </div>
              <figcaption>
                <b>{i.name}</b>
                <form action={deleteIcon}><input type="hidden" name="id" value={i.id} /><button className="btn ghost" style={{ padding: "2px 8px" }}>Delete</button></form>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
