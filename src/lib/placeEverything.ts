// "Place everything": turns a pasted press release, a few photos and a list of links into the press release layout.
// One reusable function. The same function will later run on press release emails.
// It decides, it does not save. It also writes down every decision in plain words (notes) so they can be checked.
import { parseDocument } from "htmlparser2";
import { getOuterHTML, textContent } from "domutils";
import type { ChildNode, Element } from "domhandler";
import { sanitizeBody } from "@/lib/richText";
import { safeUrl } from "@/lib/pressText";

export type PlaceInput = {
  artist: string;
  title: string;
  creditTyped?: string;
  // The press release exactly as it came. Plain text, or HTML (a pasted web page or an email).
  text: { kind: "text" | "html"; value: string };
  linksText: string;
  photoIds: string[]; // in the order they were added
  icons: { id: string; name: string }[];
};

export type LinkKind = "presave" | "video" | "listen" | "tickets" | "website" | "social";
export type PlacedLink = { label: string; url: string; iconId: string; kind: LinkKind; service: string };
export type Note = { text: string; kind: "info" | "warn" };

export type PlaceResult = {
  headline: string; // "" means: the page uses Artist - Title
  spotlight: string; // html
  story1: string; // html, before photo 2
  story2: string; // html, after photo 2
  photo1Id: string | null;
  photo2Id: string | null;
  credit: string;
  alt: string;
  links: PlacedLink[];
  notes: Note[];
};

// ---------- paragraphs ----------

type Line = { html: string; text: string };
type Para = { kind: "p" | "block"; lines: Line[]; raw?: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const plainLine = (s: string): Line => ({
  text: s.trim(),
  html: esc(s.trim()).replace(/\bhttps?:\/\/[^\s<>"']*[^\s<>"'.,;:!?)]/g, (u) => `<a href="${u}">${u}</a>`),
});

// Paragraphs split on blank lines. If there are no blank lines, each line is a paragraph.
export function plainParas(text: string): Para[] {
  const t = text.replace(/\r\n?/g, "\n").trim();
  if (!t) return [];
  const chunks = /\n[ \t]*\n/.test(t) ? t.split(/\n[ \t]*\n/) : t.split("\n");
  return chunks
    .map((c) => c.split("\n").map((l) => l.trim()).filter(Boolean).map(plainLine))
    .filter((lines) => lines.length)
    .map((lines) => ({ kind: "p" as const, lines }));
}

function splitOnBr(nodes: ChildNode[]): Line[] {
  const lines: Line[] = [];
  let cur: ChildNode[] = [];
  const flush = () => {
    const html = getOuterHTML(cur).trim(), text = textContent(cur).replace(/\s+/g, " ").trim();
    if (text) lines.push({ html, text });
    cur = [];
  };
  for (const n of nodes) { if ((n as Element).name === "br") flush(); else cur.push(n); }
  flush();
  return lines;
}

export function htmlParas(html: string): Para[] {
  const doc = parseDocument(sanitizeBody(html));
  const paras: Para[] = [];
  let loose: ChildNode[] = [];
  const flushLoose = () => {
    const lines = splitOnBr(loose);
    if (lines.length) paras.push({ kind: "p", lines });
    loose = [];
  };
  for (const n of doc.children) {
    const name = (n as Element).name;
    if (name === "p" || name === "h2" || name === "h3" || name === "h4") {
      flushLoose();
      const el = n as Element;
      const lines = splitOnBr(el.children);
      if (!lines.length) continue;
      // A subheading stays a subheading.
      if (name !== "p") paras.push({ kind: "block", lines, raw: getOuterHTML(el) });
      else paras.push({ kind: "p", lines });
    } else if (name === "ul" || name === "ol" || name === "blockquote") {
      flushLoose();
      const text = textContent(n).replace(/\s+/g, " ").trim();
      if (text) paras.push({ kind: "block", lines: [{ html: "", text }], raw: getOuterHTML(n) });
    } else if (name === "br") {
      flushLoose();
    } else {
      loose.push(n);
    }
  }
  flushLoose();
  // No separate paragraphs, just one block with line breaks: each line is a paragraph.
  if (paras.length === 1 && paras[0].kind === "p" && paras[0].lines.length > 1) {
    return paras[0].lines.map((l) => ({ kind: "p" as const, lines: [l] }));
  }
  return paras;
}

const paraText = (p: Para) => p.lines.map((l) => l.text).join(" ");
const paraHtml = (p: Para) => (p.kind === "block" && p.raw ? p.raw : `<p>${p.lines.map((l) => l.html).join("<br>")}</p>`);

// ---------- photo credit ----------

// "Photo: Name", "Photo by Name", "Photo credit: Name", "Credit: Name" ...
const CREDIT = /^\s*(?:photo(?:graph(?:y|er)?)?|image|pic|credit|credits)(?:\s+(?:credit|by))?\s*(?:by\s+|[:\-\u2013\u2014]\s*)\s*(.{2,80}?)\s*$/i;

function extractCredit(paras: Para[]): { paras: Para[]; credit: string; line: string } {
  let credit = "", found = "";
  const out: Para[] = [];
  for (const p of paras) {
    if (p.kind !== "p") { out.push(p); continue; }
    const keep: Line[] = [];
    for (const l of p.lines) {
      const m = l.text.length <= 100 ? CREDIT.exec(l.text) : null;
      if (m) { if (!credit) { credit = m[1].replace(/[.\s]+$/, ""); found = l.text; } }
      else keep.push(l);
    }
    if (keep.length) out.push({ ...p, lines: keep });
  }
  return { paras: out, credit, line: found };
}

// ---------- links ----------

const SERVICES: [RegExp, string][] = [
  [/(^|\.)spotify\.com$|(^|\.)spotify\.link$|tospotify\.com$/, "Spotify"],
  [/^music\.youtube\.com$/, "YouTube Music"],
  [/(^|\.)music\.apple\.com$|(^|\.)itunes\.apple\.com$/, "Apple Music"],
  [/(^|\.)bandcamp\.com$/, "Bandcamp"],
  [/(^|\.)soundcloud\.com$|^on\.soundcloud\.com$/, "SoundCloud"],
  [/(^|\.)tidal\.com$/, "Tidal"],
  [/(^|\.)deezer\.com$|^deezer\.page\.link$/, "Deezer"],
  [/(^|\.)music\.amazon\.[a-z.]+$/, "Amazon Music"],
  [/(^|\.)audiomack\.com$/, "Audiomack"],
  [/(^|\.)napster\.com$/, "Napster"],
  [/(^|\.)qobuz\.com$/, "Qobuz"],
  [/(^|\.)(song\.link|album\.link|odesli\.co|songwhip\.com)$/, "Listen"],
];
const SOCIAL: [RegExp, string][] = [
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, "Facebook"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(twitter\.com|x\.com|t\.co)$/, "X"],
];
const TICKETS = /(^|\.)(ticketek|ticketmaster|oztix|moshtix|eventbrite|humanitix|dice|ticketbooth|ticketlink|tixel|trybooking|ticketmaster)\.[a-z.]+$|tickets?\./;
const VIDEO = /(^|\.)(youtube\.com|youtu\.be|vimeo\.com)$/;
const PRESAVE = /presave|pre-save|feature\.fm|ffm\.to|hyperfollow|toneden/;

export function classifyLink(rawUrl: string, typedLabel = ""): { kind: LinkKind; service: string; defaultLabel: string } {
  let host = "", full = rawUrl.toLowerCase();
  try { const u = new URL(rawUrl); host = u.hostname.replace(/^www\./, "").toLowerCase(); full = (host + u.pathname + u.search).toLowerCase(); } catch { /* keep raw */ }
  if (PRESAVE.test(full) || /pre-?save/i.test(typedLabel)) return { kind: "presave", service: "", defaultLabel: "Pre-save" };
  for (const [re, name] of SOCIAL) if (re.test(host)) return { kind: "social", service: name, defaultLabel: name };
  const listen = SERVICES.find(([re]) => re.test(host));
  if (listen) return { kind: "listen", service: listen[1], defaultLabel: listen[1] };
  if (VIDEO.test(host)) return { kind: "video", service: host.includes("vimeo") ? "Vimeo" : "YouTube", defaultLabel: "Watch video" };
  if (TICKETS.test(host)) return { kind: "tickets", service: "", defaultLabel: "Tickets" };
  return { kind: "website", service: "", defaultLabel: "Website" };
}

const ORDER: Record<LinkKind, number> = { presave: 0, video: 1, listen: 2, tickets: 3, website: 4, social: 5 };

function normUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const keep = [...u.searchParams.entries()].filter(([k]) => !/^(utm_|fbclid|igshid|si$)/i.test(k));
    return `${u.hostname.replace(/^www\./, "").toLowerCase()}${u.pathname.replace(/\/+$/, "")}${keep.length ? "?" + keep.map(([k, v]) => `${k}=${v}`).join("&") : ""}`;
  } catch { return raw.toLowerCase(); }
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
function pickIcon(icons: { id: string; name: string }[], tokens: string[]): string {
  for (const t of tokens.map(norm).filter((x) => x.length >= 3)) {
    const exact = icons.find((i) => norm(i.name) === t);
    if (exact) return exact.id;
  }
  for (const t of tokens.map(norm).filter((x) => x.length >= 3)) {
    const part = icons.find((i) => { const n = norm(i.name); return n.length >= 3 && (n.includes(t) || t.includes(n)); });
    if (part) return part.id;
  }
  return "";
}

export function parseLinks(text: string, icons: { id: string; name: string }[]): { links: PlacedLink[]; skipped: string[]; duplicates: string[] } {
  const found: (PlacedLink & { n: number })[] = [];
  const skipped: string[] = [], duplicates: string[] = [];
  const seen = new Set<string>();
  let n = 0;
  for (const rawLine of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const matches = [...line.matchAll(/(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi)];
    if (!matches.length) { skipped.push(line); continue; }
    const first = matches[0];
    const clean = (s: string) => s.replace(/^[\s\-*\u2022>]+/, "").replace(/[\s:\u2013\u2014\-|=>]+$/, "").trim();
    let typed = clean(line.slice(0, first.index));
    if (!typed) { const after = clean(line.slice((first.index ?? 0) + first[0].length)); if (after && !/https?:|www\./i.test(after)) typed = after; }
    matches.forEach((m, i) => {
      let u = m[0].replace(/[.,;:!?)\]]+$/, "");
      if (/^www\./i.test(u)) u = `https://${u}`;
      if (!safeUrl(u)) { skipped.push(line); return; }
      const key = normUrl(u);
      if (seen.has(key)) { duplicates.push(u); return; }
      seen.add(key);
      const label = i === 0 ? typed : "";
      const c = classifyLink(u, label);
      const buttonLabel = label || c.defaultLabel;
      const iconId = pickIcon(icons, [buttonLabel, c.service, c.defaultLabel]);
      found.push({ label: buttonLabel, url: u, iconId, kind: c.kind, service: c.service, n: n++ });
    });
  }
  found.sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.n - b.n);
  return { links: found.map(({ n: _n, ...l }) => { void _n; return l; }), skipped, duplicates };
}

// ---------- the function ----------

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "\u2026" : s);

export function placeEverything(input: PlaceInput): PlaceResult {
  const notes: Note[] = [];
  const info = (text: string) => notes.push({ text, kind: "info" });
  const warn = (text: string) => notes.push({ text, kind: "warn" });
  const artist = input.artist.trim(), title = input.title.trim();

  // 1. photos
  const [photo1Id = null, photo2Id = null] = input.photoIds;
  const extra = input.photoIds.slice(2);
  if (!input.photoIds.length) warn("No photos were added.");
  else {
    info(photo2Id ? "Photo 1 is at the top. Photo 2 is between the two parts of the story." : "Photo 1 is at the top. There is no second photo.");
    if (extra.length) warn(`${extra.length} extra photo${extra.length === 1 ? " was" : "s were"} not used (photo${extra.length === 1 ? "" : "s"} ${extra.map((_, i) => i + 3).join(", ")}). Only two photos fit on the page.`);
  }

  // 3 (first look). paragraphs, then 2. credit comes out of the text
  let paras = input.text.kind === "html" ? htmlParas(input.text.value) : plainParas(input.text.value);
  const credit = extractCredit(paras);
  paras = credit.paras;

  // 2. credit
  let creditText = (input.creditTyped ?? "").trim();
  if (creditText) {
    info(`Photo credit: "${creditText}" (typed by you).${credit.line ? ` A credit line in the text ("${clip(credit.line, 60)}") was also taken out of the story.` : ""}`);
  } else if (credit.credit) {
    creditText = credit.credit;
    info(`Photo credit: "${creditText}" (found in the text as "${clip(credit.line, 60)}"). That line was taken out of the story.`);
  } else if (input.photoIds.length) {
    warn("No photo credit was typed or found in the text. The photos have no credit line.");
  }

  // 3. paragraphs
  info(`${paras.length} paragraph${paras.length === 1 ? "" : "s"} found in the text.`);

  // 4. headline
  let headline = "";
  if (paras.length) {
    const first = paras[0];
    const t = paraText(first);
    const why =
      paras.length < 4 ? `there are only ${paras.length} paragraphs (it needs 4 or more)`
      : first.kind !== "p" && first.kind !== "block" ? "it is not a plain paragraph"
      : first.kind === "block" && !/^<h[2-4]/i.test(first.raw ?? "") ? "it is a list or quote"
      : first.lines.length > 1 ? "it runs over more than one line"
      : t.length > 140 ? `it is ${t.length} characters (the limit is 140)`
      : /\.$/.test(t) ? "it ends with a full stop"
      : "";
    if (!why) { headline = t; paras = paras.slice(1); info(`Headline: "${clip(headline, 100)}" (the first paragraph is short, one line, with no full stop).`); }
    else info(`No headline found: ${why}. The page will use "${artist} \u2013 ${title}".`);
  } else {
    warn("The text was empty, so there is no headline, spotlight or story.");
  }

  // 5. spotlight, 6. story
  const spotlight = paras[0] ? paraHtml(paras[0]) : "";
  if (paras[0]) info(`Spotlight: "${clip(paraText(paras[0]), 90)}".`);
  const s1 = paras.slice(1, 3), s2 = paras.slice(3);
  if (paras.length) {
    info(`Story: ${s1.length} paragraph${s1.length === 1 ? "" : "s"} before photo 2 and ${s2.length} after it.`);
    if (!photo2Id) info("With no second photo, the two parts of the story run one after the other.");
  }

  // 7. links
  const parsed = parseLinks(input.linksText, input.icons);
  if (!parsed.links.length && !parsed.skipped.length) info("No links were added, so there are no buttons.");
  for (const l of parsed.links) {
    const host = (() => { try { return new URL(l.url).hostname.replace(/^www\./, ""); } catch { return l.url; } })();
    const typeName = { presave: "Pre-save", video: "Watch video", listen: "Listen", tickets: "Tickets", website: "Website", social: "Social" }[l.kind];
    info(`Button "${l.label}" is type ${typeName}${l.service && l.service !== l.label ? ` (${l.service})` : ""}: ${host}.`);
  }
  for (const d of parsed.duplicates) info(`Duplicate link left out: ${d}`);
  for (const s of parsed.skipped) warn(`Left out, no web address on this line: "${clip(s, 80)}"`);

  // 8. icons
  const noIcon = parsed.links.filter((l) => !l.iconId).map((l) => l.label);
  if (parsed.links.length) {
    if (!input.icons.length) warn("There are no icons in the Icons library yet, so no buttons have an icon.");
    else if (noIcon.length) warn(`No matching icon yet for: ${noIcon.join(", ")}. Add them on the Icons tab.`);
    else info("Every button got an icon from the Icons library.");
  }

  // 9. alt text
  const alt = `Photo of ${artist}`;
  if (input.photoIds.length) info(`Alt text for the photos is "${alt}". Change it in the editor if you want it more specific.`);

  return {
    headline,
    spotlight,
    story1: s1.map(paraHtml).join(""),
    story2: s2.map(paraHtml).join(""),
    photo1Id, photo2Id,
    credit: creditText, alt,
    links: parsed.links,
    notes,
  };
}
