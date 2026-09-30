import type { Metadata } from "next";
import { track } from "@/lib/analytics";
import { OpinionItem, Empty, SecHead } from "@/components/blocks";
import { opinionList } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Hot Air", description: "Opinion." };

export default async function HotAir() {
  await track("/hot-air", { contentType: "hotair" });
  const list = await opinionList();
  return (
    <section className="sec">
      <SecHead title="Hot Air" />
      <p className="note">Opinion.</p>
      {list.length ? list.map((o) => <OpinionItem key={o.id} o={o} full={false} />) : <Empty />}
    </section>
  );
}
