import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@momsdragonfly.app";
const vapidPublic = process.env.VAPID_PUBLIC_KEY || "mock-public-key";
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || "mock-private-key";

try {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
} catch {
  // Gracefully continue in local development
}

export async function POST(req: NextRequest) {
  try {
    const { subscription } = (await req.json()) as {
      deviceId?: string;
      subscription?: PushSubscription;
    };
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
