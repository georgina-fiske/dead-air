"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { dateOnly, resolveStatus, str, wantsLive, type FormState } from "@/lib/adminContent";
import { uniqueSlug } from "@/lib/slug";

export async function saveInterview(_: FormState | undefined, f: FormData): Promise<FormState> {
  const u = await requireAdmin();
  const id = str(f, "id");
  const intent = str(f, "intent");
  if (intent === "delete" && id) {
    await db.interview.delete({ where: { id } });
    await audit(u.id, "offair.deleted", "Interview", id);
    revalidatePath("/", "layout");
    redirect("/admin/off-air");
  }
  const artist = str(f, "artist").trim();
  if (!artist) return { error: "Artist is needed." };
  // Answers are kept exactly as sent. No trim, no fixes. Only line breaks are made consistent.
  const qs = f.getAll("question").map((q) => String(q).replace(/\r\n/g, "\n"));
  const as = f.getAll("answer").map((a) => String(a).replace(/\r\n/g, "\n"));
  const qa = qs.map((question, position) => ({ question: question.trim(), answer: as[position] ?? "", position }))
    .filter((x) => x.question || x.answer.trim());
  if (qa.some((x) => !x.question)) return { error: "Every answer needs a question." };
  if (wantsLive(intent) && (qa.length === 0 || qa.some((x) => !x.answer.trim()))) return { error: "Every question needs an answer before it goes live." };
  qa.forEach((x, i) => (x.position = i));

  const prev = id ? await db.interview.findUnique({ where: { id } }) : null;
  const st = resolveStatus(intent, str(f, "scheduledAt"), prev);
  if ("error" in st) return st;
  const data = { artist, subtitle: str(f, "subtitle").trim() || null, date: dateOnly(str(f, "date")), ...st };
  let iid = id;
  if (prev) {
    await db.$transaction([
      db.interviewQA.deleteMany({ where: { interviewId: id } }),
      db.interview.update({ where: { id }, data: { ...data, qa: { create: qa } } }),
    ]);
  } else {
    const slug = await uniqueSlug(`${artist} ${data.subtitle ?? "interview"}`, async (s) => !!(await db.interview.findUnique({ where: { slug: s } })));
    iid = (await db.interview.create({ data: { ...data, slug, qa: { create: qa } } })).id;
  }
  await audit(u.id, `offair.${intent}`, "Interview", iid);
  revalidatePath("/", "layout");
  redirect(`/admin/off-air/${iid}?saved=1`);
}
