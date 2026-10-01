import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const i = await db.pressIcon.findUnique({ where: { id: (await params).id }, select: { data: true } });
  if (!i) return new Response("That page is gone.", { status: 404 });
  return new Response(new Uint8Array(i.data), {
    headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
