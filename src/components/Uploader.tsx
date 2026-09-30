"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type Uploaded = { id: string; name: string };

export function Uploader({ onDone, label = "Drop images here or click to pick" }: { onDone?: (f: Uploaded[]) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState("");

  async function send(list: FileList | File[]) {
    const files = Array.from(list);
    if (!files.length) return;
    setBusy(true); setMsg("");
    const body = new FormData();
    files.forEach((f) => body.append("file", f));
    try {
      const res = await fetch("/admin/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) { setMsg(json.error ?? "Upload failed."); return; }
      const ok = (json.files as { id?: string; name: string; error?: string }[]);
      const bad = ok.filter((x) => x.error);
      setMsg(bad.length ? bad.map((b) => `${b.name}: ${b.error}`).join(" ") : `Uploaded ${ok.length}.`);
      onDone?.(ok.filter((x) => x.id).map((x) => ({ id: x.id!, name: x.name })));
      router.refresh();
    } catch {
      setMsg("Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  return (
    <div>
      <div
        className={`drop ${drag ? "over" : ""}`} role="button" tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.current?.click(); } }}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void send(e.dataTransfer.files); }}
      >
        {busy ? "Uploading and resizing." : label}
      </div>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && void send(e.target.files)} />
      {msg && <p className="mono" role="status">{msg}</p>}
    </div>
  );
}
