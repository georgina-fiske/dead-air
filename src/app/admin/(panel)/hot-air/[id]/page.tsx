import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { OpinionEditor } from "../OpinionEditor";
import { textToHtml } from "@/lib/richText";

export default async function EditOpinion({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const o = await db.opinion.findUnique({ where: { id } });
  if (!o) notFound();
  return (
    <section className="sec">
      <div className="sec-head"><h2>Edit piece</h2></div>
      {(await searchParams).saved && <p className="saved">Saved.</p>}
      <OpinionEditor init={{ id: o.id, status: o.status, title: o.title, bodyHtml: o.bodyHtml ?? textToHtml(o.body) }} />
    </section>
  );
}
