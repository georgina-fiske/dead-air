"use server";
import { requireAdmin } from "@/lib/adminAuth";
import { htmlToText } from "@/lib/richText";
import { draftTrivia, type TriviaResult } from "@/lib/trivia";

// Calls Claude from the server. The key stays in Railway's variables. Only the press release text is sent.
export async function draftTriviaAction(spotlightHtml: string, story1Html: string, story2Html: string): Promise<TriviaResult> {
  await requireAdmin();
  const text = [spotlightHtml, story1Html, story2Html].map((h) => htmlToText(h ?? "")).filter(Boolean).join("\n\n");
  return draftTrivia(text);
}
