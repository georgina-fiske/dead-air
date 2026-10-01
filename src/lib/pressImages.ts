import "server-only";
import dns from "node:dns/promises";
import net from "node:net";
import { saveImage } from "@/lib/media";
import { imageSources } from "@/lib/richText";

const MAX_IMAGES = 12;
const MAX_BYTES = 12 * 1024 * 1024;

export function isPublicIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10 || a === 127 || a === 0 || a >= 224) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false;
    return true;
  }
  const v = ip.toLowerCase();
  if (v === "::1" || v === "::" || v.startsWith("fe8") || v.startsWith("fe9") || v.startsWith("fea") || v.startsWith("feb") || v.startsWith("fc") || v.startsWith("fd")) return false;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(v);
  return mapped ? isPublicIp(mapped[1]) : true;
}

// Downloads an image from a public https address. Refuses private networks.
export async function fetchImage(url: string): Promise<Buffer | null> {
  let current = url;
  for (let hop = 0; hop < 4; hop++) {
    const u = new URL(current);
    if (u.protocol !== "https:") return null;
    const addrs = await dns.lookup(u.hostname, { all: true });
    if (addrs.length === 0 || addrs.some((a) => !isPublicIp(a.address))) return null;
    const res = await fetch(u, { redirect: "manual", signal: AbortSignal.timeout(8000), headers: { "user-agent": "DeadAirBot/1.0" } });
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      current = new URL(res.headers.get("location")!, u).toString();
      continue;
    }
    if (!res.ok || !res.body) return null;
    if (!(res.headers.get("content-type") ?? "").startsWith("image/")) return null;
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES) return null;
    const chunks: Uint8Array[] = [];
    let total = 0;
    for await (const c of res.body as unknown as AsyncIterable<Uint8Array>) {
      total += c.length;
      if (total > MAX_BYTES) return null;
      chunks.push(c);
    }
    return Buffer.concat(chunks);
  }
  return null;
}

// Copies outside images into the Media library and points the release at our copy.
export async function importImages(
  html: string,
  deps: { fetch: (url: string) => Promise<Buffer | null>; save: (name: string, data: Buffer) => Promise<{ id: string }> } = { fetch: fetchImage, save: saveImage },
): Promise<{ html: string; copied: number; failed: number }> {
  const srcs = [...new Set(imageSources(html))].filter((s) => /^https:/i.test(s)).slice(0, MAX_IMAGES);
  let out = html, copied = 0, failed = 0;
  for (const src of srcs) {
    try {
      const data = await deps.fetch(src);
      if (!data) { failed++; continue; }
      const name = decodeURIComponent(new URL(src).pathname.split("/").pop() || "press-image").slice(0, 120);
      const m = await deps.save(name, data);
      out = out.split(`src="${src.replace(/&/g, "&amp;")}"`).join(`src="/media/${m.id}"`).split(`src="${src}"`).join(`src="/media/${m.id}"`);
      copied++;
    } catch { failed++; }
  }
  return { html: out, copied, failed };
}
