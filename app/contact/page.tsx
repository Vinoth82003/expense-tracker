import type { Metadata } from "next";
import { ContactClient } from "./ContactClient";
import { SITE_ORIGIN } from "@/lib/site-url";
import {
  resolveSupportEmail,
  resolveSupportPhone,
} from "@/lib/support-contact";

const supportEmail = resolveSupportEmail();
const supportPhone = resolveSupportPhone();

function contactDescription(): string {
  const base = "Get in touch with the SpendWise support team. Send us a message";
  if (supportPhone) {
    return `${base}, email ${supportEmail}, or call ${supportPhone}.`;
  }
  return `${base} or email ${supportEmail}.`;
}

const description = contactDescription();

export const metadata: Metadata = {
  title: "Contact Us | SpendWise — AI-Powered Expense Tracker for India",
  description,
  keywords: [
    "SpendWise contact",
    "expense tracker support",
    "SpendWise help",
    "contact SpendWise India",
    "budget tracker support",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | SpendWise — AI-Powered Expense Tracker",
    description,
    url: `${SITE_ORIGIN}/contact`,
    type: "website",
    siteName: "SpendWise",
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
    title: "Contact Us | SpendWise — AI-Powered Expense Tracker",
    description,
    images: ["/og-images/og-contact-dark.png"],
  },
};

const organizationContact: Record<string, string> = {
  "@type": "Organization",
  name: "SpendWise",
  email: supportEmail,
  url: SITE_ORIGIN,
};

if (supportPhone) {
  organizationContact.telephone = supportPhone;
}

const contactStructuredData = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact SpendWise",
  description: "Get in touch with the SpendWise support team.",
  url: `${SITE_ORIGIN}/contact`,
  mainEntity: organizationContact,
};

const breadcrumbStructuredData = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_ORIGIN,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Contact",
      item: `${SITE_ORIGIN}/contact`,
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <ContactClient />
    </>
  );
}
