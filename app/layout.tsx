import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
});

import { PageLoader } from "@/components/ui/PageLoader";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f1a" },
  ],
};

export const metadata: Metadata = {
  title: "SpendWise — Smart Expense Tracker for India",
  description:
    "Track your daily expenses, set monthly budgets, and get clear financial insights. SpendWise is the mobile-first, Rupee-native expense manager designed to help Indians save smarter.",
  keywords: [
    "expense tracker",
    "expense manager",
    "budget tracker",
    "rupee expense",
    "personal finance",
    "money tracker India",
    "SaaS budget app",
  ],
  authors: [{ name: "SpendWise" }],
  robots: "index, follow",
  openGraph: {
    title: "SpendWise — Smart Expense Tracker for India",
    description:
      "Track, categorize, and visualize your expenses. Built for India, powered by simplicity.",
    type: "website",
    siteName: "SpendWise",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWise — Expense Tracker",
    description: "Smart rupee-first expense tracking for every Indian.",
  },
  other: {
    "google-site-verification": "your-verification-code", // Add if you have Google Search Console
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Preconnect to Google Fonts */}
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin=""
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />

        {/* Prevent FOUC - inject theme before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t) {
                  if (t === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{
          backgroundColor: "var(--bg-primary)",
          color: "var(--text-primary)",
        }}
      >
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 font-semibold"
        >
          Skip to main content
        </a>

        <PageLoader />
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
