import { OG_SIZE, OG_TYPE, defaultCard, textCard } from "@/lib/og";
import { incomingOne } from "@/lib/content";
import { TYPE_LABEL } from "@/lib/format";

export const alt = "Dead Air press release";
export const size = OG_SIZE;
export const contentType = OG_TYPE;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const p = await incomingOne((await params).slug);
  if (!p) return defaultCard();
  const name = `${p.release.artist} – ${p.release.title}`;
  const meta = [TYPE_LABEL[p.release.type], p.release.label].filter(Boolean).join(" · ");
  return textCard({ kicker: "Incoming", title: p.headline || name, sub: p.headline ? `${name} · ${meta}` : meta });
}
