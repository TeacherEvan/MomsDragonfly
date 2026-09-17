import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Purge stale POI cache every hour
crons.interval(
  "purge-poi-cache",
  { hours: 1 },
  internal.mutations.purgeExpiredCache
);

// Send due push notification reminders every 5 minutes
crons.interval(
  "send-reminders",
  { minutes: 5 },
  internal.actions.sendDueReminders
);

// Purge expired tickets every hour
crons.interval(
  "purge-expired-tickets",
  { hours: 1 },
  internal.mutations.purgeExpiredTickets
);

export default crons;
