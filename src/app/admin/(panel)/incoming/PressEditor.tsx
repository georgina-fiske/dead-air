"use client";
import { useActionState, useState } from "react";
import { Field, StatusBar } from "@/components/admin";
import { TYPE_LABEL, fmtDate } from "@/lib/format";
import { savePress } from "./actions";

export type PressInit = {
  id?: string; status?: string; releaseId: string; artist: string; title: string; type: string; releaseDate: string;
  label: string; sourceUrl: string; body: string; receivedFrom: string; receivedAt: string;
};

export function PressEditor({ init }: { init: PressInit }) {
  const [state, action, pending] = useActionState(savePress, undefined);
  const [v, setV] = useState(init);
  const set = (k: keyof PressInit) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });
  const blocked = !v.artist.trim() || !v.title.trim() ? "Artist and title are needed." : !v.body.trim() ? "Paste the press release first." : null;
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
        <Field label="Press release" hint="paste exactly as sent"><textarea name="body" value={v.body} onChange={set("body")} style={{ minHeight: "16rem" }} spellCheck={false} /></Field>
        <span className="verbatim">Verbatim</span> <span className="mono">Stored exactly as pasted. Never rewritten. Never checked for voice.</span>
        <StatusBar id={init.id} status={init.status} pending={pending} blocked={blocked} error={state?.error} />
      </div>
      <div className="preview">
        <h1 className="h1">{v.artist || "Artist"} {"–"} {v.title || "Title"}</h1>
        <p className="sub">{[TYPE_LABEL[v.type], v.label, fmtDate(v.releaseDate)].filter(Boolean).join(" · ")}</p>
        <div className="release-body">{v.body}</div>
      </div>
    </form>
  );
}
