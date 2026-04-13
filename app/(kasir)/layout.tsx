"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { KasirSidebar, QuickStockCheck } from "@/features/kasir";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function KasirLayout({ children }: { children: React.ReactNode }) {
  const [isQuickCheckOpen, setIsQuickCheckOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsQuickCheckOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-stone-50 w-full">
        <KasirSidebar />
        <main className="flex-1 flex flex-col h-[100dvh]">
          {/* Mobile top bar padding */}
          <div className="md:hidden h-14 flex-shrink-0" />
          <div className="flex-1  relative">
            {children}
            
            {/* Quick search button shortcut hint - Desktop only */}
            <button 
              onClick={() => setIsQuickCheckOpen(true)}
              className="hidden md:flex fixed top-4 right-6 z-40 bg-white/80 backdrop-blur border border-stone-200 px-3 py-1.5 rounded-md text-xs font-medium text-stone-500 shadow-sm items-center gap-2 hover:bg-white hover:text-stone-800 transition-all group"
            >
              <span className="group-hover:scale-110 transition-transform">🔍</span>
              Cek Stok
              <kbd className="bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300 pointer-events-none">Ctrl K</kbd>
            </button>
          </div>
        </main>
        
        <QuickStockCheck 
          isOpen={isQuickCheckOpen} 
          onClose={() => setIsQuickCheckOpen(false)} 
        />
        
        <Toaster richColors position="top-right" />
      </div>
    </SidebarProvider>
  );
}
