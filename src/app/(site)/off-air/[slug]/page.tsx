import type { Metadata } from "next";
import { track } from "@/lib/analytics";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InterviewCard } from "@/components/blocks";
import { interviewOne } from "@/lib/content";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const i = await interviewOne((await params).slug);
  if (!i) return { title: "That page is gone." };
  return { title: `${i.artist} interview`, description: i.qa[0]?.question.slice(0, 160), alternates: { canonical: `/off-air/${i.slug}` } };
}

export default async function InterviewPage({ params }: Props) {
  const i = await interviewOne((await params).slug);
  if (!i) notFound();
  await track(`/off-air/${i.slug}`, { contentType: "offair", contentId: i.id });
  return (
    <section className="sec">
      <p><Link className="back" href="/off-air">Off Air</Link></p>
      <InterviewCard i={i} />
      <p className="note" style={{ marginTop: 16 }}>Answers published exactly as sent. Typos and all.</p>
    </section>
  );
}
