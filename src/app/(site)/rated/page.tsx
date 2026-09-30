import type { Metadata } from "next";
import { Empty, SecHead } from "@/components/blocks";
import { ReviewCard } from "@/components/ReviewCard";
import { reviewList, reviewView } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Rated", description: "Every release scored out of 100." };

export default async function Rated() {
  const list = await reviewList();
  return (
    <section className="sec">
      <SecHead title="Rated" />
      <p className="note">Every release scored out of 100.</p>
      {list.length ? <div className="cards">{list.map((r) => <ReviewCard key={r.id} r={reviewView(r)} />)}</div> : <Empty />}
    </section>
  );
}
