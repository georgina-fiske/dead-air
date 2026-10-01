import sanitizeHtml from "sanitize-html";
import { ALLOWED_TAGS } from "@/lib/richConfig";

const styleHas = (style: string | undefined, re: RegExp) => !!style && re.test(style);

// Cleans pasted HTML. The words are not touched. Only structure and safety.
export function sanitizeBody(html: string): string {
  const out = sanitizeHtml(html ?? "", {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ["href", "rel", "target"], img: ["src", "alt", "loading"], p: ["class"], h2: ["class"] },
    allowedClasses: { p: ["ctr"], h2: ["ctr"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["https"] },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    nonTextTags: ["style", "script", "textarea", "option", "noscript", "head", "title"],
    transformTags: {
      b: "strong", i: "em", h1: "h2", h5: "h4", h6: "h4",
      // Layout blocks from email pages become paragraphs. Empty ones are dropped below.
      div: "p", td: "p", th: "p", section: "p", article: "p", header: "p", footer: "p", center: "p",
      span: (tag, attribs) => {
        if (styleHas(attribs.style, /font-weight:\s*(bold|[6-9]00)/i)) return { tagName: "strong", attribs: {} };
        if (styleHas(attribs.style, /font-style:\s*italic/i)) return { tagName: "em", attribs: {} };
        return { tagName: "span", attribs: {} };
      },
      a: (tag, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:/i.test(href);
        return { tagName: "a", attribs: { href, ...(external ? { rel: "noopener noreferrer nofollow", target: "_blank" } : {}) } };
      },
      img: (tag, attribs) => ({ tagName: "img", attribs: { src: attribs.src ?? "", alt: attribs.alt ?? "", loading: "lazy" } }),
    },
    exclusiveFilter: (frame) => {
      if (frame.tag === "img") return !(/^https:\/\//i.test(frame.attribs.src ?? "") || /^\/media\/[\w-]+$/.test(frame.attribs.src ?? ""));
      if (frame.tag === "a" && !frame.attribs.href) return false;
      if (["p", "h2", "h3", "h4", "li", "blockquote"].includes(frame.tag)) return frame.text.trim() === "" && frame.mediaChildren.length === 0;
      return false;
    },
  });
  return out.replace(/<p>\s*<\/p>/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

const ENT: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

// Plain text of the release (for search, word checks and the "published" test).
export function htmlToText(html: string): string {
  const spaced = (html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-6]|li|blockquote|ul|ol)>/gi, (m) => `${m}\n\n`);
  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENT[m] ?? m);
  return text.split("\n").map((l) => l.trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Old plain-text releases: show them as paragraphs.
export function textToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
}

export function imageSources(html: string): string[] {
  return [...html.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1].replace(/&amp;/g, "&"));
}
