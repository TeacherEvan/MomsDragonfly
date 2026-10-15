/**
 * Unified fetch with timeout utility.
 * Guarantees timer cleanup via try/finally and provides typed json extraction.
 */

export class FetchTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FetchTimeoutError";
  }
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Check if HTTP status code represents a transient or retryable error (429 or 5xx). */
export function isRetryable(status: number): boolean {
  return status === 429 || (status >= 500 && status < 600);
}

export async function fetchWithTimeout(
  url: string | URL,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const timeoutMs = init?.timeoutMs ?? 15_000;
  const controller = new AbortController();

  let timedOut = false;
  const timeoutId =
    typeof setTimeout === "function"
      ? setTimeout(() => {
          timedOut = true;
          controller.abort();
        }, timeoutMs)
      : undefined;

  try {
    const fetchInit = { ...init };
    delete fetchInit.timeoutMs;
    return await fetch(url, {
      ...fetchInit,
      signal: controller.signal,
    });
  } catch (err) {
    if (timedOut) {
      throw new FetchTimeoutError(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export async function fetchJson<T>(
  url: string,
  headers: Record<string, string> = {},
  timeoutMs = 10_000
): Promise<T | null> {
  try {
    const res = await fetchWithTimeout(url, { headers, timeoutMs });
    if (!res.ok) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
