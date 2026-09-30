"use server";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { addExamples, removeExamples } from "@/lib/examples";

export async function addExamplesAction() {
  const u = await requireAdmin();
  const made = await addExamples();
  await audit(u.id, made ? "examples.added" : "examples.skipped");
  revalidatePath("/admin");
}

export async function removeExamplesAction() {
  const u = await requireAdmin();
  const n = await removeExamples();
  await audit(u.id, "examples.removed", undefined, undefined, `${n} rows`);
  revalidatePath("/admin");
}
