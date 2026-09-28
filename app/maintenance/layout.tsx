import type { Metadata } from "next";

export const metadata: Metadata = {
  // /maintenance has no page-level metadata object (the page is a client
  // component, so it cannot export one). Without this, it inherits the root
  // layout's `alternates.canonical: "/"` and declares itself a duplicate of the
  // homepage. A transient maintenance screen must never be indexable.
  robots: {
    index: false,
    follow: false,
  },
};

export default function MaintenanceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
