import { describe, expect, it, vi } from "vitest";
import { htmlToText, sanitizeBody, textToHtml } from "@/lib/richText";

vi.mock("server-only", () => ({}));

describe("press release cleaning", () => {
  it("keeps links, bold, italics, headings, lists and quotes", () => {
    const out = sanitizeBody('<h1>Big news</h1><p>Hear <b>Driving</b> <i>now</i> on <a href="https://example.com/x">Spotify</a>.</p><ul><li>One</li></ul><blockquote>Wow</blockquote>');
    expect(out).toContain("<h2>Big news</h2>");
    expect(out).toContain("<strong>Driving</strong>");
    expect(out).toContain("<em>now</em>");
    expect(out).toContain('href="https://example.com/x"');
    expect(out).toContain("<li>One</li>");
    expect(out).toContain("<blockquote>Wow</blockquote>");
  });
  it("opens outside links safely", () => {
    const out = sanitizeBody('<a href="https://example.com">x</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });
  it("removes scripts, handlers, styles, iframes and javascript links", () => {
    const out = sanitizeBody('<script>alert(1)</script><p onclick="x()" style="color:red">Hi</p><iframe src="https://evil"></iframe><a href="javascript:alert(1)">bad</a><img src="x" onerror="alert(1)"><img src="https://ok.example/a.jpg" onerror="x()"><style>p{}</style>');
    expect(out).not.toMatch(/script|onclick|onerror|style|iframe|javascript:/i);
    expect(out).toContain("<p>Hi</p>");
    expect(out).toContain('src="https://ok.example/a.jpg"');
    expect(out).not.toContain('src="x"');
  });
  it("turns email layout tables into paragraphs and drops empty ones", () => {
    const out = sanitizeBody('<table><tr><td>First line</td></tr><tr><td>&nbsp;</td></tr><tr><td><div>Second line</div></td></tr></table>');
    expect(out).toContain("First line");
    expect(out).toContain("Second line");
    expect(out).not.toMatch(/<table|<td|<tr|<div/);
  });
  it("maps bold and italic spans from pasted pages", () => {
    const out = sanitizeBody('<span style="font-weight:700">Loud</span> <span style="font-style: italic">quiet</span>');
    expect(out).toContain("<strong>Loud</strong>");
    expect(out).toContain("<em>quiet</em>");
  });
  it("never changes the words", () => {
    const words = "We are proud to anounce our new single, Driving & more.";
    expect(htmlToText(sanitizeBody(`<p>${words.replace("&", "&amp;")}</p>`))).toBe(words);
  });
  it("makes plain text from html with paragraphs", () => {
    expect(htmlToText("<p>One</p><p>Two<br>three</p>")).toBe("One\n\nTwo\nthree");
  });
  it("shows old plain text as paragraphs", () => {
    expect(textToHtml("A <b>\n\nB")).toBe("<p>A &lt;b&gt;</p><p>B</p>");
  });
});

describe("press release images", () => {
  it("copies outside images into the library and rewrites the address", async () => {
    const { importImages } = await import("@/lib/pressImages");
    const html = '<p><img src="https://cdn.example/a.jpg?x=1&amp;y=2" alt=""></p><img src="/media/keep">';
    const r = await importImages(html, { fetch: async () => Buffer.from("x"), save: async () => ({ id: "NEW1" }) });
    expect(r.copied).toBe(1);
    expect(r.html).toContain('src="/media/NEW1"');
    expect(r.html).toContain('src="/media/keep"');
    expect(r.html).not.toContain("cdn.example");
  });
  it("counts images that could not be copied", async () => {
    const { importImages } = await import("@/lib/pressImages");
    const r = await importImages('<img src="https://cdn.example/a.jpg">', { fetch: async () => null, save: async () => ({ id: "x" }) });
    expect(r.failed).toBe(1);
  });
  it("refuses private network addresses", async () => {
    const { isPublicIp } = await import("@/lib/pressImages");
    for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.1", "172.16.5.5", "169.254.169.254", "::1", "fd00::1", "::ffff:10.0.0.1"]) expect(isPublicIp(ip)).toBe(false);
    for (const ip of ["8.8.8.8", "203.0.113.5", "2606:4700::1"]) expect(isPublicIp(ip)).toBe(true);
  });
});

describe("centred paragraphs", () => {
  it("keeps the centre class on paragraphs and subheadings, and no other class", () => {
    const out = sanitizeBody('<p class="ctr">Mid</p><h2 class="ctr">Head</h2><p class="evil big">Other</p><div class="ctr">Div</div>');
    expect(out).toContain('<p class="ctr">Mid</p>');
    expect(out).toContain('<h2 class="ctr">Head</h2>');
    expect(out).toContain("<p>Other</p>");
    expect(out).not.toMatch(/evil|big/);
  });
});
