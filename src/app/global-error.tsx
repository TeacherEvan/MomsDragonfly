"use client";
import { useEffect } from "react";

/**
 * Root-level error boundary. Replaces the root layout when it (or anything
 * below it that isn't caught by a nested error.tsx) throws, so it must render
 * its own <html>/<body>. Like the nested boundary, it never exposes
 * `error.message` in production — only the error digest (designed to be safe
 * to show and to correlate with server logs).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#061416",
          color: "#f0f4f8",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <div>
          <h2 style={{ color: "#f43f5e", marginBottom: "0.5rem" }}>Something went wrong!</h2>
          <p style={{ color: "#829ab1", marginBottom: "1rem" }}>
            {isDev ? error.message : "An unexpected error occurred. Please try again."}
          </p>
          {!isDev && error.digest && (
            <p style={{ color: "#627d98", fontSize: "0.875rem", marginBottom: "1rem" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#319795",
              color: "#061416",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: "44px",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
