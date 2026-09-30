import { describe, expect, it } from "vitest";
import { CATEGORIES, canPublish, computeTotal, isValidScore } from "@/lib/rubric";
import { rankArtists, sortReleases, type Scored } from "@/lib/ranked";
import { voiceCheck } from "@/lib/voice";

const mk = (artist: string, bias: number, rest: number, extra: Partial<Scored> = {}): Scored => ({
  slug: `${artist}-${bias}-${rest}`, artist, title: "T", type: "ALBUM",
  bias, craft: rest, nerve: 0, crowd: 0, replay: 0, total: bias + rest, ...extra,
});

describe("rubric", () => {
  it("adds up to 100", () => {
    expect(CATEGORIES.reduce((a, c) => a + c.max, 0)).toBe(100);
  });
  it("computes the total from the five parts", () => {
    expect(computeTotal({ bias: 20, craft: 19, nerve: 12, crowd: 11, replay: 9 })).toBe(71);
  });
  it("accepts whole numbers in range only", () => {
    expect(isValidScore("bias", 25)).toBe(true);
    expect(isValidScore("bias", 26)).toBe(false);
    expect(isValidScore("craft", 30)).toBe(true);
    expect(isValidScore("nerve", 15.5)).toBe(false);
    expect(isValidScore("crowd", -1)).toBe(false);
  });
  it("cannot publish without all five scores", () => {
    expect(canPublish({ bias: 1, craft: 1, nerve: 1, crowd: 1, replay: null })).toBe(false);
    expect(canPublish({ bias: 1, craft: 1, nerve: 1, crowd: 1, replay: 0 })).toBe(true);
  });
});

describe("ranked", () => {
  it("ties go to the higher Bias", () => {
    const out = sortReleases([mk("A", 10, 60), mk("B", 20, 50)]);
    expect(out.map((r) => r.artist)).toEqual(["B", "A"]);
  });
  it("sorts by a single category", () => {
    const a = mk("A", 5, 0, { nerve: 14, total: 60 });
    const b = mk("B", 5, 0, { nerve: 3, total: 90 });
    expect(sortReleases([b, a], "nerve")[0].artist).toBe("A");
  });
  it("ranks only artists with 2 or more scored releases, by average", () => {
    const out = rankArtists([mk("A", 0, 70), mk("A", 0, 80), mk("B", 0, 99), mk("C", 0, 60), mk("C", 0, 50)]);
    expect(out).toEqual([
      { artist: "A", count: 2, average: 75 },
      { artist: "C", count: 2, average: 55 },
    ]);
  });
});

describe("voice check", () => {
  it("flags the listed words, dashes, exclamation marks and long sentences", () => {
    const kinds = voiceCheck("A stunning journey — wow! " + "word ".repeat(30) + ".").map((f) => f.kind);
    expect(kinds).toEqual(expect.arrayContaining(["word", "dash", "exclaim", "long"]));
  });
  it("flags lists of three and not X, it's Y", () => {
    const kinds = voiceCheck("Raw, honest and real. It's not a song, it's a feeling.").map((f) => f.kind);
    expect(kinds).toEqual(expect.arrayContaining(["three", "notxy"]));
  });
  it("leaves a clean line alone", () => {
    expect(voiceCheck("Loud, sloppy and mostly in tune.").filter((f) => f.kind !== "three")).toEqual([]);
  });
});

import { normDate, readReleases } from "@/lib/csv";

describe("csv import", () => {
  it("reads rows, quotes and Australian dates", () => {
    const rows = readReleases('artist,title,type,date,label\n"Band, The","Say ""Hi""",album,16/10/2026,Lbl\nB,C,Single,2026-01-02,\n');
    expect(rows[0]).toMatchObject({ artist: "Band, The", title: 'Say "Hi"', type: "ALBUM", date: "2026-10-16", label: "Lbl" });
    expect(rows[1]).toMatchObject({ type: "SINGLE", date: "2026-01-02" });
  });
  it("flags bad rows without stopping", () => {
    const rows = readReleases("A,B,podcast,2026-01-01\nA,B,ep,31/02/2026\n,X,ep,");
    expect(rows.map((r) => !!r.error)).toEqual([true, true, true]);
  });
  it("rejects impossible dates", () => {
    expect(normDate("31/02/2026")).toBeNull();
    expect(normDate("")).toBe("");
  });
});
