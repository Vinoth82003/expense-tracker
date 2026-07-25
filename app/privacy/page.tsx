import type { Metadata } from "next";
import PrivacyClient from "./PrivacyClient";

export const metadata: Metadata = {
  title: "Privacy Policy | SpendWise — UPI Expense Tracker for India",
  description:
    "Read the SpendWise Privacy Policy. Learn about our commitment to data protection, compliance with the Indian DPDP Act 2023, data retention, and how to contact our Grievance Officer.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | SpendWise — UPI Expense Tracker for India",
    description:
      "Read the SpendWise Privacy Policy. Learn about our commitment to data protection, compliance with the Indian DPDP Act 2023, data retention, and how to contact our Grievance Officer.",
    url: "https://money-spend-tracker.vercel.app/privacy",
    images: [
      {
        url: "/og-images/og-privacy-dark.png",
        width: 1200,
        height: 630,
        alt: "SpendWise Privacy Policy",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | SpendWise — UPI Expense Tracker for India",
    description:
      "Read the SpendWise Privacy Policy. Learn about our commitment to data protection, compliance with the Indian DPDP Act 2023, data retention, and how to contact our Grievance Officer.",
    images: ["/og-images/og-privacy-dark.png"],
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}
