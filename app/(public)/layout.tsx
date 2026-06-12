import type { Metadata } from "next";
import PublicNavbar from "@/components/layout/public/PublicNavbar";

export const metadata: Metadata = {
  title: "FORDZA — Premium Menswear Indonesia",
  description:
    "Koleksi pakaian pria premium dari Fordza. Tampil elegan dan percaya diri dengan pilihan fashion menswear terbaik Indonesia.",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen bg-zinc-50">
        {children}
      </div>
    </>
  );
}
