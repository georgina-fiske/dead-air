import { OG_SIZE, OG_TYPE, defaultCard, ratedCard } from "@/lib/og";
import { reviewOne } from "@/lib/content";
import { CATEGORIES } from "@/lib/rubric";

export const alt = "Dead Air review";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const r = await reviewOne((await params).slug);
  if (!r) return defaultCard();
  const s = { bias: r.bias, craft: r.craft, nerve: r.nerve, crowd: r.crowd, replay: r.replay } as Record<string, number | null>;
  return ratedCard({ artist: r.release.artist, title: r.release.title, take: r.take, total: r.total, scores: CATEGORIES.map((c) => ({ label: c.name, v: s[c.key] })) });
}
