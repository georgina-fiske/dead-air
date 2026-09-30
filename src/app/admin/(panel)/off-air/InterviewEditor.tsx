"use client";
import { useActionState, useState } from "react";
import { Field, StatusBar } from "@/components/admin";
import { InterviewCard } from "@/components/blocks";
import { saveInterview } from "./actions";

export type QA = { question: string; answer: string };
export type InterviewInit = { id?: string; status?: string; artist: string; subtitle: string; date: string; qa: QA[] };

export function InterviewEditor({ init }: { init: InterviewInit }) {
  const [state, action, pending] = useActionState(saveInterview, undefined);
  const [artist, setArtist] = useState(init.artist);
  const [subtitle, setSubtitle] = useState(init.subtitle);
  const [date, setDate] = useState(init.date);
  const [qa, setQa] = useState<QA[]>(init.qa.length ? init.qa : [{ question: "", answer: "" }]);
  const upd = (i: number, k: keyof QA, v: string) => setQa(qa.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const blocked = !artist.trim() ? "Artist is needed." : qa.some((x) => x.question.trim() && !x.answer.trim()) ? "Every question needs an answer before it goes live." : null;
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
          <div className="qa-edit" key={i}>
            <Field label={`Question ${i + 1}`}><textarea name="question" rows={2} value={x.question} onChange={(e) => upd(i, "question", e.target.value)} style={{ minHeight: "4rem" }} /></Field>
            <Field label={`Answer ${i + 1}`}>
              <textarea name="answer" value={x.answer} onChange={(e) => upd(i, "answer", e.target.value)} spellCheck={false} autoCorrect="off" autoCapitalize="off" />
            </Field>
            <span className="verbatim">Verbatim</span>
            {qa.length > 1 && <button type="button" className="btn ghost" style={{ marginLeft: 8, padding: "2px 8px" }} onClick={() => setQa(qa.filter((_, j) => j !== i))}>Remove</button>}
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => setQa([...qa, { question: "", answer: "" }])}>Add a question</button>
        <p className="mono" style={{ marginTop: 10 }}>Answers are never trimmed, fixed or reworded. Never checked for voice.</p>
        <StatusBar id={init.id} status={init.status} pending={pending} blocked={blocked} error={state?.error} />
      </div>
      <div className="preview">
        <InterviewCard i={{
          slug: "", artist: artist || "Artist", subtitle: subtitle || null, date: date ? new Date(date) : null, isExample: false,
          qa: qa.map((x, i) => ({ id: String(i), question: x.question, answer: x.answer })),
        }} />
      </div>
    </form>
  );
}
