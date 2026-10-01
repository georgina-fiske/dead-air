"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { dateOnly, str, type FormState } from "@/lib/adminContent";
import { placeEverything } from "@/lib/placeEverything";
import { htmlToText, sanitizeBody } from "@/lib/richText";
import { uniqueSlug } from "@/lib/slug";
import type { ReleaseType } from "@/generated/prisma/enums";

const todaySydney = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney" }).format(new Date());

// Builds a draft press release from the three boxes, then opens the editor. Nothing goes public.
export async function placeAction(_: FormState | undefined, f: FormData): Promise<FormState> {
  const u = await requireAdmin();
  const artist = str(f, "artist").trim(), title = str(f, "title").trim();
  if (!artist || !title) return { error: "Artist and release title are needed." };
  const text = sanitizeBody(str(f, "textHtml"));
  if (!htmlToText(text).trim()) return { error: "Paste the press release in box 2." };
  const type = ["SINGLE", "EP", "ALBUM", "LIVE_ALBUM"].includes(str(f, "type")) ? str(f, "type") : "SINGLE";

  // Photos must exist in the Media library. Keep the order they were added in.
  const wanted = f.getAll("photoId").map(String).filter(Boolean);
  const have = new Set((await db.mediaImage.findMany({ where: { id: { in: wanted } }, select: { id: true } })).map((m) => m.id));
  const photoIds = wanted.filter((id) => have.has(id));
  const icons = await db.pressIcon.findMany({ select: { id: true, name: true } });

  const r = placeEverything({
    artist, title, creditTyped: str(f, "credit"), text: { kind: "html", value: text },
    linksText: str(f, "links"), photoIds, icons,
  });

  const slug = await uniqueSlug(`${artist} ${title}`, async (s) => !!(await db.release.findUnique({ where: { slug: s } })));
  const release = await db.release.create({
    data: {
      slug, artist, title, type: type as ReleaseType,
      releaseDate: dateOnly(str(f, "date")) ?? dateOnly(todaySydney()),
      label: str(f, "label").trim() || null,
    },
  });
  const spotlight = sanitizeBody(r.spotlight), story1 = sanitizeBody(r.story1), story2 = sanitizeBody(r.story2);
  const pr = await db.pressRelease.create({
    data: {
      slug: release.slug, releaseId: release.id, status: "DRAFT",
      structured: true, rich: true,
      headline: r.headline || null,
      photo1Id: r.photo1Id, photo1Credit: r.photo1Id ? r.credit || null : null, photo1Alt: r.photo1Id ? r.alt : null,
      photo2Id: r.photo2Id, photo2Credit: r.photo2Id ? r.credit || null : null, photo2Alt: r.photo2Id ? r.alt : null,
      spotlight, story1, story2,
      links: r.links.map((l) => ({ label: l.label, url: l.url, iconId: l.iconId })),
      trivia: [],
      body: [spotlight, story1, story2].map(htmlToText).filter(Boolean).join("\n\n"),
      placementNotes: r.notes,
    },
  });
  await audit(u.id, "quickadd.placed", "PressRelease", pr.id);
  revalidatePath("/admin/incoming");
  redirect(`/admin/incoming/${pr.id}?placed=1`);
}
