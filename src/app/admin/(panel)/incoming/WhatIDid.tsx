import { dismissNotes } from "./actions";

export type DidNote = { text: string; kind: "info" | "warn" };

// Every decision Quick add made, in plain words. Check it in a few seconds and fix anything in the editor.
export function WhatIDid({ id, notes }: { id: string; notes: DidNote[] }) {
  return (
    <section className="did" aria-label="What I did">
      <h3>What I did</h3>
      <p className="mono">Check this, then fix anything in the editor. Lines with ! need a look.</p>
      <ul>{notes.map((n, i) => <li key={i} className={n.kind === "warn" ? "warn" : undefined}>{n.text}</li>)}</ul>
      <form action={dismissNotes}><input type="hidden" name="id" value={id} /><button className="mini">Dismiss</button></form>
    </section>
  );
}
