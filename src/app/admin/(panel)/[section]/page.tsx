import { notFound } from "next/navigation";

const TITLES: Record<string, string> = {
  rated: "Rated", incoming: "Incoming", "off-air": "Off Air", "hot-air": "Hot Air",
  releases: "Releases", media: "Media", analytics: "Analytics",
};

export default async function Placeholder({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = TITLES[section];
  if (!title) notFound();
  return (
    <section className="sec">
      <div className="sec-head"><h2>{title}</h2></div>
      <div className="empty">Not built yet.</div>
    </section>
  );
}
