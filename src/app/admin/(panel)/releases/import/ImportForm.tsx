"use client";
import { useActionState, useState } from "react";
import Link from "next/link";
import { importAction } from "./actions";

export function ImportForm() {
  const [state, action, pending] = useActionState(importAction, undefined);
  const [csv, setCsv] = useState("");
  const good = state?.rows?.filter((r) => !r.error && !r.duplicate).length ?? 0;
  return (
    <form action={action}>
      <label className="fld">
        <span>CSV file <em>artist, title, type, date, label</em></span>
        <input type="file" accept=".csv,text/csv,text/plain" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} />
      </label>
      <label className="fld">
        <span>Or paste rows</span>
        <textarea name="csv" value={csv} onChange={(e) => setCsv(e.target.value)} spellCheck={false} placeholder={"artist,title,type,date,label\nArtist X,Third Album,Album,2026-11-06,Example Records"} />
      </label>
      {state?.error && <p className="err" role="alert">{state.error}</p>}
      <div className="actions">
        <button className="btn ghost" name="intent" value="preview" disabled={pending}>Preview</button>
        {state?.rows && state.imported === undefined && (
          <button className="btn" name="intent" value="import" disabled={pending || good === 0}>Import {good} release{good === 1 ? "" : "s"}</button>
        )}
      </div>
      {state?.imported !== undefined && <p className="saved" style={{ marginTop: 16 }}>Imported {state.imported}. <Link href="/admin/releases">See releases</Link></p>}
      {state?.rows && (
        <table className="tbl" style={{ marginTop: 20 }}>
          <thead><tr><th>Line</th><th>Artist</th><th>Title</th><th>Type</th><th>Date</th><th>Label</th><th>Result</th></tr></thead>
          <tbody>
            {state.rows.map((r) => (
              <tr key={r.line}>
                <td className="mono">{r.line}</td><td>{r.artist}</td><td>{r.title}</td><td>{r.type}</td><td>{r.date}</td><td>{r.label}</td>
                <td>{r.error ? <span className="pill">{r.error}</span> : r.duplicate ? <span className="pill">Already there. Skipped.</span> : <span className="pill live">{state.imported !== undefined ? "Imported" : "New"}</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </form>
  );
}
