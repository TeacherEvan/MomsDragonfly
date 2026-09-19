/**
 * Mock tesseract.js for production builds to prevent bundling issues.
 * This mock provides the same API as tesseract.js but returns mock results.
 */

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

class MockTesseract {
  static createWorker() {
    return Promise.resolve(new MockWorker());
  }

  static recognize() {
    return Promise.resolve({
      data: {
        text: "",
        confidence: 0,
      },
    });
  }

  static terminate() {
    return Promise.resolve();
  }
}

export default MockTesseract;