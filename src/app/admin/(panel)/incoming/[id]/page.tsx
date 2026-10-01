import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PressEditor } from "../PressEditor";
import type { DidNote } from "../WhatIDid";
import { markupToHtml } from "@/lib/pressText";
import { textToHtml } from "@/lib/richText";

export default async function EditPress({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const p = await db.pressRelease.findUnique({ where: { id }, include: { release: true } });
  if (!p) notFound();
  const [media, icons] = await Promise.all([
    db.mediaImage.findMany({ orderBy: { createdAt: "desc" }, take: 24, select: { id: true, filename: true } }),
    db.pressIcon.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const r = p.release;
  const rawLinks = Array.isArray(p.links) ? (p.links as { label?: string; url?: string; iconId?: string }[]) : [];
  const rawTrivia = Array.isArray(p.trivia) ? (p.trivia as { question?: string; answer?: string }[]) : [];
  return (
    <section className="sec">
      <div className="sec-head"><h2>Edit press release</h2></div>
      {sp.saved && <p className="saved">Saved.</p>}
      <PressEditor media={media} icons={icons} notes={Array.isArray(p.placementNotes) ? (p.placementNotes as DidNote[]) : null} init={{
        id: p.id, status: p.status, releaseId: r.id, artist: r.artist, title: r.title, type: r.type,
        releaseDate: r.releaseDate?.toISOString().slice(0, 10) ?? "", label: r.label ?? "", sourceUrl: r.sourceUrl ?? "", coverId: r.coverId ?? "",
        receivedFrom: p.receivedFrom ?? "", receivedAt: p.receivedAt?.toISOString().slice(0, 10) ?? "",
        headline: p.headline ?? "", legacy: !p.structured,
        photo1: { id: p.photo1Id ?? "", credit: p.photo1Credit ?? "", alt: p.photo1Alt ?? "" },
        spotlight: p.rich ? (p.spotlight ?? "") : markupToHtml(p.spotlight ?? ""),
        links: rawLinks.map((l) => ({ label: l.label ?? "", url: l.url ?? "", iconId: l.iconId ?? "" })),
        story1: p.rich ? (p.story1 ?? "") : p.structured ? markupToHtml(p.story1 ?? "") : (p.bodyHtml ?? textToHtml(p.body)),
        photo2: { id: p.photo2Id ?? "", credit: p.photo2Credit ?? "", alt: p.photo2Alt ?? "" },
        story2: p.rich ? (p.story2 ?? "") : markupToHtml(p.story2 ?? ""),
        trivia: rawTrivia.map((t) => ({ question: t.question ?? "", answer: t.answer ?? "" })).slice(0, 3),
      }} />
    </section>
  );
}
