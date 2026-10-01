"use client";
import { useActionState, useState } from "react";
import { Field, StatusBar } from "@/components/admin";
import { RichEditor } from "@/components/RichEditor";
import { CoverPicker, type MediaOpt } from "@/components/CoverPicker";
import { TYPE_LABEL, fmtDate } from "@/lib/format";
import { savePress } from "./actions";

export type PressInit = {
  id?: string; status?: string; releaseId: string; artist: string; title: string; type: string; releaseDate: string;
  label: string; sourceUrl: string; coverId: string; headline: string; bodyHtml: string; receivedFrom: string; receivedAt: string;
};

export function PressEditor({ init, media }: { init: PressInit; media: MediaOpt[] }) {
  const [state, action, pending] = useActionState(savePress, undefined);
  const [v, setV] = useState(init);
  const [html, setHtml] = useState(init.bodyHtml);
  const hasBody = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim() !== "" || /<img\b/i.test(html);
  const set = (k: keyof PressInit) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const blocked = !v.artist.trim() || !v.title.trim() ? "Artist and title are needed." : !hasBody ? "Paste the press release first." : null;
  return (
    <form action={action} className="editor">
      <div>
        <input type="hidden" name="id" value={init.id ?? ""} />
        <input type="hidden" name="releaseId" value={init.releaseId} />
        <div className="row2">
          <Field label="Artist"><input name="artist" value={v.artist} onChange={set("artist")} required /></Field>
          <Field label="Title"><input name="title" value={v.title} onChange={set("title")} required /></Field>
        </div>
        <div className="row2">
          <Field label="Type">
            <select name="type" value={v.type} onChange={set("type")}>
              <option value="SINGLE">Single</option><option value="EP">EP</option>
              <option value="ALBUM">Album</option><option value="LIVE_ALBUM">Live album</option>
            </select>
          </Field>
          <Field label="Release date"><input type="date" name="releaseDate" value={v.releaseDate} onChange={set("releaseDate")} /></Field>
        </div>
        <div className="row2">
          <Field label="Label"><input name="label" value={v.label} onChange={set("label")} /></Field>
          <Field label="Source URL"><input name="sourceUrl" type="url" value={v.sourceUrl} onChange={set("sourceUrl")} /></Field>
        </div>
        <div className="row2">
          <Field label="Received from"><input name="receivedFrom" value={v.receivedFrom} onChange={set("receivedFrom")} /></Field>
          <Field label="Received on"><input type="date" name="receivedAt" value={v.receivedAt} onChange={set("receivedAt")} /></Field>
        </div>
        <CoverPicker media={media} value={init.coverId} />
        <Field label="Headline" hint="the press release's own headline"><input name="headline" value={v.headline} onChange={set("headline")} maxLength={200} /></Field>
        <div className="fld">
          <span>Press release <em>copy it from the web page or email and paste it in. Links, bold and pictures stay.</em></span>
          <RichEditor name="bodyHtml" initialHtml={init.bodyHtml} onChange={setHtml} />
        </div>
        <span className="verbatim">Verbatim</span> <span className="mono">The words are never changed or checked for voice. Pictures are copied into Media when you save.</span>
        <StatusBar id={init.id} status={init.status} pending={pending} blocked={blocked} error={state?.error} />
      </div>
      <div className="preview">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {init.coverId && <img className="cover" style={{ maxWidth: 240 }} src={`/media/${init.coverId}`} alt="" />}
        <p className="kicker">{[`${v.artist || "Artist"} – ${v.title || "Title"}`, TYPE_LABEL[v.type], v.label, fmtDate(v.releaseDate)].filter(Boolean).join(" · ")}</p>
        <h1 className="headline">{v.headline || `${v.artist || "Artist"} – ${v.title || "Title"}`}</h1>
        <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </form>
  );
}
