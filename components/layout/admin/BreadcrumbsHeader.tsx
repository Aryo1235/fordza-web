"use client";

import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsHeaderProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  showBackButton?: boolean;
  backUrl?: string; // Jika disediakan, tombol back mengarah ke URL ini. Jika tidak, menggunakan router.back()
  action?: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function BreadcrumbsHeader({
  title,
  breadcrumbs,
  showBackButton = true,
  backUrl,
  action,
  subtitle,
}: BreadcrumbsHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backUrl) {
      router.push(backUrl);
    } else {
      router.back();
    }
  };

  return (
    <div className="flex items-center justify-between pb-4 border-b border-stone-100">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full h-9 w-9"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <div key={index} className="flex items-center gap-2">
                  {item.href && !isLast ? (
                    <Link
                      href={item.href}
                      className="text-xs text-stone-400 hover:text-stone-600"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span
                      className={`text-xs ${
                        isLast
                          ? "text-stone-600 font-medium"
                          : "text-stone-400"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                  {!isLast && (
                    <ChevronRight className="h-3 w-3 text-stone-300" />
                  )}
                </div>
              );
            })}
          </div>
          <h1 className="text-2xl font-black text-[#3C3025] tracking-tight">
            {title}
          </h1>
          {subtitle && subtitle}
        </div>
      </div>
      {action && <div className="flex gap-2">{action}</div>}
    </div>
  );
}
