"use server";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { str } from "@/lib/adminContent";

export async function deleteIcon(f: FormData) {
  const u = await requireAdmin();
  const id = str(f, "id");
  await db.pressIcon.delete({ where: { id } });
  await audit(u.id, "icon.deleted", "PressIcon", id);
  revalidatePath("/", "layout");
}
