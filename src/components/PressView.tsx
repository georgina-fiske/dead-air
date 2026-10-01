import type { CSSProperties } from "react";
import { parseBlocks, type Inline, type LinkButton, type TriviaItem } from "@/lib/pressText";
import { TYPE_LABEL, fmtDate } from "@/lib/format";
import { Trivia } from "@/components/Trivia";

export type PressPhoto = { src: string; credit: string; alt: string };
export type PressData = {
  headline: string; artist: string; title: string; type: string; releaseDate: Date | string | null; label: string;
  photo1: PressPhoto | null; spotlight: string;
  links: (LinkButton & { iconSrc?: string })[];
  story1: string; photo2: PressPhoto | null; story2: string; trivia: TriviaItem[];
};

function Lines({ lines }: { lines: Inline[][] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={i}>
          {i > 0 && <br />}
          {line.map((x, j) => x.link
            ? <a key={j} href={x.url} target="_blank" rel="noopener noreferrer nofollow">{x.text}</a>
            : <span key={j}>{x.text}</span>)}
        </span>
      ))}
    </>
  );
}

// Text from the editor. Blank line = new paragraph. Subheadings and centred paragraphs are allowed.
export function Rich({ text, className }: { text: string; className?: string }) {
  const blocks = parseBlocks(text);
  if (blocks.length === 0) return null;
  return (
    <div className={className}>
      {blocks.map((b, i) => b.kind === "h"
        ? <h2 key={i} className={`press-sub${b.centre ? " ctr" : ""}`}><Lines lines={b.lines} /></h2>
        : <p key={i} className={b.centre ? "ctr" : undefined}><Lines lines={b.lines} /></p>)}
    </div>
  );
}

function Photo({ p, fallbackAlt, first }: { p: PressPhoto; fallbackAlt: string; first?: boolean }) {
  const credit = p.credit.trim();
  return (
    <figure className="pfig">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.src} alt={p.alt.trim() || fallbackAlt} loading={first ? "eager" : "lazy"} />
      {credit && <figcaption className="pcredit">{/^photo\b/i.test(credit) ? credit : `Photo: ${credit}`}</figcaption>}
    </figure>
  );
}

// The press release page. Used by the public page and by the live preview in the admin.
export function PressView(d: PressData) {
  const name = `${d.artist || "Artist"} – ${d.title || "Title"}`;
  const details: [string, string][] = [
    ["Artist", d.artist], ["Release", d.title], ["Type", TYPE_LABEL[d.type] ?? ""], ["Out", fmtDate(d.releaseDate)], ["Label", d.label],
  ].filter((x): x is [string, string] => !!x[1]);
  const buttons = d.links.filter((l) => l.label && /^https?:\/\//i.test(l.url));
  return (
    <article className="press">
      <h1 className="headline">{d.headline.trim() || name}</h1>
      {d.photo1 && <Photo p={d.photo1} fallbackAlt={name} first />}
      <Rich text={d.spotlight} className="press-spot" />
      {buttons.length > 0 && (
        <nav aria-label="Links for this release">
          <ul className="linkrow">
            {buttons.map((l, i) => (
              <li key={i}>
                <a className="linkbtn" href={l.url} target="_blank" rel="noopener noreferrer nofollow">
                  {l.iconSrc && <span className="ico" aria-hidden="true" style={{ "--ico": `url(${l.iconSrc})` } as CSSProperties} />}
                  <span>{l.label}</span>
                  <span className="sr">, opens in a new tab</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <Rich text={d.story1} className="press-story" />
      {d.photo2 && <Photo p={d.photo2} fallbackAlt={name} />}
      {details.length > 0 && (
        <dl className="pdetails" aria-label="Record details">
          {details.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
        </dl>
      )}
      <Rich text={d.story2} className="press-story" />
      <Trivia items={d.trivia} />
    </article>
  );
}
