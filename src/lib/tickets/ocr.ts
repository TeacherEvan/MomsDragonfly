export const TESSERACT_CONFIDENCE_THRESHOLD = 60;

export interface OCRResult {
  text: string;
  confidence: number;
}

type OcrWindow = Window & { __ocrErr?: string };

/** Stash the last OCR failure on window for field debugging. */
function stashOcrError(err: unknown): void {
  if (typeof window === "undefined") return;
  const w = window as OcrWindow;
  const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  w.__ocrErr = w.__ocrErr ? `${w.__ocrErr} | ${msg}` : msg;
}

let workerPromise: Promise<import("tesseract.js").Worker> | null = null;

/**
 * Lazily creates the Tesseract worker. All assets are self-hosted under
 * /public/tesseract so no CDN access is required (works offline and passes
 * the app's CSP).
 */
function getWorker(): Promise<import("tesseract.js").Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      try {
        const { createWorker } = await import("tesseract.js");
        return await createWorker("eng", 1, {
          workerPath: "/tesseract/worker.min.js",
          corePath: "/tesseract",
          langPath: "/tesseract",
        });
      } catch (err) {
        stashOcrError(err);
        throw err;
      }
    })().catch((err) => {
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
    stashOcrError(err);
    console.warn("Tesseract OCR error", err);
    return { text: "", confidence: 0 };
  }
}
