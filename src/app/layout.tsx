import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mom's Dragonfly",
  description: "Your travel companion",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#ea580c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-surface-950 text-dragonfly-navy-50 antialiased min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
