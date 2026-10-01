"use client";
import { Uploader } from "@/components/Uploader";
import type { MediaOpt } from "@/components/CoverPicker";

export type PhotoState = { id: string; credit: string; alt: string };

export function PhotoField({ n, value, onChange, media }: { n: 1 | 2; value: PhotoState; onChange: (v: PhotoState) => void; media: MediaOpt[] }) {
  return (
    <fieldset className="pe-set">
      <legend>Photo {n}</legend>
      <input type="hidden" name={`photo${n}Id`} value={value.id} />
      {value.id ? (
        <div className="pe-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/media/${value.id}`} alt="" />
          <button type="button" className="btn ghost" onClick={() => onChange({ ...value, id: "" })}>Remove photo</button>
        </div>
      ) : (
        <>
          {media.length > 0 && (
            <div className="thumbs" aria-label="Pick from the Media library">
              {media.slice(0, 12).map((m) => (
                <button type="button" key={m.id} className="thumb" title={m.filename} onClick={() => onChange({ ...value, id: m.id })}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/media/${m.id}`} alt={m.filename} />
                </button>
              ))}
            </div>
          )}
          <Uploader label={`Drop photo ${n} here or click to pick`} onDone={(f) => f[0] && onChange({ ...value, id: f[0].id })} />
        </>
      )}
      <label className="fld"><span>Photo credit <em>just the name. It shows as &ldquo;Photo: Name&rdquo;</em></span>
        <input name={`photo${n}Credit`} value={value.credit} onChange={(e) => onChange({ ...value, credit: e.target.value })} />
      </label>
      <label className="fld"><span>Alt text <em>describe the photo for people who can&apos;t see it</em></span>
        <input name={`photo${n}Alt`} value={value.alt} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
      </label>
    </fieldset>
  );
}
