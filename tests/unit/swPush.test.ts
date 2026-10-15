import { describe, expect, it } from "vitest";

// Pure helper function modeling the push event logic in public/sw.js
function buildNotificationPayload(eventData?: { json: () => unknown; text: () => string }) {
  let data: Record<string, unknown> = {};
  if (eventData) {
    try {
      data = (eventData.json() as Record<string, unknown>) || {};
    } catch {
      data = { title: eventData.text() };
    }
  }

  const title = (data.title as string) || "Mom's Dragonfly Reminder";
  const options = {
    body: (data.body as string) || "You have an upcoming travel reminder.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      url: (data.url as string) || "/reminders",
    },
  };

  return { title, options };
}

describe("Service Worker Push Notification Logic", () => {
  it("extracts structured json payload with title, body, and custom url", () => {
    const raw = {
      title: "Flight Check-in",
      body: "Boarding starts at 14:30 at Gate 4B",
      url: "/reminders",
    };
    const { title, options } = buildNotificationPayload({
      json: () => raw,
      text: () => JSON.stringify(raw),
    });

    expect(title).toBe("Flight Check-in");
    expect(options.body).toBe("Boarding starts at 14:30 at Gate 4B");
    expect(options.icon).toBe("/icons/icon-192x192.png");
    expect(options.badge).toBe("/icons/icon-192x192.png");
    expect(options.data.url).toBe("/reminders");
  });

  it("handles plain text push payloads gracefully as title", () => {
    const { title, options } = buildNotificationPayload({
      json: () => {
        throw new Error("Unexpected token");
      },
      text: () => "Passport renewal reminder",
    });

    expect(title).toBe("Passport renewal reminder");
    expect(options.body).toBe("You have an upcoming travel reminder.");
    expect(options.data.url).toBe("/reminders");
  });

  it("supplies default fallbacks when push event has no data", () => {
    const { title, options } = buildNotificationPayload(undefined);

    expect(title).toBe("Mom's Dragonfly Reminder");
    expect(options.body).toBe("You have an upcoming travel reminder.");
    expect(options.data.url).toBe("/reminders");
  });

  it("preserves custom destination URLs if provided in payload", () => {
    const raw = {
      title: "View your ticket",
      url: "/tickets",
    };
    const { title, options } = buildNotificationPayload({
      json: () => raw,
      text: () => JSON.stringify(raw),
    });

    expect(title).toBe("View your ticket");
    expect(options.data.url).toBe("/tickets");
  });
});
