import type { Metadata } from "next";
import { LoginClient } from "./LoginClient";

export const metadata: Metadata = {
  title: "Login | SpendWise — UPI Expense Tracker for India",
  description:
    "Log in to SpendWise. Access your personal UPI expense tracking dashboard securely using Google OAuth or your email address.",
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: "Login | SpendWise — UPI Expense Tracker for India",
    description:
      "Log in to SpendWise. Access your personal UPI expense tracking dashboard securely using Google OAuth or your email address.",
    url: "https://money-spend-tracker.vercel.app/login",
    images: [
      {
        url: "/og-images/og-login-dark.png",
        width: 1200,
        height: 630,
        alt: "Log In to SpendWise",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Login | SpendWise — UPI Expense Tracker for India",
    description:
      "Log in to SpendWise. Access your personal UPI expense tracking dashboard securely using Google OAuth or your email address.",
    images: ["/og-images/og-login-dark.png"],
  },
};

export default function LoginPage() {
  return <LoginClient />;
}
