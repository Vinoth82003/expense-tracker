import { AdminLayout } from "@/components/admin/AdminLayout";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Panel | SpendWise",
  description: "Secure admin control panel for SpendWise.",
  // Defense-in-depth: robots.txt already Disallows /admin. Keep the admin
  // console out of the index even if the robots file is ever misconfigured.
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
