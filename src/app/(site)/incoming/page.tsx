import type { Metadata } from "next";
import { IncomingRow, Empty, SecHead } from "@/components/blocks";
import { incomingList } from "@/lib/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Incoming", description: "Press releases. Posted as sent." };

export default async function Incoming() {
  const list = await incomingList();
  return (
    <section className="sec">
      <SecHead title="Incoming" />
      <p className="note">Press releases. Posted as sent.</p>
      {list.length ? list.map((p) => <IncomingRow key={p.id} p={p} />) : <Empty />}
    </section>
  );
}
