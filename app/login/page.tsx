import type { Metadata } from "next";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = {
  title: "Sign In | SpendWise — AI-Powered Expense Tracker for India",
  description:
    "Sign in to SpendWise. Access your personal AI-powered expense tracking dashboard securely using Google OAuth or your email address.",
  keywords: [
    "SpendWise login",
    "expense tracker sign in",
    "SpendWise account",
    "budget tracker login",
  ],
  robots: "noindex, nofollow",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Sign In | SpendWise — AI-Powered Expense Tracker",
    description:
      "Sign in to SpendWise. Access your personal AI-powered expense tracking dashboard securely.",
    url: `${process.env.NEXT_PUBLIC_PRODUCTION_LINK || "https://thespendwise.vercel.app"}/login`,
    type: "website",
    siteName: "SpendWise",
    images: [
      {
        url: "/og-images/og-login-dark.png",
        width: 1200,
        height: 630,
        alt: "Sign In to SpendWise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign In | SpendWise — AI-Powered Expense Tracker",
    description:
      "Sign in to SpendWise. Access your personal AI-powered expense tracking dashboard securely.",
    images: ["/og-images/og-login-dark.png"],
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
