import { db } from "@/lib/db";
import { ReviewEditor } from "../ReviewEditor";

export default async function NewReview({ searchParams }: { searchParams: Promise<{ release?: string }> }) {
  const releases = await db.release.findMany({ where: { review: null }, orderBy: { createdAt: "desc" } });
  const pre = (await searchParams).release ?? "";
  return (
    <section className="sec">
      <div className="sec-head"><h2>New review</h2></div>
      <ReviewEditor
        releases={releases.map((r) => ({ id: r.id, artist: r.artist, title: r.title, type: r.type, date: r.releaseDate?.toISOString() ?? null }))}
        init={{ releaseId: releases.some((r) => r.id === pre) ? pre : "", take: "", isFan: false, listenedAt: "", scores: {}, lines: {} }}
      />
    </section>
  );
}
