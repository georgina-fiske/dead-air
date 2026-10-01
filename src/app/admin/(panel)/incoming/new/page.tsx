import { db } from "@/lib/db";
import { PressEditor } from "../PressEditor";

export default async function NewPress({ searchParams }: { searchParams: Promise<{ release?: string }> }) {
  const rid = (await searchParams).release;
  const r = rid ? await db.release.findFirst({ where: { id: rid, pressRelease: null } }) : null;
  const media = await db.mediaImage.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, filename: true } });
  return (
    <section className="sec">
      <div className="sec-head"><h2>New press release</h2></div>
      <PressEditor init={{
        releaseId: r?.id ?? "", artist: r?.artist ?? "", title: r?.title ?? "", type: r?.type ?? "SINGLE",
        releaseDate: r?.releaseDate?.toISOString().slice(0, 10) ?? "", label: r?.label ?? "", sourceUrl: r?.sourceUrl ?? "", coverId: r?.coverId ?? "",
        headline: "", bodyHtml: "", receivedFrom: "", receivedAt: "",
      }} media={media} />
    </section>
  );
}
