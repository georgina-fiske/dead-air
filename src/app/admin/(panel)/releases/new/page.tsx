import { db } from "@/lib/db";
import { ReleaseForm } from "../ReleaseForm";

export default async function NewRelease() {
  const media = await db.mediaImage.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, filename: true } });
  return (
    <section className="sec narrow-form">
      <div className="sec-head"><h2>New release</h2></div>
      <ReleaseForm r={{ artist: "", title: "", type: "SINGLE", releaseDate: "", label: "", sourceUrl: "", coverId: "" }} media={media} />
    </section>
  );
}
