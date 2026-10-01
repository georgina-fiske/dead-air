"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function IconUploader() {
  const router = useRouter();
  const file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    const f = file.current?.files?.[0];
    if (!name.trim() || !f) { setMsg("Add a name and pick an image."); return; }
    setBusy(true); setMsg("");
    const body = new FormData(); body.set("name", name); body.set("file", f);
    const res = await fetch("/admin/api/icons", { method: "POST", body });
    const json = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(json.error ?? "Upload failed."); return; }
    setName(""); if (file.current) file.current.value = ""; setMsg("Uploaded."); router.refresh();
  }
  return (
    <form onSubmit={send} className="form" style={{ maxWidth: 520 }}>
      <label><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Spotify" /></label>
      <label><span>Icon file <em>PNG, SVG or WebP. One colour with a transparent background works best.</em></span><input ref={file} type="file" accept="image/*" /></label>
      {msg && <p className="mono" role="status">{msg}</p>}
      <button type="submit" disabled={busy}>{busy ? "Wait." : "Upload icon"}</button>
    </form>
  );
}
