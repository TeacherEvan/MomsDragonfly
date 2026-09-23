import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Route-level loading state for every page under the (tabs) layout.
 * Shown during client-side navigation while the destination segment resolves
 * (dynamic routes: /local, /reminders, /settings, /budget).
 */
export default function Loading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className="p-4 space-y-4 max-w-xl mx-auto pb-24"
    >
      <span className="sr-only">Loading page…</span>
      <Skeleton variant="text" width="55%" height="28px" />
      <Skeleton variant="rectangular" height="96px" className="rounded-xl" />
      <Skeleton variant="text" width="100%" height="16px" />
      <Skeleton variant="text" width="80%" height="16px" />
      <Skeleton variant="rectangular" height="140px" className="rounded-xl" />
    </div>
  );
}
