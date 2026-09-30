import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ReleaseForm } from "../ReleaseForm";

export default async function EditRelease({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const r = await db.release.findUnique({ where: { id }, include: { review: true, pressRelease: true } });
  if (!r) notFound();
  const media = await db.mediaImage.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, filename: true } });
  return (
    <section className="sec narrow-form">
      <div className="sec-head"><h2>{r.artist}</h2></div>
      {(await searchParams).saved && <p className="saved">Saved.</p>}
      <p className="mono">
        {r.pressRelease ? <Link href={`/admin/incoming/${r.pressRelease.id}`}>Press release</Link> : <Link href={`/admin/incoming/new?release=${r.id}`}>Add press release</Link>}
        {" · "}
        {r.review ? <Link href={`/admin/rated/${r.review.id}`}>Review</Link> : <Link href={`/admin/rated/new?release=${r.id}`}>Add review</Link>}
      </p>
      <ReleaseForm r={{ id: r.id, artist: r.artist, title: r.title, type: r.type, releaseDate: r.releaseDate?.toISOString().slice(0, 10) ?? "", label: r.label ?? "", sourceUrl: r.sourceUrl ?? "", coverId: r.coverId ?? "" }} media={media} />
    </section>
  );
}
