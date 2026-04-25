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
<<<<<<< HEAD
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Script id="tailwind-config" strategy="beforeInteractive">
          {`
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    brand: {
                      dark: '#0F172A',
                      panel: '#1E293B',
                      cyan: '#06B6D4',
                      text: '#F8FAFC',
                      muted: '#94A3B8'
                    }
                  },
                  fontFamily: {
                    sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
                    mono: ['var(--font-jetbrains-mono)', 'monospace']
                  }
                }
              }
            `,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js" />
      </head>
      <body className="antialiased">{children}</body>
=======
      <body>{children}</body>
>>>>>>> f565feb (fixed the frontend bug)
    </html>
  );
}
