"use client";
import { useActionState, useState } from "react";
import { Field, StatusBar } from "@/components/admin";
import { CoverPicker, type MediaOpt } from "@/components/CoverPicker";
import { RichEditor } from "@/components/RichEditor";
import { PhotoField, type PhotoState } from "@/components/PhotoField";
import { PressView } from "@/components/PressView";
import { normalizeLinks, normalizeTrivia, safeUrl, type TriviaItem } from "@/lib/pressText";
import { savePress } from "./actions";

type Row = { key: number; label: string; url: string; iconId: string };
export type IconOpt = { id: string; name: string };
export type PressInit = {
  id?: string; status?: string; releaseId: string; artist: string; title: string; type: string; releaseDate: string; label: string;
  sourceUrl: string; coverId: string; receivedFrom: string; receivedAt: string;
  headline: string; photo1: PhotoState; spotlight: string; links: { label: string; url: string; iconId: string }[];
  story1: string; photo2: PhotoState; story2: string; trivia: TriviaItem[]; legacy?: boolean;
};

let nextKey = 0;
const CHIPS = ["Pre-save", "Watch video", "Listen", "Tickets", "Website", "Instagram"];

export function PressEditor({ init, media, icons }: { init: PressInit; media: MediaOpt[]; icons: IconOpt[] }) {
  const [state, action, pending] = useActionState(savePress, undefined);
  const [v, setV] = useState(init);
  const [rows, setRows] = useState<Row[]>(() => init.links.map((l) => ({ ...l, key: nextKey++ })));
  const [trivia, setTrivia] = useState<TriviaItem[]>(() => [0, 1, 2].map((i) => init.trivia[i] ?? { question: "", answer: "" }));
  const set = <K extends keyof PressInit>(k: K, val: PressInit[K]) => setV((x) => ({ ...x, [k]: val }));
  const text = (k: keyof PressInit) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => set(k, e.target.value as never);

  const addRow = (label = "") => {
    const hit = label ? icons.find((i) => i.name.toLowerCase().includes(label.toLowerCase().split(" ")[0])) : undefined;
    setRows((r) => [...r, { key: nextKey++, label, url: "", iconId: hit?.id ?? "" }]);
  };
  const upd = (key: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) => setRows((r) => { const j = i + d; if (j < 0 || j >= r.length) return r; const c = [...r]; [c[i], c[j]] = [c[j], c[i]]; return c; });

  const hasContent = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim() !== "" || /<img\b/i.test(h);
  const someText = [v.spotlight, v.story1, v.story2].some(hasContent);
  const blocked =
    !v.artist.trim() || !v.title.trim() ? "Artist and release title are needed."
    : !someText ? "Write the spotlight or the story first."
    : (v.photo1.id && !v.photo1.alt.trim()) || (v.photo2.id && !v.photo2.alt.trim()) ? "Every photo needs alt text."
    : rows.some((r) => (r.label.trim() || r.url.trim()) && (!r.label.trim() || !safeUrl(r.url))) ? "Each link button needs text and an http or https address."
    : trivia.some((t) => (t.question.trim() || t.answer.trim()) && (!t.question.trim() || !t.answer.trim())) ? "Each trivia question needs an answer."
    : null;

  const iconSrc = (id: string) => (id && icons.some((i) => i.id === id) ? `/icons/${id}` : undefined);
  const photo = (p: PhotoState) => (p.id ? { src: `/media/${p.id}`, credit: p.credit, alt: p.alt } : null);

  return (
    <form action={action} className="editor">
      <div>
        <input type="hidden" name="id" value={init.id ?? ""} />
        <input type="hidden" name="releaseId" value={init.releaseId} />
        {init.legacy && <p className="warn">This press release was saved in an older format. Its text is in Story part 1. Save it to move it to the new layout.</p>}

        <fieldset className="pe-set">
          <legend>1. Headline and release</legend>
          <div className="row2">
            <Field label="Artist"><input name="artist" value={v.artist} onChange={text("artist")} required /></Field>
            <Field label="Release title"><input name="title" value={v.title} onChange={text("title")} required /></Field>
          </div>
          <Field label="Headline" hint="optional. Shows big at the top."><input name="headline" value={v.headline} onChange={text("headline")} maxLength={200} /></Field>
          <div className="row2">
            <Field label="Type">
              <select name="type" value={v.type} onChange={text("type")}>
                <option value="SINGLE">Single</option><option value="EP">EP</option>
                <option value="ALBUM">Album</option><option value="LIVE_ALBUM">Live album</option>
              </select>
            </Field>
            <Field label="Release date"><input type="date" name="releaseDate" value={v.releaseDate} onChange={text("releaseDate")} /></Field>
          </div>
          <Field label="Label"><input name="label" value={v.label} onChange={text("label")} /></Field>
        </fieldset>

        <PhotoField n={1} value={v.photo1} onChange={(p) => set("photo1", p)} media={media} />

        <fieldset className="pe-set">
          <legend>2. Spotlight paragraph</legend>
          <div className="fld"><span>Spotlight <em>the big opening paragraph. Paste with formatting, or type.</em></span>
            <RichEditor toolbar="press" name="spotlight" initialHtml={init.spotlight} onChange={(h) => set("spotlight", h)} minHeight="7rem" /></div>
        </fieldset>

        <fieldset className="pe-set">
          <legend>3. Link buttons</legend>
          <div className="chips" aria-label="Quick add">
            {CHIPS.map((c) => <button type="button" className="chip" key={c} onClick={() => addRow(c)}>+ {c}</button>)}
            <button type="button" className="chip" onClick={() => addRow()}>+ Other</button>
          </div>
          {rows.length === 0 && <p className="mono">No buttons yet.</p>}
          {rows.map((r, i) => (
            <div className="linkrow-edit" key={r.key}>
              <Field label="Button text"><input name="linkLabel" value={r.label} onChange={(e) => upd(r.key, { label: e.target.value })} /></Field>
              <Field label="Address"><input name="linkUrl" type="url" placeholder="https://" value={r.url} onChange={(e) => upd(r.key, { url: e.target.value })} /></Field>
              <Field label="Icon">
                <select name="linkIcon" value={r.iconId} onChange={(e) => upd(r.key, { iconId: e.target.value })}>
                  <option value="">None</option>
                  {icons.map((ic) => <option key={ic.id} value={ic.id}>{ic.name}</option>)}
                </select>
              </Field>
              <span className="actions" style={{ marginBottom: 14 }}>
                <button type="button" className="mini" aria-label="Move up" onClick={() => move(i, -1)}>Up</button>
                <button type="button" className="mini" aria-label="Move down" onClick={() => move(i, 1)}>Down</button>
                <button type="button" className="mini" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))}>Remove</button>
              </span>
            </div>
          ))}
          {icons.length === 0 && <p className="mono">No icons yet. Add them on the Icons tab.</p>}
        </fieldset>

        <fieldset className="pe-set">
          <legend>4. Story part 1</legend>
          <div className="fld"><span>Story <em>a couple of paragraphs</em></span>
            <RichEditor toolbar="press" name="story1" initialHtml={init.story1} onChange={(h) => set("story1", h)} minHeight="10rem" /></div>
        </fieldset>

        <PhotoField n={2} value={v.photo2} onChange={(p) => set("photo2", p)} media={media} />

        <fieldset className="pe-set">
          <legend>5. Story part 2</legend>
          <div className="fld"><span>The rest of the story</span>
            <RichEditor toolbar="press" name="story2" initialHtml={init.story2} onChange={(h) => set("story2", h)} minHeight="12rem" /></div>
        </fieldset>

        <fieldset className="pe-set">
          <legend>6. Pub trivia</legend>
          <p className="mono">Up to three questions, each with an answer. Visitors press Reveal answer to see it.</p>
          {trivia.map((t, i) => (
            <div key={i} className="qa-edit">
              <Field label={`Question ${i + 1}`}><input name="triviaQ" value={t.question} onChange={(e) => setTrivia((x) => x.map((y, j) => (j === i ? { ...y, question: e.target.value } : y)))} /></Field>
              <Field label={`Answer ${i + 1}`}><input name="triviaA" value={t.answer} onChange={(e) => setTrivia((x) => x.map((y, j) => (j === i ? { ...y, answer: e.target.value } : y)))} /></Field>
            </div>
          ))}
        </fieldset>

        <details className="pe-more">
          <summary>More details</summary>
          <div className="row2">
            <Field label="Source URL"><input name="sourceUrl" type="url" value={v.sourceUrl} onChange={text("sourceUrl")} /></Field>
            <Field label="Received from"><input name="receivedFrom" value={v.receivedFrom} onChange={text("receivedFrom")} /></Field>
          </div>
          <Field label="Received on"><input type="date" name="receivedAt" value={v.receivedAt} onChange={text("receivedAt")} /></Field>
          <CoverPicker media={media} value={init.coverId} />
        </details>

        <StatusBar id={init.id} status={init.status} pending={pending} blocked={blocked} error={state?.error} />
      </div>

      <div className="preview">
        <p className="mono">Live preview</p>
        <PressView
          headline={v.headline} artist={v.artist} title={v.title} type={v.type} releaseDate={v.releaseDate || null} label={v.label}
          photo1={photo(v.photo1)} spotlight={v.spotlight}
          links={normalizeLinks(rows).map((l) => ({ ...l, iconSrc: iconSrc(l.iconId) }))}
          story1={v.story1} photo2={photo(v.photo2)} story2={v.story2} trivia={normalizeTrivia(trivia)} rich
        />
      </div>
    </form>
  );
}
