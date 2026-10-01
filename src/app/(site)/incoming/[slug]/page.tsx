import type { Metadata } from "next";
import { track } from "@/lib/analytics";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Example } from "@/components/blocks";
import { incomingOne } from "@/lib/content";
import { TYPE_LABEL, fmtDate } from "@/lib/format";
import { htmlToText, sanitizeBody, textToHtml } from "@/lib/richText";
import { PressView } from "@/components/PressView";
import { normalizeLinks, normalizeTrivia, stripMarkup } from "@/lib/pressText";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await incomingOne((await params).slug);
  if (!p) return { title: "That page is gone." };
  const title = p.headline || `${p.release.artist} – ${p.release.title}`;
  const plain = p.structured ? (p.rich ? htmlToText(p.spotlight || p.story1 || p.story2 || "") : stripMarkup(p.spotlight || p.story1 || p.story2 || "")) : htmlToText(p.bodyHtml ?? textToHtml(p.body));
  const description = plain.replace(/\s+/g, " ").slice(0, 160) || `Press release from ${p.release.artist}, posted as sent.`;
  return { title, description, alternates: { canonical: `/incoming/${p.slug}` } };
}

export default async function IncomingPage({ params }: Props) {
  const p = await incomingOne((await params).slug);
  if (!p) notFound();
  await track(`/incoming/${p.slug}`, { contentType: "incoming", contentId: p.id });
  const r = p.release;
  if (p.structured) {
    const rich = p.rich;
    const text = (t: string | null) => (rich ? sanitizeBody(t ?? "") : (t ?? ""));
    const links = normalizeLinks(p.links);
    const icons = links.some((l) => l.iconId) ? await db.pressIcon.findMany({ where: { id: { in: links.map((l) => l.iconId).filter(Boolean) } }, select: { id: true } }) : [];
    const have = new Set(icons.map((i) => i.id));
    const photo = (id: string | null, credit: string | null, alt: string | null) => (id ? { src: `/media/${id}`, credit: credit ?? "", alt: alt ?? "" } : null);
    return (
      <section className="sec">
        <p><Link className="back" href="/incoming">Incoming</Link>{p.isExample && <Example />}</p>
        <PressView
          headline={p.headline ?? ""} artist={r.artist} title={r.title} type={r.type} releaseDate={r.releaseDate} label={r.label ?? ""}
          photo1={photo(p.photo1Id, p.photo1Credit, p.photo1Alt)} spotlight={text(p.spotlight)} rich={rich}
          links={links.map((l) => ({ ...l, iconSrc: l.iconId && have.has(l.iconId) ? `/icons/${l.iconId}` : undefined }))}
          story1={text(p.story1)} photo2={photo(p.photo2Id, p.photo2Credit, p.photo2Alt)} story2={text(p.story2)} trivia={normalizeTrivia(p.trivia)}
        />
      </section>
    );
  }
  // Older press releases keep the old layout. Cleaned again on the way out. Old plain-text releases become paragraphs.
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
