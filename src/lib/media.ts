import "server-only";
import sharp from "sharp";
import { db } from "@/lib/db";

export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const MAX_SIDE = 1400;

// Resize on upload. Rotate from EXIF, strip metadata, WebP, longest side 1400px.
export async function saveImage(filename: string, input: Buffer) {
  const img = sharp(input, { failOn: "error" }).rotate();
  const { data, info } = await img
    .resize({ width: MAX_SIDE, height: MAX_SIDE, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  return db.mediaImage.create({
    data: {
      filename: filename.slice(0, 200), mime: "image/webp", width: info.width, height: info.height,
      bytes: data.length, data: new Uint8Array(data),
    },
    select: { id: true, filename: true, width: true, height: true, bytes: true },
  });
}
