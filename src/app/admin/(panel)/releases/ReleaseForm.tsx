"use client";
import { useActionState } from "react";
import { Field } from "@/components/admin";
import { saveRelease } from "./actions";

type R = { id?: string; artist: string; title: string; type: string; releaseDate: string; label: string; sourceUrl: string };

export function ReleaseForm({ r }: { r: R }) {
  const [state, action, pending] = useActionState(saveRelease, undefined);
  return (
    <form action={action}>
      <input type="hidden" name="id" value={r.id ?? ""} />
      <Field label="Artist"><input name="artist" defaultValue={r.artist} required /></Field>
      <Field label="Title"><input name="title" defaultValue={r.title} required /></Field>
      <div className="row2">
        <Field label="Type">
          <select name="type" defaultValue={r.type || "SINGLE"}>
            <option value="SINGLE">Single</option><option value="EP">EP</option>
            <option value="ALBUM">Album</option><option value="LIVE_ALBUM">Live album</option>
          </select>
        </Field>
        <Field label="Release date"><input type="date" name="releaseDate" defaultValue={r.releaseDate} /></Field>
      </div>
      <Field label="Label"><input name="label" defaultValue={r.label} /></Field>
      <Field label="Source URL" hint="where you found it"><input name="sourceUrl" type="url" defaultValue={r.sourceUrl} /></Field>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <div className="actions">
        <button className="btn" name="intent" value="save" disabled={pending}>Save release</button>
        {r.id && <button className="btn ghost" name="intent" value="delete" disabled={pending}
          onClick={(e) => { if (!confirm("Delete this release and its press release and review?")) e.preventDefault(); }}>Delete</button>}
      </div>
    </form>
  );
}
