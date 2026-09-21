export const TESSERACT_CONFIDENCE_THRESHOLD = 60;

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Runs Tesseract.js OCR fully offline.
 *
 * All assets are self-hosted under /public/tesseract (worker, wasm core,
 * eng language data) so no CDN access is required — works offline and
 * complies with the app's Content-Security-Policy.
 *
 * The worker is created lazily on first use and reused afterwards.
 */

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

function getWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js");
      return createWorker("eng", 1, {
        workerPath: "/tesseract/worker.min.js",
        corePath: "/tesseract",
        langPath: "/tesseract",
        errorHandler: (err: unknown) => console.warn("tesseract worker error", err),
      });
    })().catch((err) => {
      // Allow retry on next call if worker creation failed
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

export async function runTesseract(imageBlob: Blob): Promise<OCRResult> {
  try {
    const worker = await getWorker();
    const { data } = await worker.recognize(imageBlob);
    return {
      text: data.text || "",
      confidence: data.confidence || 0,
    };
  } catch (err) {
    console.warn("Tesseract OCR error", err);
    return {
      text: "",
      confidence: 0,
    };
  }
}
