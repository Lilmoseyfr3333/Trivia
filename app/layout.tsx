import "./globals.css";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Basketball Trivia Studio",
  description: "Create Sporcle-style basketball quizzes. Play, score, and flex.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

