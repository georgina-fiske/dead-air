import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ReviewCard } from "@/components/ReviewCard";
import { reviewOne, reviewView } from "@/lib/content";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await reviewOne((await params).slug);
  if (!r) return { title: "That page is gone." };
  return {
    title: `${r.release.artist} – ${r.release.title}: ${r.total ?? "?"}/100`,
    description: r.take,
    alternates: { canonical: `/rated/${r.slug}` },
  };
}

export default async function RatedPage({ params }: Props) {
  const r = await reviewOne((await params).slug);
  if (!r) notFound();
  return (
    <section className="sec">
      <p><Link className="back" href="/rated">Rated</Link></p>
      <ReviewCard r={reviewView(r)} link={false} />
    </section>
  );
}
