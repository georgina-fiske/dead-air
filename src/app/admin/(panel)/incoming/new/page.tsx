import { db } from "@/lib/db";
import { PressEditor } from "../PressEditor";

export default async function NewPress({ searchParams }: { searchParams: Promise<{ release?: string }> }) {
  const rid = (await searchParams).release;
  const r = rid ? await db.release.findFirst({ where: { id: rid, pressRelease: null } }) : null;
  const [media, icons] = await Promise.all([
    db.mediaImage.findMany({ orderBy: { createdAt: "desc" }, take: 24, select: { id: true, filename: true } }),
    db.pressIcon.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const none = { id: "", credit: "", alt: "" };
  return (
    <section className="sec">
      <div className="sec-head"><h2>New press release</h2></div>
      <PressEditor media={media} icons={icons} init={{
        releaseId: r?.id ?? "", artist: r?.artist ?? "", title: r?.title ?? "", type: r?.type ?? "SINGLE",
        releaseDate: r?.releaseDate?.toISOString().slice(0, 10) ?? "", label: r?.label ?? "", sourceUrl: r?.sourceUrl ?? "", coverId: r?.coverId ?? "",
        receivedFrom: "", receivedAt: "", headline: "", photo1: none, spotlight: "", links: [], story1: "", photo2: none, story2: "", trivia: [],
      }} />
    </section>
  );
}
