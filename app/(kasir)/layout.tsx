import type { Metadata } from "next";
import { Toaster } from "sonner";
import { KasirSidebar } from "@/features/kasir";

export const metadata: Metadata = {
  title: "Fordza POS — Kasir",
  description: "Point of Sale Fordza Shop",
};

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-stone-50">
      <KasirSidebar />
      <main className="flex-1 flex flex-col min-h-screen md:overflow-hidden">
        {/* Mobile top padding for hamburger bar */}
        <div className="md:hidden h-14" />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
