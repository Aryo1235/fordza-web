"use client";
// features/promo/components/PromoHeader.tsx
// Header search + sort untuk halaman promo (lebih sederhana dari ProductCatalogHeader)

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, X, MoveDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function PromoHeader() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  // Debounce search → sync ke URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get("search") || "";
      if (searchValue === current) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) params.set("search", searchValue);
      else params.delete("search");
      params.set("page", "1");

      router.push(`/promo?${params.toString()}`, { scroll: false });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, router, searchParams]);

  // Sync back jika URL berubah (tombol back, dll.)
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const sortBy = useMemo(
    () => searchParams.get("sortBy") || "latest",
    [searchParams]
  );

  const updateSort = useCallback(
    (val: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (val === "latest") params.delete("sortBy");
      else params.set("sortBy", val);
      params.set("page", "1");
      router.push(`/promo?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <div className="mb-8 flex flex-col gap-4">
      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-300 group-focus-within:text-[var(--fordza-brown)] transition-colors" />
          <input
            type="text"
            id="promo-search"
            placeholder="Cari produk promo..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-zinc-100 rounded-xl text-sm font-bold text-zinc-600 focus:outline-none focus:border-[var(--fordza-brown)] focus:ring-4 focus:ring-[var(--fordza-brown)]/5 transition-all shadow-sm"
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-100 rounded-full transition-colors"
            >
              <X className="size-3 text-zinc-400" />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex-shrink-0">
          <Select value={sortBy} onValueChange={updateSort}>
            <SelectTrigger
              className={cn(
                "h-10 rounded-xl border-zinc-100 bg-white font-bold text-xs text-zinc-600 focus:ring-0 shadow-sm w-45 md:w-52"
              )}
            >
              <MoveDown
                className={cn(
                  "mr-2 size-4 text-[var(--fordza-brown)] transition-transform duration-500 ease-in-out",
                  (sortBy === "expensive" || sortBy === "oldest") && "rotate-180"
                )}
              />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
              <SelectItem value="latest" className="text-xs font-bold">Terbaru</SelectItem>
              <SelectItem value="cheapest" className="text-xs font-bold">Harga Terendah</SelectItem>
              <SelectItem value="expensive" className="text-xs font-bold">Harga Tertinggi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
