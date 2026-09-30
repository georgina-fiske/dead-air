import Link from "next/link";
import { TYPE_LABEL, fmtDate, paras } from "@/lib/format";

export const Example = () => <span className="tag">Example</span>;
export const Empty = ({ children = "Nothing here yet." }: { children?: React.ReactNode }) => <div className="empty">{children}</div>;

export function SecHead({ title, href }: { title: string; href?: string }) {
  return (
    <div className="sec-head">
      <h2>{title}</h2>
      {href && <Link href={href} aria-label={`All ${title}`}>All</Link>}
    </div>
  );
}

type PR = { slug: string; isExample: boolean; publishedAt: Date | null; release: { artist: string; title: string; type: string; label: string | null; releaseDate: Date | null } };
export function IncomingRow({ p }: { p: PR }) {
  return (
    <Link href={`/incoming/${p.slug}`} className="rowmain">
      <span className="date">{fmtDate(p.release.releaseDate ?? p.publishedAt)}</span>
      <span className="who">{p.release.artist} <span>{"–"} {p.release.title}</span>{p.isExample && <Example />}</span>
      <span className="meta">{[TYPE_LABEL[p.release.type], p.release.label].filter(Boolean).join(" · ")}</span>
    </Link>
  );
}

type IV = { slug: string; artist: string; subtitle: string | null; date: Date | null; isExample: boolean; qa: { id: string; question: string; answer: string }[] };
export function InterviewCard({ i, full = true }: { i: IV; full?: boolean }) {
  return (
    <article className="card oa">
      <h3 className="ct"><Link href={`/off-air/${i.slug}`}>{i.artist}</Link>{i.isExample && <Example />}</h3>
      <p className="sub">{[i.subtitle, fmtDate(i.date)].filter(Boolean).join(" · ")}</p>
      {(full ? i.qa : i.qa.slice(0, 1)).map((x) => (
        <div className="qa" key={x.id}>
          <p className="q">{x.question}</p>
          <p className="a">{x.answer}</p>
        </div>
      ))}
    </article>
  );
}

type OP = { slug: string; title: string; body: string; publishedAt: Date | null; isExample: boolean };
export function OpinionItem({ o, full = true }: { o: OP; full?: boolean }) {
  const ps = paras(o.body);
  return (
    <article className="ha">
      <h3 className="ct"><Link href={`/hot-air/${o.slug}`}>{o.title}</Link>{o.isExample && <Example />}</h3>
      <p className="sub">{fmtDate(o.publishedAt)}</p>
      {(full ? ps : ps.slice(0, 1)).map((p, i) => <p key={i}>{p}</p>)}
    </article>
  );
}

export function RankRow({ n, name, sub, score }: { n: number; name: string; sub?: string; score: number | string }) {
  return (
    <div className="rank">
      <div className="n">{n}</div>
      <div className="who">{name}{sub && <small>{sub}</small>}</div>
      <div className="s">{score}</div>
    </div>
  );
}
