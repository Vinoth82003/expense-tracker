import type { Metadata } from "next";

export const metadata: Metadata = {
  // /status is a live service-health board. Its content changes on every page
  // load, it has no durable search value, and it appeared in the sitemap with
  // changeFrequency "hourly" — a combination that invites constant re-crawls
  // for a page nobody searches for. It is kept crawlable (linked from the
  // footer and /sitemap) but out of the index.
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/status",
  },
};

export default function StatusLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
