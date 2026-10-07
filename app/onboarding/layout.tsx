import type { Metadata } from "next";

export const metadata: Metadata = {
  // Authenticated onboarding funnel — no search value; keep out of the index
  // even though robots.txt already Disallows /onboarding.
  robots: {
    index: false,
    follow: false,
  },
};

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
