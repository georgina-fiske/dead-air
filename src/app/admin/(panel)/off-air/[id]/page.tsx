import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { InterviewEditor } from "../InterviewEditor";
import { textToHtml } from "@/lib/richText";

export default async function EditInterview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const i = await db.interview.findUnique({ where: { id }, include: { qa: { orderBy: { position: "asc" } } } });
  if (!i) notFound();
  return (
    <section className="sec">
      <div className="sec-head"><h2>Edit interview</h2></div>
      {(await searchParams).saved && <p className="saved">Saved.</p>}
      <InterviewEditor init={{
        id: i.id, status: i.status, artist: i.artist, subtitle: i.subtitle ?? "", date: i.date?.toISOString().slice(0, 10) ?? "",
        qa: i.qa.map((x) => ({ question: x.question, answerHtml: x.answerHtml ?? textToHtml(x.answer) })),
      }} />
    </section>
  );
}
