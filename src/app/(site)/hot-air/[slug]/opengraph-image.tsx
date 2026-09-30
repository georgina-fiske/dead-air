import { OG_SIZE, OG_TYPE, defaultCard, textCard } from "@/lib/og";
import { opinionOne } from "@/lib/content";

export const alt = "Dead Air opinion";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const o = await opinionOne((await params).slug);
  if (!o) return defaultCard();
  return textCard({ kicker: "Hot Air", title: o.title, big: true });
}
