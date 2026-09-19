/**
 * Wrapper for tesseract.js that conditionally loads the real library or a mock.
 * This prevents tesseract.js from being bundled in production.
 */

let tesseractCache = null;

export async function loadTesseract() {
  // In production, return a mock to prevent runtime errors
  if (process.env.NODE_ENV === "production") {
    return createMockTesseract();
  }

  // In development, load the real tesseract.js
  if (!tesseractCache) {
    const tesseractModule = await import("tesseract.js");
    tesseractCache = tesseractModule.default;
  }
  return tesseractCache;
}

function createMockTesseract() {
  class MockWorker {
    async recognize() {
      return {
        data: {
          text: "",
          confidence: 0,
        },
      };
    }

    async terminate() {
      return;
    }
  }

  return {
    createWorker: async () => new MockWorker(),
    recognize: async () => ({
      data: {
        text: "",
        confidence: 0,
      },
    }),
    terminate: async () => {},
  };
}

const TesseractWrapper = {
  loadTesseract,
  createMockTesseract,
};

export default TesseractWrapper;