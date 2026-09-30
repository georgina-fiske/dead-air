"use client";
import { useState } from "react";
import { voiceCheck, type VoiceFlag } from "@/lib/voice";

export function StatusBar({ id, status, pending, blocked, error }: {
  id?: string; status?: string; pending: boolean; blocked?: string | null; error?: string;
}) {
  const [when, setWhen] = useState("");
  const live = status === "PUBLISHED" || status === "SCHEDULED";
  return (
    <div className="statusbar">
      {status && <p className="mono">Status: <b>{status.toLowerCase()}</b></p>}
      {blocked && <p className="warn" role="status">{blocked}</p>}
      {error && <p className="err" role="alert">{error}</p>}
      <div className="actions">
        <button className="btn" name="intent" value="save" disabled={pending}>{live ? "Save changes" : "Save draft"}</button>
        {!live && <button className="btn" name="intent" value="publish" disabled={pending || !!blocked}>Publish now</button>}
        {live && <button className="btn ghost" name="intent" value="unpublish" disabled={pending}>Unpublish</button>}
        {id && (
          <button className="btn ghost" name="intent" value="delete" disabled={pending}
            onClick={(e) => { if (!confirm("Delete this for good?")) e.preventDefault(); }}>Delete</button>
        )}
      </div>
      {!live && (
        <div className="schedule">
          <label>
            <span>Schedule (Sydney time)</span>
            <input type="datetime-local" name="scheduledAt" value={when} onChange={(e) => setWhen(e.target.value)} />
          </label>
          <button className="btn ghost" name="intent" value="schedule" disabled={pending || !!blocked || !when}>Schedule</button>
        </div>
      )}
    </div>
  );
}

export function VoicePanel({ parts }: { parts: { label: string; text: string }[] }) {
  const all: (VoiceFlag & { label: string })[] = parts.flatMap((p) => voiceCheck(p.text).map((f) => ({ ...f, label: p.label })));
  return (
    <aside className="voice" aria-live="polite">
      <h4>Voice check</h4>
      {all.length === 0 ? <p className="mono">Clean.</p> : (
        <ul>{all.map((f, i) => <li key={i}><b>{f.label}:</b> &ldquo;{f.text}&rdquo; <span>{f.hint}</span></li>)}</ul>
      )}
      <p className="mono">A nudge only. It never blocks.</p>
    </aside>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="fld">
      <span>{label}{hint && <em> {hint}</em>}</span>
      {children}
    </label>
  );
}
