import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us | SpendWise — UPI Expense Tracker for India",
  description:
    "Get in touch with SpendWise support team. Send us a message, email us at support@spendwise.app, or call our Indian helpline.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | SpendWise — UPI Expense Tracker for India",
    description:
      "Get in touch with SpendWise support team. Send us a message, email us at support@spendwise.app, or call our Indian helpline.",
    url: "https://money-spend-tracker.vercel.app/contact",
    images: [
      {
        url: "/og-images/og-contact-dark.png",
        width: 1200,
        height: 630,
        alt: "Contact SpendWise Support",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | SpendWise — UPI Expense Tracker for India",
    description:
      "Get in touch with SpendWise support team. Send us a message, email us at support@spendwise.app, or call our Indian helpline.",
    images: ["/og-images/og-contact-dark.png"],
  },
};

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact SpendWise",
  "description": "Get in touch with the SpendWise support team.",
  "url": "https://money-spend-tracker.vercel.app/contact",
  "mainEntity": {
    "@type": "Organization",
    "name": "SpendWise",
    "email": "support@spendwise.app",
    "url": "https://money-spend-tracker.vercel.app"
  }
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />
      <ContactClient />
    </>
  );
}
