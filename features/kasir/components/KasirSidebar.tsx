"use client";

import { ShoppingCart, History, Printer, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const MENU = [
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/riwayat", label: "Riwayat Transaksi", icon: History },
  { href: "/cetak-ulang", label: "Cetak Ulang Struk", icon: Printer },
];

export default function KasirSidebar({ kasirName }: { kasirName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Point of Sale</p>
        <h1 className="text-xl font-bold text-white tracking-tight">FORDZA</h1>
        {kasirName && (
          <p className="text-xs text-amber-300 mt-1">Kasir: {kasirName}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {MENU.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-all ${
                active
                  ? "bg-amber-500 text-[#3C3025]"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded text-sm font-medium text-white/60 hover:bg-red-900/40 hover:text-red-300 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 h-screen sticky top-0"
        style={{ backgroundColor: "#3C3025" }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile: Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ backgroundColor: "#3C3025" }}>
        <h1 className="text-white font-bold text-lg">FORDZA POS</h1>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-white p-1"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-30 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className="md:hidden fixed top-0 left-0 bottom-0 z-40 w-64 flex flex-col"
            style={{ backgroundColor: "#3C3025" }}
          >
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}
