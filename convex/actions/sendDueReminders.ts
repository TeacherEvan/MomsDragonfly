"use node";
import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import webpush from "web-push";

export const sendDueReminders = internalAction({
  args: {},
  handler: async (ctx: any) => {
    const vapidPublic = process.env.VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
    const vapidSubject = process.env.VAPID_SUBJECT;

    if (!vapidPublic || !vapidPrivate || !vapidSubject) {
      console.warn("VAPID keys not set — skipping push send");
      return;
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const now = Date.now();
    const due = await ctx.runQuery(internal.queries.upcomingRemindersQuery, {
      before: now,
    });

    for (const reminder of due) {
      const prefs = await ctx.runQuery(internal.queries.prefsQuery, {
        deviceId: reminder.deviceId,
      });

      if (!prefs?.vapidSubscription) continue;

      try {
        const subscription = JSON.parse(prefs.vapidSubscription);
        await webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: reminder.title,
            body: reminder.body ?? "",
          })
        );
        await ctx.runMutation(internal.mutations.markReminderSent, {
          id: reminder._id,
        });
      } catch (err) {
        console.error(`Failed to send push for reminder ${reminder._id}:`, err);
      }
    }
  },
});
