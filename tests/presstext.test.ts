import { describe, expect, it } from "vitest";
import { normalizeLinks, normalizeTrivia, parseBlocks, safeUrl, stripMarkup } from "@/lib/pressText";

describe("press release text", () => {
  it("starts a new paragraph at a blank line and keeps single line breaks", () => {
    const b = parseBlocks("One\nstill one\n\nTwo");
    expect(b).toHaveLength(2);
    expect(b[0].lines).toHaveLength(2);
  });
  it("makes [words](address) a link, anywhere in the text", () => {
    const [b] = parseBlocks("Hear [the single](https://example.com/x) now, and [the video](http://example.com/v).");
    const links = b.lines[0].filter((x) => x.link);
    expect(links.map((l) => l.link && l.url)).toEqual(["https://example.com/x", "http://example.com/v"]);
  });
  it("turns bare web addresses into links without the trailing full stop", () => {
    const [b] = parseBlocks("Go to https://example.com/page.");
    const l = b.lines[0].find((x) => x.link);
    expect(l && l.link && l.url).toBe("https://example.com/page");
  });
  it("only allows http and https links", () => {
    const [b] = parseBlocks("[bad](javascript:alert(1)) [mail](mailto:a@b.com) [file](data:text/html,x) [ok](https://ok.com)");
    expect(b.lines[0].filter((x) => x.link).map((l) => l.link && l.url)).toEqual(["https://ok.com"]);
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("ftp://x.com")).toBeNull();
    expect(safeUrl("https://x.com")).toBe("https://x.com");
  });
  it("reads subheading and centre markers", () => {
    const b = parseBlocks("## The story\n\n>> Centred line\n\n>> ## Both");
    expect(b[0]).toMatchObject({ kind: "h", centre: false });
    expect(b[1]).toMatchObject({ kind: "p", centre: true });
    expect(b[2]).toMatchObject({ kind: "h", centre: true });
  });
  it("gives the plain words back without markers", () => {
    expect(stripMarkup("## Hi\n\n>> Hear [it](https://a.com) now")).toBe("Hi\n\nHear it now");
  });
  it("keeps only link buttons with a label and an http or https address", () => {
    const out = normalizeLinks([{ label: "Listen", url: "https://x.com", iconId: "a" }, { label: "Bad", url: "javascript:1" }, { label: "", url: "https://y.com" }, { label: "NoIcon", url: "http://z.com" }]);
    expect(out.map((x) => x.label)).toEqual(["Listen", "NoIcon"]);
  });
  it("keeps at most three complete trivia questions", () => {
    const t = normalizeTrivia([1, 2, 3, 4].map((n) => ({ question: `Q${n}`, answer: `A${n}` })).concat([{ question: "half", answer: "" }]));
    expect(t).toHaveLength(3);
  });
});

import { markupToHtml } from "@/lib/pressText";
describe("older text markers become html", () => {
  it("keeps links, subheadings and centred paragraphs", () => {
    const html = markupToHtml("## Head\n\n>> Mid [link](https://a.com) <b>\n\nPlain");
    expect(html).toContain("<h2>Head</h2>");
    expect(html).toContain('<p class="ctr">Mid <a href="https://a.com">link</a> &lt;b&gt;</p>');
    expect(html).toContain("<p>Plain</p>");
  });
});
