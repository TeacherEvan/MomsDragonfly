let tesseractPromise: Promise<typeof import("tesseract.js")> | null = null;

export function preloadTesseract(): Promise<typeof import("tesseract.js")> {
  if (!tesseractPromise) {
    tesseractPromise = import("tesseract.js").then((mod) => {
      // Don't create a worker during preload - it causes runtime errors in production
      // The module will be loaded on-demand when OCR is actually used
      return mod;
    });
  }
  return tesseractPromise;
}