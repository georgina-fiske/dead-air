import sharp from "sharp";
import { audit, currentAdmin } from "@/lib/adminAuth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await currentAdmin();
  if (!user || user.mustChangePassword) return Response.json({ error: "Log in first." }, { status: 401 });
  const origin = req.headers.get("origin"), host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ error: "Bad origin." }, { status: 403 });

  const form = await req.formData();
  const name = String(form.get("name") ?? "").trim().slice(0, 40);
  const file = form.get("file");
  if (!name) return Response.json({ error: "Give the icon a name." }, { status: 400 });
  if (!(file instanceof File) || file.size === 0) return Response.json({ error: "Pick an image." }, { status: 400 });
  if (file.size > 2 * 1024 * 1024) return Response.json({ error: "Over 2 MB." }, { status: 400 });
  const dupe = await db.pressIcon.findFirst({ where: { name: { equals: name, mode: "insensitive" } } });
  if (dupe) return Response.json({ error: "An icon with that name already exists." }, { status: 409 });
  try {
    // Always saved as a small PNG with a transparent background. SVG files are drawn to pixels, so nothing can run.
    const png = await sharp(Buffer.from(await file.arrayBuffer()), { density: 300 })
      .resize({ width: 128, height: 128, fit: "inside" }).png().toBuffer();
    const icon = await db.pressIcon.create({ data: { name, data: new Uint8Array(png) }, select: { id: true } });
    await audit(user.id, "icon.uploaded", "PressIcon", icon.id, name);
    return Response.json({ id: icon.id });
  } catch {
    return Response.json({ error: "Not an image I can read." }, { status: 400 });
  }
}
