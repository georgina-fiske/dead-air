import { track } from "@/lib/analytics";
import { IncomingRow, InterviewCard, OpinionItem, Empty, SecHead, RankRow } from "@/components/blocks";
import { ReviewCard } from "@/components/ReviewCard";
import { incomingList, interviewList, opinionList, reviewList, reviewView, scoredReviews } from "@/lib/content";
import { sortReleases } from "@/lib/ranked";

export const dynamic = "force-dynamic";

export default async function Home() {
  await track("/", { contentType: "home" });
  const [rated, incoming, interviews, opinions, scored] = await Promise.all([
    reviewList(2), incomingList(6), interviewList(1), opinionList(2), scoredReviews(),
  ]);
  const top = sortReleases(scored).slice(0, 5);
  return (
    <>
      <section className="sec">
        <SecHead title="Rated" href="/rated" />
        {rated.length ? <div className="cards">{rated.map((r) => <ReviewCard key={r.id} r={reviewView(r)} />)}</div> : <Empty />}
      </section>
      <div className="split">
        <section className="sec">
          <SecHead title="Incoming" href="/incoming" />
          {incoming.length ? incoming.map((p) => <IncomingRow key={p.id} p={p} />) : <Empty />}
        </section>
        <section className="sec">
          <SecHead title="Ranked" href="/ranked" />
          {top.length ? top.map((r, i) => <RankRow key={r.slug} n={i + 1} name={`${r.artist} – ${r.title}`} score={r.total} />) : <Empty />}
        </section>
      </div>
      <section className="sec">
        <SecHead title="Off Air" href="/off-air" />
        {interviews.length ? interviews.map((i) => <InterviewCard key={i.id} i={i} full={false} />) : <Empty />}
      </section>
      <section className="sec">
        <SecHead title="Hot Air" href="/hot-air" />
        {opinions.length ? opinions.map((o) => <OpinionItem key={o.id} o={o} full={false} />) : <Empty />}
      </section>
    </>
  );
}
