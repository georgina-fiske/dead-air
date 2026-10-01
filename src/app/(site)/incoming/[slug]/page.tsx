import type { Metadata } from "next";
import { track } from "@/lib/analytics";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Example } from "@/components/blocks";
import { incomingOne } from "@/lib/content";
import { TYPE_LABEL, fmtDate } from "@/lib/format";
import { htmlToText, sanitizeBody, textToHtml } from "@/lib/richText";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await incomingOne((await params).slug);
  if (!p) return { title: "That page is gone." };
  const title = p.headline || `${p.release.artist} – ${p.release.title}`;
  const description = htmlToText(p.bodyHtml ?? textToHtml(p.body)).replace(/\s+/g, " ").slice(0, 160) || `Press release from ${p.release.artist}, posted as sent.`;
  return { title, description, alternates: { canonical: `/incoming/${p.slug}` } };
}

export default async function IncomingPage({ params }: Props) {
  const p = await incomingOne((await params).slug);
  if (!p) notFound();
  await track(`/incoming/${p.slug}`, { contentType: "incoming", contentId: p.id });
  const r = p.release;
  // Cleaned again on the way out. Old plain-text releases become paragraphs.
  const html = sanitizeBody(p.bodyHtml ?? textToHtml(p.body));
  const original = r.sourceUrl && /^https?:\/\//i.test(r.sourceUrl) ? r.sourceUrl : null;
  return (
    <section className="sec">
      <p><Link className="back" href="/incoming">Incoming</Link></p>
      <p className="kicker">{[`${r.artist} \u2013 ${r.title}`, TYPE_LABEL[r.type], r.label, fmtDate(r.releaseDate)].filter(Boolean).join(" \u00b7 ")}{p.isExample && <Example />}</p>
      <h1 className="headline">{p.headline || `${r.artist} \u2013 ${r.title}`}</h1>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {r.coverId && <img className="cover" style={{ maxWidth: 320 }} src={`/media/${r.coverId}`} alt={`${r.artist} \u2013 ${r.title} cover`} />}
      <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      <p className="note" style={{ marginTop: 24 }}>
        Posted as sent. Nothing changed.
        {original && <> <a href={original} target="_blank" rel="noopener noreferrer nofollow">Original press release</a></>}
      </p>
    </section>
  );
}
