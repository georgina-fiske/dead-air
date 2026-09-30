import "server-only";
import { cookies, headers } from "next/headers";
import { after } from "next/server";
import { db } from "@/lib/db";
import { BOT, deviceClass, hashes, referrerHost } from "@/lib/analyticsCore";

export const SKIP_COOKIE = "da_skip"; // only ever set in the admin's own browser

export type Tracked = { contentType: string; contentId?: string | null };

// Call from a public page. Reads what it needs now, writes after the response is sent.
export async function track(path: string, t: Tracked) {
  try {
    const h = await headers();
    if (h.get("dnt") === "1" || h.get("sec-gpc") === "1") return;
    if (h.get("next-router-prefetch") || h.get("purpose") === "prefetch" || h.get("sec-purpose")?.includes("prefetch")) return;
    const ua = h.get("user-agent") ?? "";
    if (!ua || BOT.test(ua)) return;
    if ((await cookies()).get(SKIP_COOKIE)) return;
    const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "").trim();
    const { sessionHash, weekHash } = hashes(ip, ua);
    const referrer = referrerHost(h.get("referer"), h.get("host"));
    let country: string | null = null, region: string | null = null;
    if (ip) {
      const { default: geoip } = await import("geoip-lite");
      const g = geoip.lookup(ip);
      country = g?.country ?? null;
      region = g?.region || null;
    }
    const row = { path: path.slice(0, 200), contentType: t.contentType, contentId: t.contentId ?? null, referrer, country, region, device: deviceClass(ua), sessionHash, weekHash };
    after(async () => { try { await db.pageView.create({ data: row }); } catch { /* never break a page over a stat */ } });
  } catch { /* same */ }
}
