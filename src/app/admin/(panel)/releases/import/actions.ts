"use server";
import { revalidatePath } from "next/cache";
import { audit, requireAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { dateOnly, str } from "@/lib/adminContent";
import { readReleases, type CsvRow } from "@/lib/csv";
import { uniqueSlug } from "@/lib/slug";
import type { ReleaseType } from "@/generated/prisma/enums";

export type ImportState = { rows?: (CsvRow & { duplicate?: boolean })[]; csv?: string; imported?: number; error?: string };

async function annotate(csv: string) {
  const rows = readReleases(csv);
  const existing = await db.release.findMany({ select: { artist: true, title: true } });
  const seen = new Set(existing.map((r) => `${r.artist.toLowerCase()}|${r.title.toLowerCase()}`));
  return rows.map((r) => {
    const key = `${r.artist.toLowerCase()}|${r.title.toLowerCase()}`;
    const duplicate = !r.error && seen.has(key);
    seen.add(key); // repeats inside the file count as duplicates too
    return { ...r, duplicate };
  });
}

export async function importAction(_: ImportState | undefined, f: FormData): Promise<ImportState> {
  const u = await requireAdmin();
  const csv = str(f, "csv");
  if (!csv.trim()) return { error: "Pick a CSV file or paste rows." };
  const rows = await annotate(csv);
  if (rows.length === 0) return { error: "No rows found." };
  if (str(f, "intent") !== "import") return { rows, csv };

  const ok = rows.filter((r) => !r.error && !r.duplicate);
  for (const r of ok) {
    const slug = await uniqueSlug(`${r.artist} ${r.title}`, async (s) => !!(await db.release.findUnique({ where: { slug: s } })));
    await db.release.create({
      data: { slug, artist: r.artist, title: r.title, type: r.type as ReleaseType, releaseDate: dateOnly(r.date), label: r.label || null },
    });
  }
  await audit(u.id, "releases.imported", "Release", undefined, `${ok.length} of ${rows.length} rows`);
  revalidatePath("/admin/releases");
  return { rows, imported: ok.length };
}
