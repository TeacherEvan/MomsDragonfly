import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mom's Dragonfly",
  description: "Your travel companion",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface-950 text-neutral-50 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
