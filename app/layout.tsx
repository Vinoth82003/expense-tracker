import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  preload: true,
});

import { PageLoader } from "@/components/ui/PageLoader";
import { AuthProvider } from "@/components/providers/AuthProvider";
import PWAInstallBanner from "@/components/layout/PWAInstallBanner";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { PublicMaintenanceBanner } from "@/components/layout/PublicMaintenanceBanner";
import { ModalProvider } from "@/components/providers/ModalProvider";
import { UIProvider } from "@/context/UIContext";
import { CookieConsent } from "@/components/layout/CookieConsent";


export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f1a" },
  ],
  appleMobileWebAppCapable: "yes",
  appleMobileWebAppStatusBarStyle: "default",
};

export const metadata: Metadata = {
  title: "SpendWise — Smart Expense Tracker for India",
  description:
    "Master your personal finance with SpendWise, the smart AI-powered expense tracker and budget manager built for India. Track daily spending, set monthly budgets, and gain deep financial insights.",
  applicationName: "SpendWise",
  keywords: [
    "expense tracker",
    "expense manager",
    "budget tracker",
    "rupee expense",
    "personal finance",
    "money tracker India",
    "SaaS budget app",
    "AI financial assistant",
    "wealth tracker",
    "budgeting app",
  ],
  authors: [{ name: "SpendWise" }],
  robots: "index, follow",
  metadataBase: new URL("https://money-spend-tracker.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SpendWise — Smart Expense Tracker for India",
    description:
      "Track, categorize, and visualize your expenses. Built for India, powered by simplicity.",
    type: "website",
    siteName: "SpendWise",
    url: "https://money-spend-tracker.vercel.app",
    images: [
      {
        url: "/og-images/og-home-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise — Smart Expense Tracker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SpendWise — Expense Tracker",
    description: "Smart rupee-first expense tracking for every Indian.",
    images: ["/og-images/og-home-dark.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpendWise",
  },
  icons: {
    apple: "/web-app-manifest-192x192.png",
  },
  // Confirms ownership via the HTML file already in /public
  verification: {
    google: "f1afae934a46160c",
  },

};

import { Toaster } from "react-hot-toast";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} h-full`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        {/* LLM / AI Agent Discovery File */}
        <link rel="llms-txt" type="text/plain" href="/llms.txt" title="SpendWise LLM Context" />

        {/* Capture PWA installation prompt globally */}
        <script src="/js/pwa-prompt.js" defer />

        {/* DNS prefetch & preconnect for external resources */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://accounts.google.com" />

        {/* Prevent FOUC - inject theme before hydration */}
        <script src="/js/theme-init.js" />
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

        <PublicMaintenanceBanner />
        <PageLoader />
        <OfflineIndicator />
        <Toaster position="top-center" reverseOrder={false} />
        <AuthProvider>
          <ThemeProvider>
            <UIProvider>
              <ModalProvider>{children}</ModalProvider>
            </UIProvider>
          </ThemeProvider>
        </AuthProvider>
        <PWAInstallBanner />
        <CookieConsent />
      </body>
    </html>
  );
}
