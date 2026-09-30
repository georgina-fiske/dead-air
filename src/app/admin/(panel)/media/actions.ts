"use server";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { str } from "@/lib/adminContent";

export async function deleteMedia(f: FormData) {
  const u = await requireAdmin();
  const id = str(f, "id");
  await db.mediaImage.delete({ where: { id } }); // releases using it fall back to no cover
  await audit(u.id, "media.deleted", "MediaImage", id);
  revalidatePath("/", "layout");
}
