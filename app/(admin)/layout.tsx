import type { Metadata } from "next";

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
    <>
      {children}
    </>
  );
}
