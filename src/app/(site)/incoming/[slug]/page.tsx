import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Example } from "@/components/blocks";
import { incomingOne } from "@/lib/content";
import { TYPE_LABEL, fmtDate } from "@/lib/format";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await incomingOne((await params).slug);
  if (!p) return { title: "That page is gone." };
  const title = `${p.release.artist} – ${p.release.title}`;
  return { title, description: `Press release from ${p.release.artist}, posted as sent.`, alternates: { canonical: `/incoming/${p.slug}` } };
}

export default async function IncomingPage({ params }: Props) {
  const p = await incomingOne((await params).slug);
  if (!p) notFound();
  const r = p.release;
  return (
    <section className="sec">
      <p><Link className="back" href="/incoming">Incoming</Link></p>
      <h1 className="h1">{r.artist} {"–"} {r.title}{p.isExample && <Example />}</h1>
      <p className="sub">{[TYPE_LABEL[r.type], r.label, fmtDate(r.releaseDate)].filter(Boolean).join(" · ")}</p>
      <div className="release-body">{p.body}</div>
      <p className="note" style={{ marginTop: 24 }}>Posted as sent. Nothing changed.</p>
    </section>
  );
}
