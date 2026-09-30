"use client";
import { useActionState, useState } from "react";
import { Field, StatusBar, VoicePanel } from "@/components/admin";
import { OpinionItem } from "@/components/blocks";
import { looksLikeSentence, wordCount } from "@/lib/voice";
import { saveOpinion } from "./actions";

export type OpinionInit = { id?: string; status?: string; title: string; body: string };

export function OpinionEditor({ init }: { init: OpinionInit }) {
  const [state, action, pending] = useActionState(saveOpinion, undefined);
  const [title, setTitle] = useState(init.title);
  const [body, setBody] = useState(init.body);
  const words = wordCount(body);
  const lengthWarn = words === 0 ? null : words < 150 ? `${words} words. Under 150.` : words > 400 ? `${words} words. Over 400.` : null;
  const blocked = !title.trim() ? "A title is needed." : !looksLikeSentence(title) ? "The title must be a full sentence with an opinion in it." : !body.trim() ? "Write the piece first." : null;
  return (
    <form action={action} className="editor">
      <div>
        <input type="hidden" name="id" value={init.id ?? ""} />
        <Field label="Title" hint="a full sentence"><input name="title" value={title} onChange={(e) => setTitle(e.target.value)} required /></Field>
        <Field label="Body"><textarea name="body" value={body} onChange={(e) => setBody(e.target.value)} style={{ minHeight: "18rem" }} /></Field>
        <p className="mono">{words} words. Aim for 150 to 400.</p>
        {lengthWarn && <p className="warn">{lengthWarn}</p>}
        <StatusBar id={init.id} status={init.status} pending={pending} blocked={blocked} error={state?.error} />
      </div>
      <div className="preview">
        <VoicePanel parts={[{ label: "Title", text: title }, { label: "Body", text: body }]} />
        <OpinionItem o={{ slug: "", title: title || "Title", body, publishedAt: new Date(), isExample: false }} />
      </div>
    </form>
  );
}
