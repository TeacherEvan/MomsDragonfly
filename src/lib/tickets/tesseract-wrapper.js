/**
 * Wrapper for tesseract.js that returns a mock to prevent bundling/runtime issues.
 * tesseract.js has known issues in Next.js (both dev and prod), so we always use a mock.
 */

export async function loadTesseract() {
  // Always return mock to prevent tesseract.js runtime errors in Next.js
  return createMockTesseract();
}

function createMockTesseract() {
  class MockWorker {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async recognize(_imageBlob, _lang, _options) {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    recognize: async (_imageBlob, _lang, _options) => ({
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