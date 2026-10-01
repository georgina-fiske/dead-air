"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { resolveStatus, str, wantsLive, type FormState } from "@/lib/adminContent";
import { htmlToText, sanitizeBody } from "@/lib/richText";
import { importImages } from "@/lib/pressImages";
import { uniqueSlug } from "@/lib/slug";
import { looksLikeSentence } from "@/lib/voice";

export async function saveOpinion(_: FormState | undefined, f: FormData): Promise<FormState> {
  const u = await requireAdmin();
  const id = str(f, "id");
  const intent = str(f, "intent");
  if (intent === "delete" && id) {
    await db.opinion.delete({ where: { id } });
    await audit(u.id, "hotair.deleted", "Opinion", id);
    revalidatePath("/", "layout");
    redirect("/admin/hot-air");
  }
  const title = str(f, "title").trim();
  const imported = await importImages(sanitizeBody(str(f, "bodyHtml")));
  const bodyHtml = imported.html;
  const body = htmlToText(bodyHtml);
  if (!title) return { error: "A title is needed." };
  if (wantsLive(intent)) {
    if (!looksLikeSentence(title)) return { error: "The title must be a full sentence with an opinion in it." };
    if (!body.trim()) return { error: "Write the piece first." };
  }
  const prev = id ? await db.opinion.findUnique({ where: { id } }) : null;
  const st = resolveStatus(intent, str(f, "scheduledAt"), prev);
  if ("error" in st) return st;
  let oid = id;
  if (prev) {
    await db.opinion.update({ where: { id }, data: { title, body, bodyHtml, ...st } });
  } else {
    const slug = await uniqueSlug(title, async (s) => !!(await db.opinion.findUnique({ where: { slug: s } })));
    oid = (await db.opinion.create({ data: { title, body, bodyHtml, slug, ...st } })).id;
  }
  await audit(u.id, `hotair.${intent}`, "Opinion", oid);
  revalidatePath("/", "layout");
  redirect(`/admin/hot-air/${oid}?saved=1`);
}
