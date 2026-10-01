"use client";
import { useActionState, useState } from "react";
import { Field } from "@/components/admin";
import { RichEditor } from "@/components/RichEditor";
import { Uploader } from "@/components/Uploader";
import { placeAction } from "./actions";

type Photo = { id: string; name: string };

export function QuickAddForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(placeAction, undefined);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const move = (i: number, d: -1 | 1) => setPhotos((p) => { const j = i + d; if (j < 0 || j >= p.length) return p; const c = [...p]; [c[i], c[j]] = [c[j], c[i]]; return c; });
  const role = (i: number) => (i === 0 ? "Photo 1, at the top" : i === 1 ? "Photo 2, between the story parts" : "Extra, not used");

  return (
    <form action={action} className="qa-form">
      <div className="row2">
        <Field label="Artist"><input name="artist" required /></Field>
        <Field label="Release title"><input name="title" required /></Field>
      </div>
      <details className="pe-more">
        <summary>More details</summary>
        <div className="row2">
          <Field label="Type" hint="default Single">
            <select name="type" defaultValue="SINGLE">
              <option value="SINGLE">Single</option><option value="EP">EP</option>
              <option value="ALBUM">Album</option><option value="LIVE_ALBUM">Live album</option>
            </select>
          </Field>
          <Field label="Release date" hint="default today"><input type="date" name="date" defaultValue={today} /></Field>
        </div>
        <Field label="Label"><input name="label" /></Field>
      </details>

      <fieldset className="pe-set">
        <legend>Box 1. Photos</legend>
        <Uploader label="Drop photos here or click to choose" onDone={(f) => setPhotos((p) => [...p, ...f.map((x) => ({ id: x.id, name: x.name }))])} />
        {photos.length > 0 && (
          <ol className="qa-photos">
            {photos.map((p, i) => (
              <li key={p.id} className={i > 1 ? "extra" : undefined}>
                <input type="hidden" name="photoId" value={p.id} />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/media/${p.id}`} alt="" />
                <span><b>{role(i)}</b><br /><span className="mono">{p.name}</span></span>
                <span className="actions">
                  <button type="button" className="mini" onClick={() => move(i, -1)} aria-label="Move up">Up</button>
                  <button type="button" className="mini" onClick={() => move(i, 1)} aria-label="Move down">Down</button>
                  <button type="button" className="mini" onClick={() => setPhotos((x) => x.filter((y) => y.id !== p.id))}>Remove</button>
                </span>
              </li>
            ))}
          </ol>
        )}
        <Field label="Photo credit" hint="used for both photos. Leave blank to look for a credit line in the text.">
          <input name="credit" placeholder="Name" />
        </Field>
      </fieldset>

      <fieldset className="pe-set">
        <legend>Box 2. Text</legend>
        <p className="mono">Paste the press release exactly as it came.</p>
        <RichEditor name="textHtml" initialHtml="" onChange={() => {}} minHeight="14rem" />
      </fieldset>

      <fieldset className="pe-set">
        <legend>Box 3. Links</legend>
        <label className="fld">
          <span>One link per line, any order <em>Type a name before a link to use it as the button text.</em></span>
          <textarea name="links" rows={6} spellCheck={false} placeholder={"https://open.spotify.com/track/...\nWatch the video: https://youtu.be/...\nhttps://ffm.to/..."} />
        </label>
      </fieldset>

      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <button type="submit" className="btn place" disabled={pending}>{pending ? "Placing." : "Place everything"}</button>
      <p className="mono">This builds a draft and opens the editor with a live preview. Nothing goes public until you publish.</p>
    </form>
  );
}
