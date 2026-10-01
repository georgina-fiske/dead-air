// Press release text rules. Text is stored exactly as typed. These rules only decide how it is shown.
//   blank line        new paragraph
//   [words](https://x) a link (only http and https). Bare web addresses become links too.
//   "## " first        a subheading
//   ">> " first        a centred paragraph
export type Inline = { link: false; text: string } | { link: true; text: string; url: string };
export type Block = { kind: "p" | "h"; centre: boolean; lines: Inline[][] };

export function safeUrl(raw: string): string | null {
  const u = (raw ?? "").trim();
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:" ? u : null;
  } catch {
    return null;
  }
}

const TOKEN = /\[([^\]\n]+)\]\(([^)\s]+)\)|https?:\/\/[^\s<>"')\]]*[^\s<>"')\].,;:!?]/g;

export function parseInline(line: string): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const i = m.index ?? 0;
    if (i > last) out.push({ link: false, text: line.slice(last, i) });
    if (m[1] !== undefined) {
      const url = safeUrl(m[2]);
      out.push(url ? { link: true, text: m[1], url } : { link: false, text: m[1] });
    } else {
      out.push({ link: true, text: m[0], url: m[0] });
    }
    last = i + m[0].length;
  }
  if (last < line.length) out.push({ link: false, text: line.slice(last) });
  return out;
}

export function parseBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  for (const chunk of (text ?? "").replace(/\r\n/g, "\n").split(/\n[ \t]*\n/)) {
    if (!chunk.trim()) continue;
    const lines = chunk.split("\n");
    let first = lines[0].replace(/^\s+/, "");
    let centre = false, kind: "p" | "h" = "p";
    for (let i = 0; i < 2; i++) {
      if (first.startsWith(">> ")) { centre = true; first = first.slice(3); }
      else if (first.startsWith("## ")) { kind = "h"; first = first.slice(3); }
    }
    const all = [first, ...lines.slice(1)];
    if (!all.join("").trim()) continue;
    blocks.push({ kind, centre, lines: all.map(parseInline) });
  }
  return blocks;
}

// Plain words only (for search and the saved plain-text copy).
export function stripMarkup(text: string): string {
  return parseBlocks(text).map((b) => b.lines.map((l) => l.map((x) => x.text).join("")).join("\n")).join("\n\n");
}

export type LinkButton = { label: string; url: string; iconId: string };
export type TriviaItem = { question: string; answer: string };

// Only buttons with a label and an http or https address survive.
export function normalizeLinks(input: unknown): LinkButton[] {
  if (!Array.isArray(input)) return [];
  const out: LinkButton[] = [];
  for (const r of input) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const label = String(o.label ?? "").trim().slice(0, 60);
    const url = safeUrl(String(o.url ?? ""));
    if (label && url) out.push({ label, url, iconId: String(o.iconId ?? "") });
  }
  return out.slice(0, 12);
}

export function normalizeTrivia(input: unknown): TriviaItem[] {
  if (!Array.isArray(input)) return [];
  const out: TriviaItem[] = [];
  for (const r of input) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const question = String(o.question ?? ""), answer = String(o.answer ?? "");
    if (question.trim() && answer.trim()) out.push({ question, answer });
  }
  return out.slice(0, 3);
}

// Turns the older text markers into HTML, so an older press release can be edited in the formatting editor.
export function markupToHtml(text: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return parseBlocks(text).map((b) => {
    const inner = b.lines.map((line) => line.map((x) => (x.link ? `<a href="${esc(x.url)}">${esc(x.text)}</a>` : esc(x.text))).join("")).join("<br>");
    const tag = b.kind === "h" ? "h2" : "p";
    return `<${tag}${b.centre ? ' class="ctr"' : ""}>${inner}</${tag}>`;
  }).join("");
}
