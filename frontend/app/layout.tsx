import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dory – AI Agent Spend Management",
  description: "Track every model call, set hard limits, and attribute costs down to the specific agent workflow.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                theme: {
                  extend: {
                    colors: {
                      'brand': {
                        dark: '#0F172A',
                        panel: '#1E293B',
                        cyan: '#06B6D4',
                        text: '#F8FAFC',
                        muted: '#94A3B8'
                      }
                    },
                    fontFamily: {
                      sans: ['Inter', 'system-ui', 'sans-serif'],
                      mono: ['JetBrains Mono', 'monospace']
                    }
                  }
                }
              }
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
