import { OG_SIZE, OG_TYPE, defaultCard, textCard } from "@/lib/og";
import { interviewOne } from "@/lib/content";

export const alt = "Dead Air interview";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const i = await interviewOne((await params).slug);
  if (!i) return defaultCard();
  return textCard({ kicker: "Off Air", title: i.artist, sub: i.qa[0]?.question });
}
