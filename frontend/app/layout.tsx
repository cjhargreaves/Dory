import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dory - AI Agent Spend Management",
  description:
    "Track every model call, set hard limits, and attribute costs down to the specific agent workflow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
