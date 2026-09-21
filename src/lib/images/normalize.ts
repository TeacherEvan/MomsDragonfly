/**
 * Normalises an image before storage/OCR:
 *  - applies EXIF orientation (photos from phones are often rotated)
 *  - downscales to a sane max edge (keeps IndexedDB small, OCR fast)
 *  - re-encodes as JPEG
 * Falls back to the original blob if anything is unsupported.
 */
export async function normalizeImage(
  blob: Blob,
  maxEdge = 1600,
  quality = 0.85
): Promise<Blob> {
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return blob;
  }
  try {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return blob;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const out = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality)
    );
    return out ?? blob;
  } catch {
    return blob;
  }
}
