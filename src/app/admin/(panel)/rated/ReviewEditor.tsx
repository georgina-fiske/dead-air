"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { Field, StatusBar, VoicePanel } from "@/components/admin";
import { ReviewCard } from "@/components/ReviewCard";
import { CATEGORIES, canPublish, computeTotal, type Scores } from "@/lib/rubric";
import { saveReview } from "./actions";

export type ReviewInit = {
  id?: string; status?: string; releaseId: string; take: string; isFan: boolean; listenedAt: string;
  scores: Record<string, string>; lines: Record<string, string>;
};
export type ReleaseOpt = { id: string; artist: string; title: string; type: string; date: string | null };

export function ReviewEditor({ init, releases }: { init: ReviewInit; releases: ReleaseOpt[] }) {
  const [state, action, pending] = useActionState(saveReview, undefined);
  const [releaseId, setReleaseId] = useState(init.releaseId);
  const [take, setTake] = useState(init.take);
  const [fan, setFan] = useState(init.isFan);
  const [scores, setScores] = useState(init.scores);
  const [lines, setLines] = useState(init.lines);

  const num: Scores = {};
  for (const c of CATEGORIES) {
    const s = scores[c.key]?.trim();
    num[c.key] = s === "" || s === undefined ? null : Number(s);
  }
  const complete = canPublish(num);
  const total = computeTotal(num);
  const rel = releases.find((r) => r.id === releaseId);
  const blocked = !releaseId ? "Pick a release first." : !complete ? "All five scores are needed to publish. Replay can wait: save a draft." : !take.trim() ? "Write the take first." : null;

  return (
    <form action={action} className="editor">
      <div>
        <input type="hidden" name="id" value={init.id ?? ""} />
        <Field label="Release">
          <select name="releaseId" value={releaseId} onChange={(e) => setReleaseId(e.target.value)} required>
            <option value="">Pick one</option>
            {releases.map((r) => <option key={r.id} value={r.id}>{r.artist} {"–"} {r.title}</option>)}
          </select>
        </Field>
        <p className="mono" style={{ marginTop: -6 }}>Not there? <Link href="/admin/releases/new">Add the release</Link> first.</p>
        <Field label="Take" hint="one line. The first thing people read."><textarea name="take" rows={2} value={take} onChange={(e) => setTake(e.target.value)} style={{ minHeight: "4rem" }} /></Field>
        <p className="mono">Score Bias first, before anything else. Do not change it after.</p>
        {CATEGORIES.map((c) => (
          <div className="scorebox" key={c.key}>
            <Field label={`${c.name} /${c.max}`}>
              <input name={c.key} type="number" inputMode="numeric" min={0} max={c.max} step={1} value={scores[c.key] ?? ""}
                onChange={(e) => setScores({ ...scores, [c.key]: e.target.value })} />
            </Field>
            <Field label={`${c.name} line`}>
              <textarea name={`${c.key}Line`} rows={2} value={lines[c.key] ?? ""} style={{ minHeight: "4rem" }}
                onChange={(e) => setLines({ ...lines, [c.key]: e.target.value })} />
            </Field>
          </div>
        ))}
        <div className="total">{complete ? total : `${total}`}<small> / 100 {complete ? "" : " (not complete)"}</small></div>
        <div className="row2">
          <Field label="Listened on"><input type="date" name="listenedAt" defaultValue={init.listenedAt} /></Field>
          <Field label="Fan of the artist?">
            <label style={{ display: "flex", gap: 8, alignItems: "center", textTransform: "none" }}>
              <input type="checkbox" name="isFan" checked={fan} onChange={(e) => setFan(e.target.checked)} style={{ width: "auto" }} /> Say so in the review
            </label>
          </Field>
        </div>
        <StatusBar id={init.id} status={init.status} pending={pending} blocked={blocked} error={state?.error} />
      </div>
      <div className="preview">
        <VoicePanel parts={[{ label: "Take", text: take }, ...CATEGORIES.map((c) => ({ label: c.name, text: lines[c.key] ?? "" }))]} />
        <ReviewCard link={false} r={{
          artist: rel?.artist ?? "", title: rel?.title ?? "", type: rel?.type ?? "", date: rel?.date, take, isFan: fan,
          scores: Object.fromEntries(CATEGORIES.map((c) => [c.key, num[c.key]])), lines, total: complete ? total : null,
        }} />
      </div>
    </form>
  );
}
