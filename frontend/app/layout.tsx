import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { WaterBackground } from "./components/WaterBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keel: Infrastructure for the agent economy.",
  description:
    "Track every model call, set hard limits, and attribute costs down to the specific agent workflow.",
  icons: {
    icon: [
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "64x64", type: "image/png" },
      { url: "/logo.png", sizes: "192x192", type: "image/png" },
      { url: "/logo.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/logo.png", sizes: "180x180", type: "image/png" },
    shortcut: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <WaterBackground />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
