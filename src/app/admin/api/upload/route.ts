import { audit, currentAdmin } from "@/lib/adminAuth";
import { MAX_UPLOAD_BYTES, saveImage } from "@/lib/media";

export async function POST(req: Request) {
  const user = await currentAdmin();
  if (!user || user.mustChangePassword) return Response.json({ error: "Log in first." }, { status: 401 });
  // CSRF: the cookie is SameSite=Strict. Also require the request to come from this site.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host || new URL(origin).host !== host) return Response.json({ error: "Bad origin." }, { status: 403 });

  const form = await req.formData();
  const files = form.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) return Response.json({ error: "No file." }, { status: 400 });
  const out = [];
  for (const f of files) {
    if (f.size > MAX_UPLOAD_BYTES) { out.push({ name: f.name, error: "Over 12 MB." }); continue; }
    try {
      const m = await saveImage(f.name, Buffer.from(await f.arrayBuffer()));
      await audit(user.id, "media.uploaded", "MediaImage", m.id, f.name);
      out.push({ name: f.name, id: m.id, bytes: m.bytes });
    } catch {
      out.push({ name: f.name, error: "Not an image I can read." });
    }
  }
  return Response.json({ files: out });
}
