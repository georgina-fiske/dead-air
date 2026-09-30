import type { Metadata } from "next";
import { track } from "@/lib/analytics";
import { InterviewCard, Empty, SecHead } from "@/components/blocks";
import { interviewList } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Off Air", alternates: { canonical: "/off-air" }, description: "Interviews. Answers published exactly as sent." };

export default async function OffAir() {
  await track("/off-air", { contentType: "offair" });
  const list = await interviewList();
  return (
    <section className="sec">
      <SecHead title="Off Air" />
      <p className="note">Interviews. Answers published exactly as sent.</p>
      {list.length ? <div className="cards">{list.map((i) => <InterviewCard key={i.id} i={i} full={false} />)}</div> : <Empty />}
    </section>
  );
}
