export const TESSERACT_CONFIDENCE_THRESHOLD = 60;

export interface OCRResult {
  text: string;
  confidence: number;
}

/**
 * Runs Tesseract.js OCR on the provided image blob.
 * Uses a wrapper that conditionally loads tesseract.js in development
 * and returns a mock in production to avoid bundling issues.
 */
export async function runTesseract(imageBlob: Blob): Promise<OCRResult> {
  try {
    const tesseractWrapper = await import("./tesseract-wrapper");
    const Tesseract = await tesseractWrapper.loadTesseract();
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

export interface OCRResult {
  text: string;
  confidence: number;
}
