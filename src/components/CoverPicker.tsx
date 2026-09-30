"use client";
import { useState } from "react";
import { Uploader } from "@/components/Uploader";

export type MediaOpt = { id: string; filename: string };

export function CoverPicker({ media, value }: { media: MediaOpt[]; value: string }) {
  const [id, setId] = useState(value);
  const [extra, setExtra] = useState<MediaOpt[]>([]);
  const all = [...extra, ...media.filter((m) => !extra.some((e) => e.id === m.id))];
  return (
    <div className="fld">
      <span>Cover art</span>
      <input type="hidden" name="coverId" value={id} />
      <div className="thumbs">
        <button type="button" className={`thumb none ${id === "" ? "sel" : ""}`} onClick={() => setId("")}>None</button>
        {all.map((m) => (
          <button type="button" key={m.id} className={`thumb ${id === m.id ? "sel" : ""}`} onClick={() => setId(m.id)} title={m.filename}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/media/${m.id}`} alt={m.filename} />
          </button>
        ))}
      </div>
      <Uploader label="Upload cover art" onDone={(f) => { setExtra((e) => [...f.map((x) => ({ id: x.id, filename: x.name })), ...e]); if (f[0]) setId(f[0].id); }} />
    </div>
  );
}
