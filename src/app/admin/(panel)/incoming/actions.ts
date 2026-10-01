"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { dateOnly, resolveStatus, str, wantsLive, type FormState } from "@/lib/adminContent";
import { uniqueSlug } from "@/lib/slug";
import { safeUrl } from "@/lib/pressText";
import { htmlToText, sanitizeBody } from "@/lib/richText";
import { importImages } from "@/lib/pressImages";
import type { ReleaseType } from "@/generated/prisma/enums";

// The words are stored exactly as entered. Only unsafe code is removed.
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
  if (!artist || !title) return { error: "Artist and release title are needed." };
  if (!["SINGLE", "EP", "ALBUM", "LIVE_ALBUM"].includes(type)) return { error: "Pick a type." };

  // The three text boxes hold formatted text. Unsafe markup is removed. Pasted pictures are copied into Media.
  const clean = async (k: string) => (await importImages(sanitizeBody(str(f, k)))).html;
  const spotlight = await clean("spotlight"), story1 = await clean("story1"), story2 = await clean("story2");
  const has = (h: string) => htmlToText(h).trim() !== "" || /<img\b/i.test(h);

  // photos: must exist in the Media library
  const photo = async (n: 1 | 2) => {
    const pid = str(f, `photo${n}Id`);
    const ok = pid ? !!(await db.mediaImage.findUnique({ where: { id: pid }, select: { id: true } })) : false;
    return { id: ok ? pid : null, credit: str(f, `photo${n}Credit`).trim() || null, alt: str(f, `photo${n}Alt`).trim() || null };
  };
  const p1 = await photo(1), p2 = await photo(2);

  // link buttons: kept as entered, even half-finished in a draft
  const labels = f.getAll("linkLabel").map(String), urls = f.getAll("linkUrl").map(String), icons = f.getAll("linkIcon").map(String);
  const links = labels.map((label, i) => ({ label: label.trim(), url: (urls[i] ?? "").trim(), iconId: icons[i] ?? "" }))
    .filter((l) => l.label || l.url).slice(0, 12);
  const iconIds = new Set((await db.pressIcon.findMany({ select: { id: true } })).map((x) => x.id));
  for (const l of links) if (!iconIds.has(l.iconId)) l.iconId = "";

  const qs = f.getAll("triviaQ").map((x) => String(x).replace(/\r\n/g, "\n")), as = f.getAll("triviaA").map((x) => String(x).replace(/\r\n/g, "\n"));
  const trivia = qs.map((question, i) => ({ question, answer: as[i] ?? "" })).filter((t) => t.question.trim() || t.answer.trim()).slice(0, 3);

  if (wantsLive(intent)) {
    if (![spotlight, story1, story2].some(has)) return { error: "Write the spotlight or the story first." };
    if ((p1.id && !p1.alt) || (p2.id && !p2.alt)) return { error: "Every photo needs alt text." };
    if (links.some((l) => !l.label || !safeUrl(l.url))) return { error: "Each link button needs text and an http or https address." };
    if (trivia.some((t) => !t.question.trim() || !t.answer.trim())) return { error: "Each trivia question needs an answer." };
  }

  const prev = id ? await db.pressRelease.findUnique({ where: { id } }) : null;
  const st = resolveStatus(intent, str(f, "scheduledAt"), prev);
  if ("error" in st) return st;

  const rel = {
    artist, title, type: type as ReleaseType, releaseDate: dateOnly(str(f, "releaseDate")),
    label: str(f, "label").trim() || null, sourceUrl: str(f, "sourceUrl").trim() || null, coverId: str(f, "coverId") || null,
  };
  const body = [spotlight, story1, story2].map(htmlToText).filter((t) => t).join("\n\n");
  const extra = {
    headline: str(f, "headline").trim().slice(0, 200) || null,
    structured: true, rich: true,
    photo1Id: p1.id, photo1Credit: p1.credit, photo1Alt: p1.alt, spotlight, links, story1,
    photo2Id: p2.id, photo2Credit: p2.credit, photo2Alt: p2.alt, story2, trivia,
    body, bodyHtml: null,
    receivedFrom: str(f, "receivedFrom").trim() || null, receivedAt: dateOnly(str(f, "receivedAt")), ...st,
  };
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
  redirect(`/admin/incoming/${pid}?saved=1`);
}
