"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useSearchParams } from "next/navigation";

interface PublicPaginationProps {
  currentPage: number;
  totalPage: number;
  onPageChange?: (page: number) => void;
  /** Set to true to use URL-based pagination (Link) instead of state-based (Button) */
  useLinks?: boolean;
  /** Optional base path, defaults to current pathname */
  path?: string;
  className?: string;
}

export function PublicPagination({
  currentPage,
  totalPage,
  onPageChange,
  useLinks = false,
  path,
  className,
}: PublicPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPage <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    const base = path || pathname;
    return `${base}?${params.toString()}`;
  };

  const renderButton = (p: number, content: React.ReactNode, active = false, disabled = false) => {
    const commonClasses = cn(
      "size-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all",
      active 
        ? "bg-amber-400 text-[#4A3B2E] shadow-md" 
        : "text-zinc-500 hover:bg-zinc-100",
      disabled && "pointer-events-none opacity-40 shadow-none border-dashed"
    );

    if (useLinks && !disabled) {
      return (
        <Link key={p} href={createPageUrl(p)} className={commonClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button
        key={p}
        type="button"
        disabled={disabled}
        onClick={() => onPageChange?.(p)}
        className={commonClasses}
      >
        {content}
      </button>
    );
  };

  const renderNavButton = (type: "prev" | "next") => {
    const isPrev = type === "prev";
    const targetPage = isPrev ? Math.max(1, currentPage - 1) : Math.min(totalPage, currentPage + 1);
    const isDisabled = isPrev ? currentPage <= 1 : currentPage >= totalPage;

    const commonClasses = cn(
      "flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-200 bg-white text-sm font-bold text-zinc-600 transition-all hover:bg-zinc-50",
      isDisabled && "pointer-events-none opacity-40 shadow-none border-dashed"
    );

    const content = (
      <>
        {isPrev && <ChevronLeft className="size-4" />}
        <span className="hidden sm:inline">{isPrev ? "Sebelumnya" : "Selanjutnya"}</span>
        {!isPrev && <ChevronRight className="size-4" />}
      </>
    );

    if (useLinks && !isDisabled) {
      return (
        <Link href={createPageUrl(targetPage)} className={commonClasses}>
          {content}
        </Link>
      );
    }

    return (
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => onPageChange?.(targetPage)}
        className={commonClasses}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={cn("mt-16 flex items-center justify-center gap-2 sm:gap-4", className)}>
      {renderNavButton("prev")}

      <div className="flex items-center gap-1">
        {Array.from({ length: totalPage }).map((_, i) => {
          const p = i + 1;
          
          // Show 1st, Last, and current +/- 1
          const shouldShow = p === 1 || p === totalPage || (p >= currentPage - 1 && p <= currentPage + 1);
          
          if (shouldShow) {
            return renderButton(p, p, currentPage === p);
          }

          // Show dots
          if (p === currentPage - 2 || p === currentPage + 2) {
            return (
              <span key={p} className="text-zinc-300 px-1 select-none">
                ...
              </span>
            );
          }

          return null;
        })}
      </div>

      {renderNavButton("next")}
    </div>
  );
}
