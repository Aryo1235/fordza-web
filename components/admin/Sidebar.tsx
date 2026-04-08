"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  Image,
  MessageSquare,
  Ruler,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Produk", icon: ShoppingBag },
  { href: "/dashboard/categories", label: "Kategori", icon: FolderOpen },
  { href: "/dashboard/banners", label: "Banner", icon: Image },
  { href: "/dashboard/testimonials", label: "Testimoni", icon: MessageSquare },
  { href: "/dashboard/size-templates", label: "Template Ukuran", icon: Ruler },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col bg-[#3C3025] text-[#FEF4E8]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-[#5a4a38]">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FEF4E8]">
          <span className="text-[#3C3025] font-bold text-sm">F</span>
        </div>
        <div>
          <p className="font-bold text-sm leading-tight">Fordza</p>
          <p className="text-[10px] text-[#c4a882] leading-tight">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors group",
                isActive
                  ? "bg-[#FEF4E8] text-[#3C3025] font-semibold"
                  : "text-[#c4a882] hover:bg-[#5a4a38] hover:text-[#FEF4E8]"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-3 w-3" />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#5a4a38]">
        <p className="text-[10px] text-[#8a7060]">© 2026 Fordza</p>
      </div>
    </aside>
  );
}
