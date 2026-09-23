import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import {
  parsePushSubscribeRequest,
  parsePushUnsubscribeRequest,
} from "@/lib/push/request";

/**
 * Web Push subscription registration.
 *
 * POST   /api/push — persist `subscription` into `userPrefs.vapidSubscription`
 *                    for this device (consumed by the Convex `sendDueReminders`
 *                    cron, which does the actual web-push sending with the
 *                    VAPID keys stored in the Convex deployment env).
 * DELETE /api/push — clear the stored subscription (user turned notifications
 *                    off, or the browser dropped the subscription).
 *
 * Responses never echo internal error details — failures are logged
 * server-side and a generic message is returned.
 */

function convexClient(): ConvexHttpClient | null {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) return null;
  return new ConvexHttpClient(url);
}

async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  const parsed = parsePushSubscribeRequest(await readJson(req));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const client = convexClient();
  if (!client) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not set — cannot store push subscription");
    return NextResponse.json({ error: "Push notifications are not configured" }, { status: 503 });
  }

  try {
    await client.mutation(api.mutations.savePrefs, {
      deviceId: parsed.deviceId,
      vapidSubscription: JSON.stringify(parsed.subscription),
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to store push subscription:", err);
    return NextResponse.json({ error: "Failed to store subscription" }, { status: 502 });
  }
}

export async function DELETE(req: NextRequest) {
  const parsed = parsePushUnsubscribeRequest(await readJson(req));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const client = convexClient();
  if (!client) {
    console.error("NEXT_PUBLIC_CONVEX_URL is not set — cannot clear push subscription");
    return NextResponse.json({ error: "Push notifications are not configured" }, { status: 503 });
  }

  try {
    await client.mutation(api.mutations.clearPushSubscription, {
      deviceId: parsed.deviceId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Failed to clear push subscription:", err);
    return NextResponse.json({ error: "Failed to clear subscription" }, { status: 502 });
  }
}

