"use client";
import { useRef, useState } from "react";
import { safeUrl } from "@/lib/pressText";

// A text box with a small toolbar: Link, Centre this line, Subheading. A blank line starts a new paragraph.
// The text is kept exactly as typed. The toolbar only adds the small markers the page understands.
export function MarkupBox({ name, label, hint, value, onChange, rows = 6 }: {
  name: string; label: string; hint?: string; value: string; onChange: (v: string) => void; rows?: number;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [note, setNote] = useState("");

  const put = (next: string, a: number, b: number) => {
    onChange(next);
    requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(a, b); });
  };

  const link = () => {
    const el = ref.current; if (!el) return;
    const s = el.selectionStart, e = el.selectionEnd;
    if (s === e) { setNote("Select the words first, then press Link."); return; }
    const url = prompt("Paste the address (https://...)");
    if (!url) return;
    if (!safeUrl(url)) { setNote("Only http and https addresses work."); return; }
    setNote("");
    const sel = value.slice(s, e);
    const rep = `[${sel}](${url.trim()})`;
    put(value.slice(0, s) + rep + value.slice(e), s, s + rep.length);
  };

  // Work on the paragraph the cursor is in.
  const para = () => {
    const at = ref.current!.selectionStart;
    const before = at > 0 ? value.lastIndexOf("\n\n", at - 1) : -1;
    const start = before === -1 ? 0 : before + 2;
    const after = value.indexOf("\n\n", at);
    return { start, end: after === -1 ? value.length : after };
  };
  const toggle = (marker: ">> " | "## ") => {
    if (!ref.current) return;
    setNote("");
    const { start, end } = para();
    let text = value.slice(start, end);
    const centre = text.startsWith(">> ");
    let rest = centre ? text.slice(3) : text;
    const head = rest.startsWith("## ");
    if (marker === ">> ") text = (centre ? "" : ">> ") + rest;
    else { rest = head ? rest.slice(3) : "## " + rest; text = (centre ? ">> " : "") + rest; }
    put(value.slice(0, start) + text + value.slice(end), start, start + text.length);
  };

  return (
    <div className="fld">
      <span>{label}{hint && <em> {hint}</em>}</span>
      <div className="rte" style={{ borderWidth: 2 }}>
        <div className="rte-bar" role="toolbar" aria-label={`${label} tools`}>
          <button type="button" onClick={link}>Link</button>
          <button type="button" onClick={() => toggle(">> ")}>Centre this line</button>
          <button type="button" onClick={() => toggle("## ")}>Subheading</button>
        </div>
        <textarea ref={ref} name={name} rows={rows} value={value} onChange={(e) => onChange(e.target.value)}
          style={{ border: 0, minHeight: `${rows * 1.6}rem`, display: "block", width: "100%", resize: "vertical", padding: "12px 14px", font: "inherit", background: "var(--bg)", color: "var(--fg)" }} />
      </div>
      {note && <p className="warn" role="status">{note}</p>}
    </div>
  );
}
