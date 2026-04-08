"use client";

import { LogOut, User, Bell } from "lucide-react";
import { useLogout, useMe } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function Header() {
  const { data: admin, isLoading } = useMe();
  const logout = useLogout();

  return (
    <header className="flex h-16 items-center justify-end border-b border-border bg-white px-6 shrink-0">
      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell (placeholder) */}
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        {/* Admin info */}
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#3C3025]">
            <User className="h-3.5 w-3.5 text-[#FEF4E8]" />
          </div>
          {isLoading ? (
            <Skeleton className="h-4 w-20" />
          ) : (
            <span className="text-sm font-medium text-foreground">
              {admin?.name || admin?.username || "Admin"}
            </span>
          )}
        </div>

        {/* Logout */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
          title="Logout"
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
