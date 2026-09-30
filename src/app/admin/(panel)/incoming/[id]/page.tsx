import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PressEditor } from "../PressEditor";

export default async function EditPress({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const p = await db.pressRelease.findUnique({ where: { id }, include: { release: true } });
  if (!p) notFound();
  const r = p.release;
  return (
    <section className="sec">
      <div className="sec-head"><h2>Edit press release</h2></div>
      {(await searchParams).saved && <p className="saved">Saved.</p>}
      <PressEditor init={{
        id: p.id, status: p.status, releaseId: r.id, artist: r.artist, title: r.title, type: r.type,
        releaseDate: r.releaseDate?.toISOString().slice(0, 10) ?? "", label: r.label ?? "", sourceUrl: r.sourceUrl ?? "",
        body: p.body, receivedFrom: p.receivedFrom ?? "", receivedAt: p.receivedAt?.toISOString().slice(0, 10) ?? "",
      }} />
    </section>
  );
}
