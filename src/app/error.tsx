"use client";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  // Never expose internal error messages to end users in production —
  // show the digest instead (safe to display, correlatable in server logs).
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-dragonfly-rose-500 mb-2">Something went wrong!</h2>
      <p className="text-dragonfly-navy-400 mb-4">
        {isDev ? error.message : "An unexpected error occurred. Please try again."}
      </p>
      {!isDev && error.digest && (
        <p className="text-caption text-dragonfly-navy-500 mb-4">Reference: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-dragonfly-teal-500 hover:bg-dragonfly-teal-400 text-dragonfly-navy-950 font-semibold rounded-lg transition-colors duration-fast min-h-[var(--touch-target)]"
      >
        Try again
      </button>
    </div>
  );
}
