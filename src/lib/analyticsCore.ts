import { createHash, createHmac } from "node:crypto";

// Privacy first. No cookies, no raw IPs stored, bots and admin visits ignored, Do Not Track respected.
export const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|monitor|uptime|pingdom|curl|wget|python|go-http|axios|node-fetch|okhttp|java\/|libwww|scrapy|httpclient|railway/i;

export function deviceClass(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|kindle|silk|playbook/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return "tablet";
  if (/mobi|iphone|ipod|android|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

function secret() {
  return process.env.ANALYTICS_SECRET || createHash("sha256").update(`da:${process.env.DATABASE_URL ?? "dev"}`).digest("hex");
}

// ISO-ish week key, so the salt rotates weekly.
export function weekKey(d: Date) {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-W${Math.ceil(((+t - +y0) / 86_400_000 + 1) / 7)}`;
}

export function hashes(ip: string, ua: string, now = new Date()) {
  const daily = createHmac("sha256", secret()).update(`d:${now.toISOString().slice(0, 10)}`).digest();
  const weekly = createHmac("sha256", secret()).update(`w:${weekKey(now)}`).digest();
  const who = `${ip}|${ua}`;
  return {
    sessionHash: createHmac("sha256", daily).update(who).digest("hex").slice(0, 24),
    weekHash: createHmac("sha256", weekly).update(who).digest("hex").slice(0, 24),
  };
}

// Reduce a referrer to its host. Own-site referrers become "(internal)".
export function referrerHost(ref: string | null, ownHost: string | null): string | null {
  if (!ref) return null;
  try {
    const h = new URL(ref).host.replace(/^www\./, "");
    if (ownHost && h === ownHost.replace(/^www\./, "")) return "(internal)";
    return h.slice(0, 100);
  } catch { return null; }
}

// Groups referrer hosts for the dashboard.
export function referrerGroup(host: string | null): string {
  if (!host) return "Direct";
  if (/(^|\.)instagram\.com$/.test(host)) return "Instagram";
  if (/(^|\.)google\./.test(host)) return "Google";
  if (/(^|\.)(facebook|fb)\.com$|^l\.facebook\.com$/.test(host)) return "Facebook";
  if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(host)) return "X";
  if (/(^|\.)(bing|duckduckgo|ecosia)\./.test(host)) return "Search";
  return host;
}
