/**
 * URL sanitization helpers.
 * Ensures only safe http(s) protocols reach the DOM.
 */

export function sanitiseHttpsUrl(raw: string | undefined | null): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
