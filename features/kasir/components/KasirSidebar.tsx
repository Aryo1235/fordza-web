import { useState } from "react";
import { 
  ShoppingCart, 
  History, 
  Printer, 
  LogOut, 
  Menu, 
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Lock
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { CloseShiftModal } from "@/features/shifts";

const MENU = [
  { href: "/pos", label: "POS", icon: ShoppingCart },
  { href: "/riwayat", label: "Riwayat Transaksi", icon: History },
  { href: "/cetak-ulang", label: "Cetak Ulang Struk", icon: Printer },
];

export default function KasirSidebar({ kasirName }: { kasirName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, isMobile } = useSidebar();
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Sidebar 
      collapsible="icon" 
      variant="sidebar"
      className="border-none"
    >
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
            <p className="text-[10px] text-[#c4a882] leading-tight uppercase tracking-widest">Kasir Panel</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-[#3C3025] px-2 py-4">
        <SidebarMenu className="gap-1.5">
          {MENU.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.label}
                  isActive={active}
                  className={cn(
                    "relative h-11 px-3 transition-all duration-300 rounded-xl group",
                    active 
                      ? "bg-[#FEF4E8] text-[#3C3025] font-semibold" 
                      : "text-[#c4a882] hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Link href={item.href}>
                    <Icon className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-transform duration-300",
                      active && "scale-110"
                    )} />
                    <span className="flex-1 font-medium">{item.label}</span>
                    {active && state === "expanded" && <ChevronRight className="h-3 w-3" />}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="bg-[#3C3025] p-2 border-t border-white/5">
        {kasirName && state === "expanded" && (
          <div className="px-3 py-2 mb-2 bg-white/5 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[#FEF4E8]/10 flex items-center justify-center">
                <User className="w-3 h-3 text-[#FEF4E8]" />
              </div>
              <p className="text-[10px] font-medium text-[#c4a882] truncate">{kasirName}</p>
            </div>
          </div>
        )}
        <SidebarMenuButton
          onClick={() => setIsCloseModalOpen(true)}
          className="h-10 text-white bg-red-600 hover:bg-red-700 shadow-md rounded-xl transition-all font-semibold my-1"
        >
          <Lock className="h-4 w-4 shrink-0" />
          <span>Tutup Shift Laci</span>
        </SidebarMenuButton>

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

      <CloseShiftModal 
        isOpen={isCloseModalOpen} 
        onClose={() => setIsCloseModalOpen(false)} 
      />
    </Sidebar>
  );
}
