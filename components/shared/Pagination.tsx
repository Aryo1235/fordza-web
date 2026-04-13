"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  isLoading?: boolean;
  label?: string;
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  isLoading,
  label = "item",
}: PaginationProps) {
  // We keep showing pagination if there's more than one page OR if user can change limit
  if (totalItems === 0) return null;

  const startRange = (page - 1) * limit + 1;
  const endRange = Math.min(page * limit, totalItems);

  return (
    <div className="border-t border-stone-100 px-6 py-4 flex flex-col sm:flex-row items-center justify-between bg-stone-50/30 gap-4">
      <div className="flex flex-col sm:flex-row items-center gap-4 order-2 sm:order-1">
        <div className="text-xs text-stone-500 text-center sm:text-left">
          Menampilkan <span className="font-semibold text-stone-700">{startRange}</span> -{" "}
          <span className="font-semibold text-stone-700">{endRange}</span> dari{" "}
          <span className="font-semibold text-stone-700">{totalItems}</span> {label}
        </div>

        {onLimitChange && (
          <div className="flex items-center gap-2 border-l border-stone-200 pl-4 ml-0 sm:ml-2">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-tight">Show:</span>
            <Select
              value={limit.toString()}
              onValueChange={(val) => onLimitChange(parseInt(val))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-7 w-[70px] text-[11px] font-bold bg-white border-stone-200">
                <SelectValue placeholder={limit} />
              </SelectTrigger>
              <SelectContent>
                {[10, 25, 50, 100].map((val) => (
                  <SelectItem key={val} value={val.toString()} className="text-[11px] font-medium">
                    {val}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1 || isLoading}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            "h-8 text-[10px] font-bold uppercase transition-all active:scale-95 border-stone-200",
            page === 1 ? "opacity-50" : "hover:bg-white hover:text-stone-900"
          )}
        >
          <ChevronLeft className="w-3 h-3 mr-1" /> Prev
        </Button>
        
        <div className="flex items-center gap-1 px-4 h-8 bg-white border border-stone-200 rounded-md text-[11px] font-bold text-stone-600 shadow-sm">
          {page} <span className="text-stone-300">/</span> {totalPages || 1}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isLoading}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            "h-8 text-[10px] font-bold uppercase transition-all active:scale-95 border-stone-200",
            page >= totalPages ? "opacity-50" : "hover:bg-white hover:text-stone-900"
          )}
        >
          Next <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
