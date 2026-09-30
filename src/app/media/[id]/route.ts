import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const m = await db.mediaImage.findUnique({ where: { id: (await params).id }, select: { data: true, mime: true } });
  if (!m) return new Response("That page is gone.", { status: 404 });
  return new Response(new Uint8Array(m.data), {
    headers: { "Content-Type": m.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
