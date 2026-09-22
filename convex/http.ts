import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import {
  clampPhotoWidth,
  googlePhotoMediaUrl,
  isValidPhotoRef,
} from "./placeHelpers";

/**
 * GET /place-photo?ref=places/…/photos/…&w=800
 *
 * Server-side photo proxy for Google Places (New): the API key stays on the
 * deployment and the client only ever sees a `*.convex.site` URL. The ref is
 * validated against PHOTO_REF_RE first so this cannot be abused as an open
 * proxy / SSRF gadget.
 */
const http = httpRouter();

http.route({
  path: "/place-photo",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const ref = url.searchParams.get("ref") ?? "";
    if (!isValidPhotoRef(ref)) {
      return new Response("Invalid photo reference", { status: 400 });
    }

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
      console.warn("PlacePhoto: GOOGLE_PLACES_API_KEY not set — proxy unavailable");
      return new Response("Photo proxy not configured", { status: 404 });
    }

    const width = clampPhotoWidth(url.searchParams.get("w"));

    // Timers are not guaranteed in every Convex runtime; only arm the abort
    // when the runtime actually provides setTimeout.
    const controller = new AbortController();
    const timeoutId =
      typeof setTimeout === "function"
        ? setTimeout(() => controller.abort(), 12_000)
        : undefined;

    try {
      const upstream = await fetch(googlePhotoMediaUrl(ref, width), {
        headers: { "X-Goog-Api-Key": key },
        signal: controller.signal,
      });

      if (!upstream.ok) {
        const body = await upstream.text().catch(() => "");
        console.warn(
          `PlacePhoto: upstream ${upstream.status} — ${body.slice(0, 160)}`
        );
        return new Response("Photo unavailable", { status: 404 });
      }

      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
          "Cache-Control": "public, max-age=604800",
        },
      });
    } catch (err) {
      console.warn("PlacePhoto: upstream request failed:", String(err).slice(0, 160));
      return new Response("Photo unavailable", { status: 404 });
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }),
});

export default http;
