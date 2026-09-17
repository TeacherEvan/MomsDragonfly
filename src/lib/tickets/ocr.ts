export const TESSERACT_CONFIDENCE_THRESHOLD = 60;

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Runs Tesseract.js OCR on the provided image blob.
 * Tesseract.js WASM is dynamically loaded to keep bundle size lightweight.
 */
export async function runTesseract(imageBlob: Blob): Promise<OCRResult> {
  try {
    const Tesseract = (await import("tesseract.js")).default;
    const { data } = await Tesseract.recognize(imageBlob, "eng", {
      logger: () => {},
    });

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
