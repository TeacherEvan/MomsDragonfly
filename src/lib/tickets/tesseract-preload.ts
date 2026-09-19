let tesseractPromise: Promise<typeof import("tesseract.js")> | null = null;

export function preloadTesseract(): Promise<typeof import("tesseract.js")> {
  if (!tesseractPromise) {
    tesseractPromise = import("tesseract.js").then((mod) => {
      if (typeof window !== "undefined") {
        // Preload the WASM worker
        mod.default.createWorker("eng").then((worker) => {
          worker.terminate();
        }).catch(() => {
          // Ignore preload errors
        });
      }
      return mod;
    });
  }
  return tesseractPromise;
}