import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { liveWhere } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const where = liveWhere();
  const [pr, iv, rv, op] = await Promise.all([
    db.pressRelease.findMany({ where, select: { slug: true, updatedAt: true } }),
    db.interview.findMany({ where, select: { slug: true, updatedAt: true } }),
    db.review.findMany({ where, select: { slug: true, updatedAt: true } }),
    db.opinion.findMany({ where, select: { slug: true, updatedAt: true } }),
  ]);
  const page = (path: string, rows: { slug: string; updatedAt: Date }[]) =>
    rows.map((r) => ({ url: `${base}${path}/${r.slug}`, lastModified: r.updatedAt }));
  return [
    { url: `${base}/` },
    ...["/incoming", "/off-air", "/rated", "/hot-air", "/ranked"].map((p) => ({ url: `${base}${p}` })),
    ...page("/incoming", pr), ...page("/off-air", iv), ...page("/rated", rv), ...page("/hot-air", op),
  ];
}
