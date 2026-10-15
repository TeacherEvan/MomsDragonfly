import { httpRouter } from "convex/server";

import { httpAction } from "./_generated/server";
import { fetchWithTimeout } from "./fetchWithTimeout";
import {
  clampPhotoWidth,
  googlePhotoMediaUrl,
  isValidLatLng,
  isValidPhotoRef,
  streetViewImageUrl,
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

    try {
      const upstream = await fetchWithTimeout(googlePhotoMediaUrl(ref, width), {
        headers: { "X-Goog-Api-Key": key },
        timeoutMs: 12_000,
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
    }
  }),
});

/**
 * GET /streetview?lat=…&lng=…
 *
 * Server-side proxy for Google Street View Static: the API key stays on the
 * deployment and the client only ever sees a `*.convex.site` URL. Because
 * the image is keyed off the place's coordinates — never its name — it can
 * never show a picture of the wrong place. Coordinates are validated so this
 * cannot be abused as an open proxy / SSRF gadget.
 */
http.route({
  path: "/streetview",
  method: "GET",
  handler: httpAction(async (_ctx, request) => {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get("lat"));
    const lng = Number(url.searchParams.get("lng"));
    if (!isValidLatLng(lat, lng)) {
      return new Response("Invalid location", { status: 400 });
    }

    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) {
      console.warn("StreetView: GOOGLE_PLACES_API_KEY not set — proxy unavailable");
      return new Response("Street View proxy not configured", { status: 404 });
    }

    try {
      const upstream = await fetchWithTimeout(streetViewImageUrl(lat, lng, key), {
        timeoutMs: 12_000,
      });

      if (!upstream.ok) {
        console.warn(`StreetView: upstream ${upstream.status}`);
        return new Response("Street View unavailable", { status: 404 });
      }

      return new Response(upstream.body, {
        status: 200,
        headers: {
          "Content-Type": upstream.headers.get("Content-Type") ?? "image/jpeg",
          "Cache-Control": "public, max-age=604800",
        },
      });
    } catch (err) {
      console.warn(
        "StreetView: upstream request failed:",
        String(err).slice(0, 160)
      );
      return new Response("Street View unavailable", { status: 404 });
    }
  }),
});

export default http;
