"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { dateOnly, str, type FormState } from "@/lib/adminContent";
import { uniqueSlug } from "@/lib/slug";
import type { ReleaseType } from "@/generated/prisma/enums";

const TYPES = ["SINGLE", "EP", "ALBUM", "LIVE_ALBUM"];

export async function saveRelease(_: FormState | undefined, f: FormData): Promise<FormState> {
  const u = await requireAdmin();
  const id = str(f, "id");
  const intent = str(f, "intent");
  if (intent === "delete" && id) {
    await db.release.delete({ where: { id } });
    await audit(u.id, "release.deleted", "Release", id);
    revalidatePath("/", "layout");
    redirect("/admin/releases");
  }
  const artist = str(f, "artist").trim(), title = str(f, "title").trim(), type = str(f, "type");
  if (!artist || !title) return { error: "Artist and title are needed." };
  if (!TYPES.includes(type)) return { error: "Pick a type." };
  const data = {
    artist, title, type: type as ReleaseType,
    releaseDate: dateOnly(str(f, "releaseDate")),
    label: str(f, "label").trim() || null,
    sourceUrl: str(f, "sourceUrl").trim() || null,
    coverId: str(f, "coverId") || null,
  };
  let rid = id;
  if (id) {
    await db.release.update({ where: { id }, data });
  } else {
    const slug = await uniqueSlug(`${artist} ${title}`, async (s) => !!(await db.release.findUnique({ where: { slug: s } })));
    rid = (await db.release.create({ data: { ...data, slug } })).id;
  }
  await audit(u.id, id ? "release.edited" : "release.created", "Release", rid);
  revalidatePath("/", "layout");
  redirect(`/admin/releases/${rid}?saved=1`);
}
