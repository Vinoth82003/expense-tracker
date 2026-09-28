import type { Metadata } from "next";

export const metadata: Metadata = {
  // An in-auth 2FA challenge. The page is a client component and cannot export
  // metadata itself, so it would otherwise inherit the root layout's
  // `alternates.canonical: "/"` and claim to be the homepage. Keep it out of
  // the index: it carries no search value and it should not be a crawl path
  // into the authenticated app.
  robots: {
    index: false,
    follow: false,
  },
};

export default function Verify2FALayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
