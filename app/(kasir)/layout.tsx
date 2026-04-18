"use client";

import { useState, useEffect, useRef } from "react";
import type { Metadata } from "next";
import { Toaster } from "sonner";
import { KasirSidebar, QuickStockCheck } from "@/features/kasir";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function KasirLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isQuickCheckOpen, setIsQuickCheckOpen] = useState(false);
  const [buttonPos, setButtonPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const hasMountedRef = useRef(false);
  const dragStateRef = useRef({
    pointerId: -1,
    offsetX: 0,
    offsetY: 0,
    moved: false,
  });

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

  useEffect(() => {
    let initialX = window.innerWidth - 180;
    let initialY = 16;

    // Untuk layar mobile, posisi default diletakkan agak di bawah agar lebih mudah dijangkau jempol
    if (window.innerWidth < 768) {
      initialX = window.innerWidth - 130;
      initialY = window.innerHeight - 100;
    }

    const saved = window.localStorage.getItem("kasir-quick-check-button-pos");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { x: number; y: number };
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          // Batasi (clamp) koordinat yang tersimpan agar tidak terlempar keluar layar (saat pindah dari desktop ke mobile)
          const maxX = window.innerWidth - 100;
          const maxY = window.innerHeight - 56;

          initialX = Math.max(8, Math.min(parsed.x, maxX));
          initialY = Math.max(8, Math.min(parsed.y, maxY));
        }
      } catch {
        // ignore invalid saved position
      }
    }

    setButtonPos({ x: initialX, y: initialY });
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    window.localStorage.setItem(
      "kasir-quick-check-button-pos",
      JSON.stringify(buttonPos),
    );
  }, [buttonPos]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || dragStateRef.current.pointerId !== e.pointerId) return;

      const nextX = e.clientX - dragStateRef.current.offsetX;
      const nextY = e.clientY - dragStateRef.current.offsetY;

      dragStateRef.current.moved = true;

      const maxX = window.innerWidth - 160;
      const maxY = window.innerHeight - 56;

      setButtonPos({
        x: Math.max(8, Math.min(nextX, maxX)),
        y: Math.max(8, Math.min(nextY, maxY)),
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragStateRef.current.pointerId !== e.pointerId) return;

      setIsDragging(false);
      dragStateRef.current.pointerId = -1;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [buttonPos, isDragging]);

  const handleQuickButtonPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    dragStateRef.current = {
      pointerId: e.pointerId,
      offsetX: e.clientX - buttonPos.x,
      offsetY: e.clientY - buttonPos.y,
      moved: false,
    };

    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleQuickButtonClick = () => {
    if (dragStateRef.current.moved) {
      dragStateRef.current.moved = false;
      return;
    }

    setIsQuickCheckOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-stone-50 w-full overflow-x-hidden">
        <KasirSidebar />
        <main className="flex-1 flex flex-col h-dvh min-w-0 overflow-x-hidden">
          {/* Mobile top bar padding */}
          <div className="md:hidden h-14 shrink-0" />
          <div className="flex-1 w-full max-w-[1440px] mx-auto relative px-0 flex flex-col overflow-y-auto">
            {children}

            {/* Quick search button shortcut hint */}
            {isMounted && (
              <button
                onPointerDown={handleQuickButtonPointerDown}
                onClick={handleQuickButtonClick}
                onPointerUp={() => setIsDragging(false)}
                className="flex fixed top-0 left-0 z-50 bg-white/90 backdrop-blur border border-stone-200 px-3 py-1.5 rounded-full md:rounded-md text-xs font-medium text-stone-500 shadow-md items-center gap-2 hover:bg-white hover:text-stone-800 transition-colors group cursor-grab active:cursor-grabbing select-none touch-none"
                style={{
                  transform: `translate3d(${buttonPos.x}px, ${buttonPos.y}px, 0)`,
                  WebkitTransform: `translate3d(${buttonPos.x}px, ${buttonPos.y}px, 0)`,
                }}
              >
                <span className="group-hover:scale-110 transition-transform">
                  🔍
                </span>
                <span className="md:hidden">Cek Stok</span>
                <span className="hidden md:inline">Cek Stok</span>
                <kbd className="hidden md:flex bg-stone-100 px-1.5 py-0.5 rounded border border-stone-300 pointer-events-none">
                  Ctrl K
                </kbd>
              </button>
            )}
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
