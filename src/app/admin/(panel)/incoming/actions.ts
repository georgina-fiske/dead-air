"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { dateOnly, resolveStatus, str, wantsLive, type FormState } from "@/lib/adminContent";
import { uniqueSlug } from "@/lib/slug";
import { htmlToText, sanitizeBody } from "@/lib/richText";
import { importImages } from "@/lib/pressImages";
import type { ReleaseType } from "@/generated/prisma/enums";

export async function savePress(_: FormState | undefined, f: FormData): Promise<FormState> {
  const u = await requireAdmin();
  const id = str(f, "id");
  const intent = str(f, "intent");
  if (intent === "delete" && id) {
    await db.pressRelease.delete({ where: { id } });
    await audit(u.id, "incoming.deleted", "PressRelease", id);
    revalidatePath("/", "layout");
    redirect("/admin/incoming");
  }
  const artist = str(f, "artist").trim(), title = str(f, "title").trim(), type = str(f, "type");
  // The words are kept exactly. Only unsafe markup is removed. Pictures are copied into Media.
  const cleaned = sanitizeBody(str(f, "bodyHtml"));
  const imported = await importImages(cleaned);
  const bodyHtml = imported.html;
  const body = htmlToText(bodyHtml);
  const hasPicture = /<img\b/i.test(bodyHtml);
  if (!artist || !title) return { error: "Artist and title are needed." };
  if (!["SINGLE", "EP", "ALBUM", "LIVE_ALBUM"].includes(type)) return { error: "Pick a type." };
  if (wantsLive(intent) && !body.trim() && !hasPicture) return { error: "Paste the press release first." };

  const prev = id ? await db.pressRelease.findUnique({ where: { id } }) : null;
  const st = resolveStatus(intent, str(f, "scheduledAt"), prev);
  if ("error" in st) return st;

  const rel = {
    artist, title, type: type as ReleaseType, releaseDate: dateOnly(str(f, "releaseDate")),
    label: str(f, "label").trim() || null, sourceUrl: str(f, "sourceUrl").trim() || null,
    coverId: str(f, "coverId") || null,
  };
  const extra = { headline: str(f, "headline").trim().slice(0, 200) || null, body, bodyHtml, receivedFrom: str(f, "receivedFrom").trim() || null, receivedAt: dateOnly(str(f, "receivedAt")), ...st };
  let pid = id;
  if (prev) {
    await db.release.update({ where: { id: prev.releaseId }, data: rel });
    await db.pressRelease.update({ where: { id }, data: extra });
  } else {
    let releaseId = str(f, "releaseId");
    if (releaseId) {
      if (await db.pressRelease.findUnique({ where: { releaseId } })) return { error: "That release already has a press release." };
      await db.release.update({ where: { id: releaseId }, data: rel });
    } else {
      const slug = await uniqueSlug(`${artist} ${title}`, async (s) => !!(await db.release.findUnique({ where: { slug: s } })));
      releaseId = (await db.release.create({ data: { ...rel, slug } })).id;
    }
    const release = await db.release.findUniqueOrThrow({ where: { id: releaseId } });
    pid = (await db.pressRelease.create({ data: { ...extra, releaseId, slug: release.slug, isExample: release.isExample } })).id;
  }
  await audit(u.id, `incoming.${intent}`, "PressRelease", pid);
  revalidatePath("/", "layout");
  redirect(`/admin/incoming/${pid}?saved=1&copied=${imported.copied}&failed=${imported.failed}`);
}
