"use client";
import { useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { ALLOWED_ATTR, ALLOWED_TAGS } from "@/lib/richConfig";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Turn plain pasted text into paragraphs, with web addresses as links.
function plainToHtml(text: string): string {
  const link = (s: string) => esc(s).replace(/\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g, (u) => `<a href="${u}">${u}</a>`);
  return text.split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${link(p).replace(/\n/g, "<br>")}</p>`).join("");
}

// Pasted web pages and emails: keep structure, links and images. Drop everything else.
function cleanPasted(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("span").forEach((el) => {
    const st = el.getAttribute("style") ?? "";
    const tag = /font-weight:\s*(bold|[6-9]00)/i.test(st) ? "strong" : /font-style:\s*italic/i.test(st) ? "em" : null;
    if (tag) { const n = doc.createElement(tag); n.innerHTML = el.innerHTML; el.replaceWith(n); }
  });
  [...doc.querySelectorAll("div,td,th,section,article,header,footer,center")].reverse().forEach((el) => {
    const p = doc.createElement("p"); p.innerHTML = el.innerHTML; el.replaceWith(p);
  });
  const clean = DOMPurify.sanitize(doc.body.innerHTML, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
  return clean.replace(/<p>(\s|&nbsp;|<br>)*<\/p>/g, "");
}

function Btn({ label, title, run }: { label: React.ReactNode; title: string; run: () => void }) {
  return <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={run}>{label}</button>;
}

export function RichEditor({ name, initialHtml, onChange }: { name: string; initialHtml: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) { ref.current.innerHTML = initialHtml; if (hidden.current) hidden.current.value = initialHtml; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    const html = ref.current?.innerHTML ?? "";
    if (hidden.current) hidden.current.value = html;
    onChange(html);
  };
  const cmd = (c: string, v?: string) => { ref.current?.focus(); document.execCommand(c, false, v); sync(); };

  return (
    <div className="rte">
      <div className="rte-bar" role="toolbar" aria-label="Formatting">
        <Btn label={<b>B</b>} title="Bold" run={() => cmd("bold")} />
        <Btn label={<i>I</i>} title="Italic" run={() => cmd("italic")} />
        <Btn label="Heading" title="Heading" run={() => cmd("formatBlock", "h2")} />
        <Btn label="Text" title="Normal paragraph" run={() => cmd("formatBlock", "p")} />
        <Btn label="List" title="Bullet list" run={() => cmd("insertUnorderedList")} />
        <Btn label="Quote" title="Quote" run={() => cmd("formatBlock", "blockquote")} />
        <Btn label="Link" title="Add a link" run={() => { const u = prompt("Link address (https://...)"); if (u && /^(https?:|mailto:|tel:)/i.test(u.trim())) cmd("createLink", u.trim()); }} />
        <Btn label="Unlink" title="Remove link" run={() => cmd("unlink")} />
        <Btn label="Clear" title="Clear formatting" run={() => { cmd("removeFormat"); cmd("formatBlock", "p"); }} />
      </div>
      <div
        ref={ref} className="rte-body prose" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Press release"
        onInput={sync}
        onBlur={sync}
        onPaste={(e) => {
          e.preventDefault();
          const html = e.clipboardData.getData("text/html");
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertHTML", false, html ? cleanPasted(html) : plainToHtml(text));
          sync();
        }}
      />
      <input ref={hidden} type="hidden" name={name} />
    </div>
  );
}
