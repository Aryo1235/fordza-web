"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,
  FolderOpen,
  Image,
  MessageSquare,
  Ruler,
  ChevronRight,
  LogOut,
  Package,
  Users,
  BarChart3,
  History,
  FileText,
  Percent,
  Wallet
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/products", label: "Produk", icon: ShoppingBag },
  { href: "/dashboard/categories", label: "Kategori", icon: FolderOpen },
  { href: "/dashboard/banners", label: "Banner", icon: Image },
  { href: "/dashboard/testimonials", label: "Testimoni", icon: MessageSquare },
  { href: "/dashboard/size-templates", label: "Template Ukuran", icon: Ruler },
  { href: "/dashboard/promo", label: "Manajemen Promo", icon: Percent },
  { href: "/dashboard/stock", label: "Stok Opname", icon: Package },
  { href: "/dashboard/stock-history", label: "Histori Stok", icon: FileText },
  { href: "/dashboard/users", label: "Management User", icon: Users },
  { href: "/dashboard/transactions", label: "Riwayat Transaksi", icon: History },
  { href: "/dashboard/shifts", label: "Laporan Laci", icon: Wallet },
  { href: "/dashboard/reports", label: "Laporan Omzet", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile } = useSidebar();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Sidebar collapsible="icon" variant="sidebar" className="border-none bg-[#3C3025]">
      <SidebarHeader className="bg-[#3C3025] py-6 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF4E8] text-[#3C3025]">
            <span className="font-bold">F</span>
          </div>
          <div className={cn(
            "flex flex-col transition-opacity duration-300",
            state === "collapsed" && !isMobile ? "opacity-0 invisible w-0" : "opacity-100"
          )}>
            <p className="font-bold text-sm leading-tight text-white">Fordza</p>
            <p className="text-[10px] text-[#c4a882] leading-tight uppercase tracking-widest">Admin Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#3C3025] px-2 py-4">
        <SidebarMenu className="gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={isActive}
                  className={cn(
                    "relative h-11 px-3 transition-all duration-300 rounded-xl group",
                    isActive
                      ? "bg-[#FEF4E8] text-[#3C3025] font-semibold"
                      : "text-[#c4a882] hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Link href={item.href}>
                    <Icon className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-transform duration-300",
                      isActive && "scale-110"
                    )} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && state === "expanded" && <ChevronRight className="h-3 w-3" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-[#3C3025] p-2 border-t border-white/5">
        <SidebarMenuButton
          onClick={handleLogout}
          className="h-10 text-[#c4a882] hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Keluar</span>
        </SidebarMenuButton>
        {state === "expanded" && (
          <div className="px-4 py-2 mt-2">
            <p className="text-[10px] text-[#8a7060] font-medium">© 2026 Fordza Studio</p>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
