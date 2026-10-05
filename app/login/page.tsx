import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginClient } from "./LoginClient";
import { SITE_ORIGIN } from "@/lib/site-url";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";
import {
  PRIMARY_APP_ORIGIN,
  isAllowedOrigin,
  isManagedAppOrigin,
  isMarketingOrigin,
  isPrimaryAppOrigin,
  currentOriginFromHeaders,
} from "@/lib/origins";

export const dynamic = "force-dynamic";

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
    url: `${SITE_ORIGIN}/login`,
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

function resolveBridgeTo(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  try {
    const parsed = new URL(raw);
    if (!isAllowedOrigin(parsed.origin)) return null;
    // Never bridge to self or to the marketing site.
    if (isPrimaryAppOrigin(parsed.origin) || isMarketingOrigin(parsed.origin)) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ bridgeTo?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const h = await headers();
  const currentOrigin = currentOriginFromHeaders(
    h.get("host"),
    h.get("x-forwarded-proto")
  );

  // Where the user was trying to go before they were bounced here. Untrusted
  // input, so it is sanitised (see lib/auth-redirect.ts).
  const callbackUrl = sanitizeCallbackUrl(params.callbackUrl);

  // Google OAuth is only configured on the primary app origin. Sibling app
  // deployments bounce sign-in there and return through the auth bridge
  // (/auth/bridge). Marketing-site visitors continue straight into the app.
  if (currentOrigin && !isPrimaryAppOrigin(currentOrigin)) {
    let bridgeTo = resolveBridgeTo(params.bridgeTo);
    if (!bridgeTo && isManagedAppOrigin(currentOrigin)) {
      bridgeTo = currentOrigin;
    }

    // Carry both hops across to the primary origin.
    const query = new URLSearchParams();
    if (bridgeTo) query.set("bridgeTo", bridgeTo);
    if (callbackUrl) query.set("callbackUrl", callbackUrl);
    redirect(`${PRIMARY_APP_ORIGIN}/login${query.size ? `?${query.toString()}` : ""}`);
  }

  const bridgeTo = resolveBridgeTo(params.bridgeTo);
  return <LoginClient bridgeTo={bridgeTo} callbackUrl={callbackUrl} />;
}
