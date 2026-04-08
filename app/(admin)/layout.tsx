import type { Metadata } from "next";
import { QueryProvider } from "@/components/admin/QueryProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Fordza Admin",
  description: "Panel Admin Fordza",
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-right" />
    </QueryProvider>
  );
}
