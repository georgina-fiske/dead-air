"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { dateOnly, rawText, resolveStatus, scoreField, str, wantsLive, type FormState } from "@/lib/adminContent";
import { CATEGORIES, RUBRIC_VERSION, canPublish, computeTotal, isValidScore, type Scores } from "@/lib/rubric";

export async function saveReview(_: FormState | undefined, f: FormData): Promise<FormState> {
  const u = await requireAdmin();
  const id = str(f, "id");
  const intent = str(f, "intent");
  if (intent === "delete" && id) {
    await db.review.delete({ where: { id } });
    await audit(u.id, "review.deleted", "Review", id);
    revalidatePath("/", "layout");
    redirect("/admin/rated");
  }
  const releaseId = str(f, "releaseId");
  const release = await db.release.findUnique({ where: { id: releaseId } });
  if (!release) return { error: "Pick a release." };

  const scores: Scores = {};
  for (const c of CATEGORIES) {
    const v = scoreField(f, c.key);
    if (v === "bad" || (v !== null && !isValidScore(c.key, v))) return { error: `${c.name} must be a whole number from 0 to ${c.max}.` };
    scores[c.key] = v;
  }
  const take = rawText(f, "take").trim();
  const complete = canPublish(scores);
  if (wantsLive(intent)) {
    if (!complete) return { error: "All five scores are needed to publish. Save it as a draft for now." };
    if (!take) return { error: "Write the take first." };
  }
  const prev = id ? await db.review.findUnique({ where: { id } }) : null;
  const st = resolveStatus(intent, str(f, "scheduledAt"), prev);
  if ("error" in st) return st;

  const data = {
    releaseId, take,
    biasLine: rawText(f, "biasLine").trim(), craftLine: rawText(f, "craftLine").trim(), nerveLine: rawText(f, "nerveLine").trim(),
    crowdLine: rawText(f, "crowdLine").trim(), replayLine: rawText(f, "replayLine").trim(),
    bias: scores.bias ?? null, craft: scores.craft ?? null, nerve: scores.nerve ?? null, crowd: scores.crowd ?? null, replay: scores.replay ?? null,
    total: complete ? computeTotal(scores) : null, // always computed here. Never typed.
    isFan: f.get("isFan") === "on",
    listenedAt: dateOnly(str(f, "listenedAt")),
    status: st.status, publishedAt: st.publishedAt,
  };
  let rid = id;
  if (id) {
    await db.review.update({ where: { id }, data });
  } else {
    if (await db.review.findUnique({ where: { releaseId } })) return { error: "That release already has a review." };
    rid = (await db.review.create({ data: { ...data, slug: release.slug, rubricVersion: RUBRIC_VERSION, isExample: release.isExample } })).id;
  }
  await audit(u.id, `review.${intent}`, "Review", rid);
  revalidatePath("/", "layout");
  redirect(`/admin/rated/${rid}?saved=1`);
}
