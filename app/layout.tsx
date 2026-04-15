import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

import { PageLoader } from "@/components/ui/PageLoader";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Prevent FOUC - inject theme before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                if (t) {
                  document.documentElement.setAttribute('data-theme', t);
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className="min-h-full flex flex-col antialiased"
        style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}
      >
        <PageLoader />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
