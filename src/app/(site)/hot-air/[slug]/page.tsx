import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OpinionItem } from "@/components/blocks";
import { opinionOne } from "@/lib/content";
import { paras } from "@/lib/format";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const o = await opinionOne((await params).slug);
  if (!o) return { title: "That page is gone." };
  return { title: o.title, description: paras(o.body)[0]?.slice(0, 160), alternates: { canonical: `/hot-air/${o.slug}` } };
}

export default async function OpinionPage({ params }: Props) {
  const o = await opinionOne((await params).slug);
  if (!o) notFound();
  return (
    <section className="sec">
      <p><Link className="back" href="/hot-air">Hot Air</Link></p>
      <OpinionItem o={o} />
    </section>
  );
}
