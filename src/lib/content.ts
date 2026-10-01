import "server-only";
import { db } from "@/lib/db";
import { RUBRIC_VERSION } from "@/lib/rubric";
import type { Scored } from "@/lib/ranked";
import { sanitizeBody } from "@/lib/richText";

// Example content shows (tagged) until you set HIDE_EXAMPLES=1 on Railway.
const hideExamples = () => process.env.HIDE_EXAMPLES === "1";

// Live = published, or scheduled and the time has passed.
export function liveWhere() {
  const now = new Date();
  return {
    OR: [{ status: "PUBLISHED" as const }, { status: "SCHEDULED" as const, publishedAt: { lte: now } }],
    ...(hideExamples() ? { isExample: false } : {}),
  };
}

export const incomingList = (take?: number) =>
  db.pressRelease.findMany({
    where: liveWhere(), include: { release: true }, take,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });
export const incomingOne = (slug: string) =>
  db.pressRelease.findFirst({ where: { slug, ...liveWhere() }, include: { release: true } });

// Pasted formatting is cleaned again on the way out, so nothing unsafe can reach a visitor.
type InterviewRow = Awaited<ReturnType<typeof rawInterviews>>[number];
const rawInterviews = (take?: number) =>
  db.interview.findMany({ where: liveWhere(), include: { qa: { orderBy: { position: "asc" } } }, take, orderBy: [{ publishedAt: "desc" }] });
const cleanInterview = (i: InterviewRow) => ({ ...i, qa: i.qa.map((x) => ({ ...x, answerHtml: x.answerHtml ? sanitizeBody(x.answerHtml) : null })) });
export const interviewList = async (take?: number) => (await rawInterviews(take)).map(cleanInterview);
export const interviewOne = async (slug: string) => {
  const i = await db.interview.findFirst({ where: { slug, ...liveWhere() }, include: { qa: { orderBy: { position: "asc" } } } });
  return i ? cleanInterview(i) : null;
};

const cleanOpinion = <T extends { bodyHtml: string | null }>(o: T) => ({ ...o, html: o.bodyHtml ? sanitizeBody(o.bodyHtml) : null });
export const opinionList = async (take?: number) =>
  (await db.opinion.findMany({ where: liveWhere(), take, orderBy: [{ publishedAt: "desc" }] })).map(cleanOpinion);
export const opinionOne = async (slug: string) => {
  const o = await db.opinion.findFirst({ where: { slug, ...liveWhere() } });
  return o ? cleanOpinion(o) : null;
};

export const reviewList = (take?: number) =>
  db.review.findMany({ where: liveWhere(), include: { release: true }, take, orderBy: [{ publishedAt: "desc" }] });
export const reviewOne = (slug: string) =>
  db.review.findFirst({ where: { slug, ...liveWhere() }, include: { release: true } });

// Everything Ranked needs: live reviews with all five scores, current rubric only.
export async function scoredReviews(): Promise<Scored[]> {
  const rows = await db.review.findMany({
    where: {
      ...liveWhere(), rubricVersion: RUBRIC_VERSION,
      bias: { not: null }, craft: { not: null }, nerve: { not: null }, crowd: { not: null }, replay: { not: null }, total: { not: null },
    },
    include: { release: true },
  });
  return rows.map((r) => ({
    slug: r.slug, artist: r.release.artist, title: r.release.title, type: r.release.type,
    bias: r.bias!, craft: r.craft!, nerve: r.nerve!, crowd: r.crowd!, replay: r.replay!, total: r.total!,
  }));
}

type ReviewRow = Awaited<ReturnType<typeof reviewList>>[number];
export function reviewView(r: ReviewRow) {
  return {
    slug: r.slug, artist: r.release.artist, title: r.release.title, type: r.release.type,
    date: r.release.releaseDate, take: r.take, isFan: r.isFan, isExample: r.isExample,
    scores: { bias: r.bias, craft: r.craft, nerve: r.nerve, crowd: r.crowd, replay: r.replay },
    lines: { bias: r.biasLine, craft: r.craftLine, nerve: r.nerveLine, crowd: r.crowdLine, replay: r.replayLine },
    total: r.total, cover: r.release.coverId ? `/media/${r.release.coverId}` : null,
  };
}
