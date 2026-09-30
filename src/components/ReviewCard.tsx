import Link from "next/link";
import { CATEGORIES } from "@/lib/rubric";
import { TYPE_LABEL, fmtDate } from "@/lib/format";

export type ReviewView = {
  slug?: string;
  artist: string; title: string; type: string; date?: Date | string | null;
  take: string; isFan?: boolean; isExample?: boolean;
  scores: Record<string, number | null | undefined>;
  lines: Record<string, string | undefined>;
  total: number | null; cover?: string | null;
};

export function ReviewCard({ r, link = true, compact = false }: { r: ReviewView; link?: boolean; compact?: boolean }) {
  const total = r.total;
  const heading = `${r.artist || "Artist"} – ${r.title || "Title"}`;
  return (
    <article className={`card rated${compact ? " compact" : ""}`}>
      <div className="score">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {r.cover && <img className="cover" src={r.cover} alt={`${r.artist} \u2013 ${r.title} cover`} />}
        <div className="num">{total ?? "–"}</div>
        <div className="of">out of 100</div>
        <div className="bar"><i style={{ width: `${Math.max(0, Math.min(100, total ?? 0))}%` }} /></div>
      </div>
      <div>
        <h3 className="ct">
          {link && r.slug ? <Link href={`/rated/${r.slug}`}>{heading}</Link> : heading}
          {r.isExample && <span className="tag">Example</span>}
        </h3>
        <p className="sub">{[TYPE_LABEL[r.type] ?? r.type, fmtDate(r.date)].filter(Boolean).join(" · ")}</p>
        {r.take && <p className="take">{r.take}</p>}
        {CATEGORIES.map((c) => (
          <div className="line" key={c.key}>
            <div className="lab">{c.name}<b>{r.scores[c.key] ?? "–"}/{c.max}</b></div>
            <p>{r.lines[c.key]}</p>
          </div>
        ))}
        {r.isFan && <p className="fan">Fan of the artist. Read it with that in mind.</p>}
      </div>
    </article>
  );
}
