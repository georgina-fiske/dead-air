"use client";
import { useEffect, useRef, useState } from "react";
import DOMPurify from "dompurify";
import { ALLOWED_ATTR, ALLOWED_TAGS, CENTRE_CLASS } from "@/lib/richConfig";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Only the "centred" class survives cleaning. Every other class is removed.
if (typeof window !== "undefined") {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.hasAttribute?.("class") && node.getAttribute("class") !== CENTRE_CLASS) node.removeAttribute("class");
  });
}

// Turn plain pasted text into paragraphs, with web addresses as links.
function plainToHtml(text: string): string {
  const link = (s: string) => esc(s).replace(/\bhttps?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)]/g, (u) => `<a href="${u}">${u}</a>`);
  return text.split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${link(p).replace(/\n/g, "<br>")}</p>`).join("");
}

// Pasted web pages and emails: keep structure, links and images. Drop everything else.
function cleanPasted(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const swap = (el: Element, tag: string) => { const n = doc.createElement(tag); n.innerHTML = el.innerHTML; el.replaceWith(n); };
  const unwrap = (el: Element) => el.replaceWith(...Array.from(el.childNodes));
  // Browsers and Google Docs wrap whole pastes in a "not bold" bold tag. Take those off first.
  doc.querySelectorAll("b,strong").forEach((el) => { if (/font-weight:\s*(normal|400)/i.test(el.getAttribute("style") ?? "")) unwrap(el); });
  doc.querySelectorAll("i,em").forEach((el) => { if (/font-style:\s*normal/i.test(el.getAttribute("style") ?? "")) unwrap(el); });
  doc.querySelectorAll("span").forEach((el) => {
    const st = el.getAttribute("style") ?? "";
    const tag = /font-weight:\s*(bold|[6-9]00)/i.test(st) ? "strong" : /font-style:\s*italic/i.test(st) ? "em" : null;
    if (tag) swap(el, tag);
  });
  doc.querySelectorAll("b").forEach((el) => swap(el, "strong"));
  doc.querySelectorAll("i").forEach((el) => swap(el, "em"));
  doc.querySelectorAll("h1").forEach((el) => swap(el, "h2"));
  doc.querySelectorAll("h5,h6").forEach((el) => swap(el, "h4"));
  [...doc.querySelectorAll("div,td,th,section,article,header,footer,center")].reverse().forEach((el) => swap(el, "p"));
  const clean = DOMPurify.sanitize(doc.body.innerHTML, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
  return clean.replace(/&nbsp;| /g, " ").replace(/<p>(\s|<br>)*<\/p>/g, "");
}

function Btn({ label, title, run }: { label: React.ReactNode; title: string; run: () => void }) {
  return <button type="button" title={title} aria-label={title} onMouseDown={(e) => e.preventDefault()} onClick={run}>{label}</button>;
}

const BLOCKS = new Set(["P", "H2", "H3", "H4", "LI", "BLOCKQUOTE"]);

// Text typed straight into the box (no paragraph around it) gets a paragraph, so it spaces out like the rest.
function wrapLoose(root: HTMLElement) {
  const BLOCK = new Set(["P", "H2", "H3", "H4", "UL", "OL", "BLOCKQUOTE", "HR", "DIV"]);
  let run: Node[] = [];
  const flush = () => {
    if (run.length && run.some((n) => (n.textContent ?? "").trim() !== "" || (n instanceof HTMLElement && n.tagName === "IMG"))) {
      const p = document.createElement("p");
      run[0].parentNode?.insertBefore(p, run[0]);
      run.forEach((n) => p.appendChild(n));
    }
    run = [];
  };
  for (const n of Array.from(root.childNodes)) { if (n instanceof HTMLElement && BLOCK.has(n.tagName)) flush(); else run.push(n); }
  flush();
}

// What gets saved: the box's content with loose text wrapped in paragraphs. The box itself is not touched while typing.
function serialise(box: HTMLElement | null): string {
  if (!box) return "";
  const copy = box.cloneNode(true) as HTMLElement;
  wrapLoose(copy);
  return copy.innerHTML;
}

// Pasting over a subheading can leave paragraphs and lists inside it. Lift them out so blocks never nest.
function flatten(root: HTMLElement) {
  for (let guard = 0; guard < 50; guard++) {
    const bad = root.querySelector("p:has(p, h2, h3, h4, ul, ol, blockquote, hr), h2:has(p, h2, h3, h4, ul, ol, blockquote, hr), h3:has(p, h2, h3, h4, ul, ol, blockquote, hr), h4:has(p, h2, h3, h4, ul, ol, blockquote, hr)");
    if (!bad) return;
    bad.replaceWith(...Array.from(bad.childNodes));
  }
}

export function RichEditor({ name, initialHtml, onChange, toolbar = "full", minHeight }: {
  name: string; initialHtml: string; onChange: (html: string, text: string) => void; toolbar?: "full" | "press"; minHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const hidden = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (ref.current) {
      document.execCommand("defaultParagraphSeparator", false, "p");
      ref.current.innerHTML = initialHtml.trim() ? initialHtml : "<p><br></p>";
      const html = serialise(ref.current);
      if (hidden.current) hidden.current.value = html;
      onChange(html, ref.current.innerText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sync = () => {
    const html = serialise(ref.current);
    if (hidden.current) hidden.current.value = html;
    onChange(html, ref.current?.innerText ?? "");
  };
  const cmd = (c: string, v?: string) => { ref.current?.focus(); document.execCommand(c, false, v); sync(); };

  // The paragraph (or list item, subheading...) the cursor is in.
  const currentBlock = (): HTMLElement | null => {
    const box = ref.current; if (!box) return null;
    const find = () => {
      let n: Node | null = getSelection()?.anchorNode ?? null;
      while (n && n !== box) { if (n instanceof HTMLElement && BLOCKS.has(n.tagName)) return n; n = n.parentNode; }
      return null;
    };
    let b = find();
    if (!b) { box.focus(); document.execCommand("formatBlock", false, "p"); b = find(); }
    return b;
  };
  const centre = () => { const b = currentBlock(); if (b) { b.classList.toggle(CENTRE_CLASS); if (!b.getAttribute("class")) b.removeAttribute("class"); sync(); } };
  const subheading = () => {
    const b = currentBlock(); if (!b) return;
    const centred = b.classList.contains(CENTRE_CLASS);
    cmd("formatBlock", b.tagName === "H2" ? "p" : "h2");
    if (centred) { const n = currentBlock(); n?.classList.add(CENTRE_CLASS); sync(); }
  };
  const link = () => {
    const sel = getSelection();
    if (!sel || sel.isCollapsed || !ref.current?.contains(sel.anchorNode)) { setNote("Select the words first, then press Link."); return; }
    const u = prompt("Paste the address (https://...)");
    if (!u) return;
    if (!/^(https?:\/\/|mailto:)/i.test(u.trim())) { setNote("Only http and https addresses work."); return; }
    setNote(""); cmd("createLink", u.trim());
  };

  return (
    <div className="rte">
      <div className="rte-bar" role="toolbar" aria-label="Formatting">
        <Btn label={<b>B</b>} title="Bold" run={() => cmd("bold")} />
        <Btn label={<i>I</i>} title="Italic" run={() => cmd("italic")} />
        <Btn label="Link" title="Link: select words first, then paste the address" run={link} />
        {toolbar === "press" ? (
          <>
            <Btn label="Centre this line" title="Centre this paragraph" run={centre} />
            <Btn label="Subheading" title="Make this line a subheading, or back to normal" run={subheading} />
            <Btn label="List" title="Bullet list" run={() => cmd("insertUnorderedList")} />
            <Btn label="Unlink" title="Remove link" run={() => cmd("unlink")} />
          </>
        ) : (
          <>
            <Btn label="Heading" title="Heading" run={() => cmd("formatBlock", "h2")} />
            <Btn label="Text" title="Normal paragraph" run={() => cmd("formatBlock", "p")} />
            <Btn label="List" title="Bullet list" run={() => cmd("insertUnorderedList")} />
            <Btn label="Quote" title="Quote" run={() => cmd("formatBlock", "blockquote")} />
            <Btn label="Unlink" title="Remove link" run={() => cmd("unlink")} />
          </>
        )}
        <Btn label="Clear" title="Clear formatting" run={() => { cmd("removeFormat"); cmd("formatBlock", "p"); currentBlock()?.removeAttribute("class"); sync(); }} />
      </div>
      {note && <p className="warn" role="status" style={{ margin: 8 }}>{note}</p>}
      <div
        ref={ref} className="rte-body prose" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={name}
        style={minHeight ? { minHeight } : undefined}
        onInput={sync}
        onBlur={sync}
        onPaste={(e) => {
          e.preventDefault();
          const html = e.clipboardData.getData("text/html");
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertHTML", false, html ? cleanPasted(html) : plainToHtml(text));
          if (ref.current) flatten(ref.current);
          sync();
        }}
        onDrop={(e) => {
          // Dragged-in text gets the same cleaning as pasted text.
          const html = e.dataTransfer.getData("text/html");
          const text = e.dataTransfer.getData("text/plain");
          if (!html && !text) return;
          e.preventDefault();
          const box = ref.current;
          const sel = getSelection();
          const pos = document.caretRangeFromPoint?.(e.clientX, e.clientY);
          if (box && pos && box.contains(pos.startContainer)) { sel?.removeAllRanges(); sel?.addRange(pos); }
          else if (box && !(sel?.anchorNode && box.contains(sel.anchorNode))) {
            box.focus(); const end = document.createRange(); end.selectNodeContents(box); end.collapse(false); sel?.removeAllRanges(); sel?.addRange(end);
          }
          document.execCommand("insertHTML", false, html ? cleanPasted(html) : plainToHtml(text));
          if (ref.current) flatten(ref.current);
          sync();
        }}
      />
      <input ref={hidden} type="hidden" name={name} />
    </div>
  );
}
