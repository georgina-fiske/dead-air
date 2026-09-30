import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ReviewEditor } from "../ReviewEditor";

export default async function EditReview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const r = await db.review.findUnique({ where: { id }, include: { release: true } });
  if (!r) notFound();
  const opt = { id: r.release.id, artist: r.release.artist, title: r.release.title, type: r.release.type, date: r.release.releaseDate?.toISOString() ?? null };
  const s = (n: number | null) => (n === null ? "" : String(n));
  return (
    <section className="sec">
      <div className="sec-head"><h2>Edit review</h2></div>
      {(await searchParams).saved && <p className="saved">Saved.</p>}
      <ReviewEditor
        releases={[opt]}
        init={{
          id: r.id, status: r.status, releaseId: r.releaseId, take: r.take, isFan: r.isFan,
          listenedAt: r.listenedAt?.toISOString().slice(0, 10) ?? "",
          scores: { bias: s(r.bias), craft: s(r.craft), nerve: s(r.nerve), crowd: s(r.crowd), replay: s(r.replay) },
          lines: { bias: r.biasLine, craft: r.craftLine, nerve: r.nerveLine, crowd: r.crowdLine, replay: r.replayLine },
        }}
      />
    </section>
  );
}
