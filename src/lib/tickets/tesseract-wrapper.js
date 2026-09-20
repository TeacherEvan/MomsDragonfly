/**
 * Wrapper for tesseract.js that returns real Tesseract in development
 * and mock in production to prevent bundling/runtime issues.
 */

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

export async function loadTesseract() {
  // In production, the webpack alias in next.config.js will make "tesseract.js" resolve to the mock
  // In development, we can safely import the real tesseract.js
  if (process.env.NODE_ENV === "production") {
    return createMockTesseract();
  }

  try {
    const Tesseract = await import("tesseract.js");
    return Tesseract.default || Tesseract;
  } catch (err) {
    console.warn("Failed to load tesseract.js, using mock", err);
    return createMockTesseract();
  }
}

export default { loadTesseract, createMockTesseract };