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

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-dragonfly-rose-500 mb-2">Something went wrong!</h2>
      <p className="text-dragonfly-navy-400 mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-primary-600 text-dragonfly-navy-950 rounded-lg hover:bg-primary-700"
      >
        Try again
      </button>
    </div>
  );
}
