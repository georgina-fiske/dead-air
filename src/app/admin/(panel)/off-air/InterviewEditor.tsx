"use client";
import { useActionState, useState } from "react";
import { Field, StatusBar } from "@/components/admin";
import { InterviewCard } from "@/components/blocks";
import { RichEditor } from "@/components/RichEditor";
import { saveInterview } from "./actions";

export type QA = { question: string; answerHtml: string };
type Row = QA & { key: number; answer: string };
let nextKey = 0;
const blank = (): Row => ({ key: nextKey++, question: "", answerHtml: "", answer: "" });
export type InterviewInit = { id?: string; status?: string; artist: string; subtitle: string; date: string; qa: QA[] };

export function InterviewEditor({ init }: { init: InterviewInit }) {
  const [state, action, pending] = useActionState(saveInterview, undefined);
  const [artist, setArtist] = useState(init.artist);
  const [subtitle, setSubtitle] = useState(init.subtitle);
  const [date, setDate] = useState(init.date);
  const [qa, setQa] = useState<Row[]>(() => (init.qa.length ? init.qa.map((x) => ({ ...x, key: nextKey++, answer: "" })) : [blank()]));
  const upd = (key: number, patch: Partial<Row>) => setQa((rows) => rows.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const blocked = !artist.trim() ? "Artist is needed." : qa.some((x) => x.question.trim() && !x.answer.trim() && !/<img\b/i.test(x.answerHtml)) ? "Every question needs an answer before it goes live." : null;
  return (
    <form action={action} className="editor">
      <div>
        <input type="hidden" name="id" value={init.id ?? ""} />
        <div className="row2">
          <Field label="Artist"><input name="artist" value={artist} onChange={(e) => setArtist(e.target.value)} required /></Field>
          <Field label="Subtitle" hint="release or role"><input name="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
        </div>
        <Field label="Date"><input type="date" name="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        {qa.map((x, i) => (
          <div className="qa-edit" key={x.key}>
            <Field label={`Question ${i + 1}`}><textarea name="question" rows={2} value={x.question} onChange={(e) => upd(x.key, { question: e.target.value })} style={{ minHeight: "4rem" }} /></Field>
            <div className="fld">
              <span>Answer {i + 1} <em>paste with formatting</em></span>
              <RichEditor name="answerHtml" initialHtml={x.answerHtml} onChange={(h, t) => upd(x.key, { answerHtml: h, answer: t })} />
            </div>
            <span className="verbatim">Verbatim</span>
            {qa.length > 1 && <button type="button" className="btn ghost" style={{ marginLeft: 8, padding: "2px 8px" }} onClick={() => setQa((rows) => rows.filter((r) => r.key !== x.key))}>Remove</button>}
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => setQa((rows) => [...rows, blank()])}>Add a question</button>
        <p className="mono" style={{ marginTop: 10 }}>The words in answers are never fixed or reworded. Never checked for voice.</p>
        <StatusBar id={init.id} status={init.status} pending={pending} blocked={blocked} error={state?.error} />
      </div>
      <div className="preview">
        <InterviewCard i={{
          slug: "", artist: artist || "Artist", subtitle: subtitle || null, date: date ? new Date(date) : null, isExample: false,
          qa: qa.map((x) => ({ id: String(x.key), question: x.question, answer: x.answer, answerHtml: x.answerHtml })),
        }} />
      </div>
    </form>
  );
}
