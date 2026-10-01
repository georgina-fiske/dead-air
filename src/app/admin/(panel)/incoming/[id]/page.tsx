import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PressEditor } from "../PressEditor";
import { textToHtml } from "@/lib/richText";

export default async function EditPress({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; copied?: string; failed?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await db.pressRelease.findUnique({ where: { id }, include: { release: true } });
  if (!p) notFound();
  const media = await db.mediaImage.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, filename: true } });
  const r = p.release;
  return (
    <section className="sec">
      <div className="sec-head"><h2>Edit press release</h2></div>
      {sp.saved && <p className="saved">Saved.{Number(sp.copied) > 0 && ` ${sp.copied} picture${sp.copied === "1" ? "" : "s"} copied into Media.`}{Number(sp.failed) > 0 && ` ${sp.failed} could not be copied and still point at the original site.`}</p>}
      <PressEditor init={{
        id: p.id, status: p.status, releaseId: r.id, artist: r.artist, title: r.title, type: r.type,
        releaseDate: r.releaseDate?.toISOString().slice(0, 10) ?? "", label: r.label ?? "", sourceUrl: r.sourceUrl ?? "", coverId: r.coverId ?? "",
        headline: p.headline ?? "", bodyHtml: p.bodyHtml ?? textToHtml(p.body), receivedFrom: p.receivedFrom ?? "", receivedAt: p.receivedAt?.toISOString().slice(0, 10) ?? "",
      }} media={media} />
    </section>
  );
}
