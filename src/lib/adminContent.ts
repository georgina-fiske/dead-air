import "server-only";
import type { Status } from "@/generated/prisma/enums";

export type FormState = { error?: string };

export const str = (f: FormData, k: string) => String(f.get(k) ?? "");
// Browsers send textarea line breaks as CRLF. Store LF. Nothing else is touched.
export const rawText = (f: FormData, k: string) => str(f, k).replace(/\r\n/g, "\n");

export function scoreField(f: FormData, k: string): number | null | "bad" {
  const v = str(f, k).trim();
  if (v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : "bad";
}

export function dateOnly(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return new Date(`${s}T00:00:00.000Z`);
}

// "2026-10-20T09:00" typed as Sydney time -> real moment.
export function sydneyToDate(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const offsetMin = (at: number) => {
    const part = new Intl.DateTimeFormat("en-AU", { timeZone: "Australia/Sydney", timeZoneName: "longOffset" })
      .formatToParts(new Date(at)).find((p) => p.type === "timeZoneName")?.value ?? "GMT+10:00";
    const o = /GMT([+-])(\d{2}):(\d{2})/.exec(part);
    return o ? (o[1] === "-" ? -1 : 1) * (+o[2] * 60 + +o[3]) : 600;
  };
  const first = guess - offsetMin(guess) * 60_000;
  return new Date(guess - offsetMin(first) * 60_000);
}

export type Prev = { status: Status; publishedAt: Date | null } | null;

export function resolveStatus(intent: string, scheduledAt: string, prev: Prev): { status: Status; publishedAt: Date | null } | { error: string } {
  switch (intent) {
    case "publish":
      return { status: "PUBLISHED", publishedAt: prev?.status === "PUBLISHED" && prev.publishedAt ? prev.publishedAt : new Date() };
    case "schedule": {
      const d = sydneyToDate(scheduledAt);
      if (!d) return { error: "Pick a date and time to schedule." };
      if (d <= new Date()) return { error: "That time has passed. Pick a time in the future." };
      return { status: "SCHEDULED", publishedAt: d };
    }
    case "unpublish":
      return { status: "DRAFT", publishedAt: null };
    default:
      return prev ? { status: prev.status, publishedAt: prev.publishedAt } : { status: "DRAFT", publishedAt: null };
  }
}

export const wantsLive = (intent: string) => intent === "publish" || intent === "schedule";
