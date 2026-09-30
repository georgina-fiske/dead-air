import { describe, expect, it } from "vitest";
import { BOT, deviceClass, hashes, referrerGroup, referrerHost, weekKey } from "@/lib/analyticsCore";

describe("analytics privacy", () => {
  it("hashes never contain the ip and are stable within a day", () => {
    const a = hashes("203.0.113.9", "Mozilla/5.0", new Date("2026-10-01T02:00:00Z"));
    const b = hashes("203.0.113.9", "Mozilla/5.0", new Date("2026-10-01T20:00:00Z"));
    expect(a.sessionHash).toBe(b.sessionHash);
    expect(JSON.stringify(a)).not.toContain("203.0.113.9");
  });
  it("the daily hash rotates each day, the weekly hash lasts the week", () => {
    const mon = hashes("203.0.113.9", "UA", new Date("2026-10-05T02:00:00Z"));
    const tue = hashes("203.0.113.9", "UA", new Date("2026-10-06T02:00:00Z"));
    const nextMon = hashes("203.0.113.9", "UA", new Date("2026-10-12T02:00:00Z"));
    expect(mon.sessionHash).not.toBe(tue.sessionHash);
    expect(mon.weekHash).toBe(tue.weekHash);
    expect(mon.weekHash).not.toBe(nextMon.weekHash);
    expect(weekKey(new Date("2026-10-05T00:00:00Z"))).toBe(weekKey(new Date("2026-10-11T00:00:00Z")));
  });
  it("tells different people apart", () => {
    expect(hashes("1.1.1.1", "UA").sessionHash).not.toBe(hashes("2.2.2.2", "UA").sessionHash);
  });
  it("spots bots", () => {
    for (const ua of ["Googlebot/2.1", "curl/8.0", "Mozilla/5.0 HeadlessChrome", "facebookexternalhit/1.1", "python-requests/2"]) expect(BOT.test(ua)).toBe(true);
    expect(BOT.test("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1")).toBe(false);
  });
  it("classes devices", () => {
    expect(deviceClass("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe("mobile");
    expect(deviceClass("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)")).toBe("tablet");
    expect(deviceClass("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120")).toBe("desktop");
  });
  it("reduces referrers to a host and groups the big ones", () => {
    expect(referrerHost("https://l.instagram.com/?u=abc", "deadair.com.au")).toBe("l.instagram.com");
    expect(referrerHost("https://deadair.com.au/rated", "deadair.com.au")).toBe("(internal)");
    expect(referrerHost(null, "x")).toBeNull();
    expect(referrerGroup("l.instagram.com")).toBe("Instagram");
    expect(referrerGroup("www.google.com.au")).toBe("Google");
    expect(referrerGroup(null)).toBe("Direct");
    expect(referrerGroup("triplej.abc.net.au")).toBe("triplej.abc.net.au");
  });
});
