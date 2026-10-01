import { describe, expect, it, vi } from "vitest";
import { classifyLink, parseLinks, placeEverything, plainParas } from "@/lib/placeEverything";

vi.mock("server-only", () => ({}));

const base = { artist: "Grace Robinson", title: "Driving", linksText: "", photoIds: [] as string[], icons: [] as { id: string; name: string }[] };
const plain = (value: string) => ({ kind: "text" as const, value });
const five = ["Grace Robinson drops new single Driving", "Spotlight paragraph here.", "Story one.", "Story two.", "Story three.", "Story four."].join("\n\n");

describe("paragraphs", () => {
  it("splits on blank lines", () => expect(plainParas("a\nb\n\nc")).toHaveLength(2));
  it("with no blank lines, each line is a paragraph", () => expect(plainParas("a\nb\nc")).toHaveLength(3));
});

describe("headline rule", () => {
  it("uses a short first paragraph as the headline when there are 4 or more paragraphs", () => {
    const r = placeEverything({ ...base, text: plain(five) });
    expect(r.headline).toBe("Grace Robinson drops new single Driving");
    expect(r.spotlight).toBe("<p>Spotlight paragraph here.</p>");
  });
  it("does not when there are fewer than 4 paragraphs", () => {
    const r = placeEverything({ ...base, text: plain("Short line\n\nSpot\n\nStory") });
    expect(r.headline).toBe("");
    expect(r.spotlight).toBe("<p>Short line</p>");
    expect(r.notes.some((n) => /only 3 paragraphs/.test(n.text))).toBe(true);
  });
  it("does not when it ends with a full stop, is over 140 characters, or runs over two lines", () => {
    expect(placeEverything({ ...base, text: plain("A headline.\n\nb\n\nc\n\nd") }).headline).toBe("");
    expect(placeEverything({ ...base, text: plain(`${"x".repeat(141)}\n\nb\n\nc\n\nd`) }).headline).toBe("");
    expect(placeEverything({ ...base, text: plain("Line one\nline two\n\nb\n\nc\n\nd") }).headline).toBe("");
    expect(placeEverything({ ...base, text: plain(`${"x".repeat(140)}\n\nb\n\nc\n\nd`) }).headline).toHaveLength(140);
  });
});

describe("story split", () => {
  it("puts the next two paragraphs before photo 2 and the rest after", () => {
    const r = placeEverything({ ...base, text: plain(five + "\n\nStory five.") });
    expect(r.story1).toBe("<p>Story one.</p><p>Story two.</p>");
    expect(r.story2).toBe("<p>Story three.</p><p>Story four.</p><p>Story five.</p>");
    expect(r.notes.some((n) => /2 paragraphs before photo 2 and 3 after/.test(n.text))).toBe(true);
  });
});

describe("photos", () => {
  it("uses the first two, ignores extras and says so", () => {
    const r = placeEverything({ ...base, text: plain(five), photoIds: ["a", "b", "c", "d"] });
    expect(r.photo1Id).toBe("a"); expect(r.photo2Id).toBe("b");
    expect(r.notes.some((n) => n.kind === "warn" && /2 extra photos were not used/.test(n.text))).toBe(true);
  });
  it("defaults alt text to Photo of {artist}", () => expect(placeEverything({ ...base, text: plain(five), photoIds: ["a"] }).alt).toBe("Photo of Grace Robinson"));
});

describe("photo credit", () => {
  it("uses the typed credit", () => {
    expect(placeEverything({ ...base, text: plain(five), photoIds: ["a"], creditTyped: " Sam Snap " }).credit).toBe("Sam Snap");
  });
  for (const [line, name] of [["Photo: Sam Snap", "Sam Snap"], ["Photo by Sam Snap", "Sam Snap"], ["Credit: Sam Snap", "Sam Snap"], ["Photo credit: Sam Snap", "Sam Snap"], ["photography by Sam Snap", "Sam Snap"]]) {
    it(`finds "${line}" in the text and removes that line`, () => {
      const r = placeEverything({ ...base, photoIds: ["a"], text: plain(`${five}\n\n${line}`) });
      expect(r.credit).toBe(name);
      expect(r.story2).not.toContain("Sam Snap");
      expect(r.story1 + r.story2 + r.spotlight).not.toMatch(/Photo|Credit/i);
    });
  }
  it("removes a credit line from inside a paragraph too", () => {
    const r = placeEverything({ ...base, photoIds: ["a"], text: plain(`${five.replace("Story four.", "Story four.\nPhoto: Sam Snap")}`) });
    expect(r.credit).toBe("Sam Snap");
    expect(r.story2).toBe("<p>Story three.</p><p>Story four.</p>");
  });
  it("typed credit wins, and the found line is still removed", () => {
    const r = placeEverything({ ...base, photoIds: ["a"], creditTyped: "Typed", text: plain(`${five}\n\nPhoto: Found Name`) });
    expect(r.credit).toBe("Typed"); expect(r.story2).not.toContain("Found");
  });
  it("does not mistake a normal sentence for a credit", () => {
    const r = placeEverything({ ...base, photoIds: ["a"], text: plain(`${five}\n\nThe band took a photo by the river and it went everywhere online this week for everyone.`) });
    expect(r.credit).toBe("");
  });
});

describe("links", () => {
  const icons = [{ id: "i1", name: "Spotify" }, { id: "i2", name: "Pre-save" }, { id: "i3", name: "Instagram" }];
  it("sorts them into the right types", () => {
    expect(classifyLink("https://open.spotify.com/track/1").kind).toBe("listen");
    expect(classifyLink("https://music.apple.com/au/album/x").service).toBe("Apple Music");
    expect(classifyLink("https://music.youtube.com/watch?v=1").service).toBe("YouTube Music");
    expect(classifyLink("https://www.youtube.com/watch?v=1").kind).toBe("video");
    expect(classifyLink("https://youtu.be/1").kind).toBe("video");
    expect(classifyLink("https://vimeo.com/1").kind).toBe("video");
    expect(classifyLink("https://ffm.to/driving").kind).toBe("presave");
    expect(classifyLink("https://band.hypeurl.com/presave").kind).toBe("presave");
    expect(classifyLink("https://distrokid.com/hyperfollow/x/y").kind).toBe("presave");
    expect(classifyLink("https://www.oztix.com.au/event/1").kind).toBe("tickets");
    expect(classifyLink("https://www.ticketek.com.au/x").kind).toBe("tickets");
    expect(classifyLink("https://dice.fm/event/x").kind).toBe("tickets");
    expect(classifyLink("https://events.humanitix.com/x").kind).toBe("tickets");
    expect(classifyLink("https://instagram.com/x").service).toBe("Instagram");
    expect(classifyLink("https://x.com/band").service).toBe("X");
    expect(classifyLink("https://band.com").kind).toBe("website");
  });
  it("uses the service name as the label for listen links, and a typed name when given", () => {
    const { links } = parseLinks("https://open.spotify.com/track/1\nStream it on Spotify: https://music.apple.com/x\nhttps://band.com", icons);
    expect(links.map((l) => l.label)).toEqual(["Spotify", "Stream it on Spotify", "Website"]);
    expect(links[1].kind).toBe("listen");
  });
  it("orders: Pre-save, Watch video, Listen, Tickets, Website, then socials", () => {
    const text = ["https://instagram.com/b", "https://band.com", "https://oztix.com.au/e", "https://open.spotify.com/t", "https://youtu.be/v", "https://ffm.to/p"].join("\n");
    expect(parseLinks(text, []).links.map((l) => l.kind)).toEqual(["presave", "video", "listen", "tickets", "website", "social"]);
  });
  it("drops duplicates", () => {
    const r = parseLinks("https://open.spotify.com/track/1\nhttps://open.spotify.com/track/1/?utm_source=x\nhttps://www.band.com/\nhttps://band.com", []);
    expect(r.links).toHaveLength(2); expect(r.duplicates).toHaveLength(2);
  });
  it("lists back lines with no web address and leaves them out", () => {
    const r = parseLinks("Listen on Spotify\nhttps://band.com\nwww.example.org\njust words", []);
    expect(r.skipped).toEqual(["Listen on Spotify", "just words"]);
    expect(r.links.map((l) => l.url)).toEqual(["https://band.com", "https://www.example.org"]);
  });
  it("matches icons on the button name or type and lists the ones with no icon", () => {
    const r = placeEverything({ ...base, text: plain(five), icons, linksText: "https://open.spotify.com/t\nhttps://ffm.to/p\nhttps://instagram.com/b\nhttps://youtu.be/v" });
    const by = Object.fromEntries(r.links.map((l) => [l.label, l.iconId]));
    expect(by["Spotify"]).toBe("i1"); expect(by["Pre-save"]).toBe("i2"); expect(by["Instagram"]).toBe("i3"); expect(by["Watch video"]).toBe("");
    expect(r.notes.some((n) => n.kind === "warn" && /No matching icon yet for: Watch video/.test(n.text))).toBe(true);
  });
  it("only allows http and https", () => {
    expect(parseLinks("javascript:alert(1)\nftp://x.com/f\nmailto:a@b.com", []).links).toHaveLength(0);
  });
});

describe("html source", () => {
  it("places a pasted web page the same way, keeping links and bold", () => {
    const html = "<p>Grace Robinson drops Driving</p><p>The <b>big</b> spotlight <a href=\"https://example.com/x\">link</a>.</p><p>One.</p><p>Two.</p><p>Three.</p><p>Photo by Sam Snap</p>";
    const r = placeEverything({ ...base, photoIds: ["a"], text: { kind: "html", value: html } });
    expect(r.headline).toBe("Grace Robinson drops Driving");
    expect(r.spotlight).toContain("<strong>big</strong>"); expect(r.spotlight).toContain('href="https://example.com/x"');
    expect(r.credit).toBe("Sam Snap");
    expect(r.story2).toBe("<p>Three.</p>");
  });
  it("splits one block of lines into paragraphs when there are no blank lines", () => {
    const r = placeEverything({ ...base, text: { kind: "html", value: "<p>Head<br>Spot<br>One<br>Two<br>Three</p>" } });
    expect(r.headline).toBe("Head"); expect(r.spotlight).toBe("<p>Spot</p>"); expect(r.story1).toBe("<p>One</p><p>Two</p>");
  });
});

describe("what I did", () => {
  it("explains the headline, spotlight, story split, credit, links and skipped lines in plain words", () => {
    const r = placeEverything({ ...base, photoIds: ["a", "b"], text: plain(`${five}\n\nPhoto by Sam Snap`), linksText: "https://open.spotify.com/t\nno link here" });
    const all = r.notes.map((n) => n.text).join(" | ");
    expect(all).toMatch(/Headline: "Grace Robinson drops new single Driving"/);
    expect(all).toMatch(/Spotlight: "Spotlight paragraph here."/);
    expect(all).toMatch(/Story: 2 paragraphs before photo 2 and 2 after it/);
    expect(all).toMatch(/Photo credit: "Sam Snap" \(found in the text/);
    expect(all).toMatch(/Button "Spotify" is type Listen/);
    expect(all).toMatch(/Left out, no web address on this line: "no link here"/);
  });
});
