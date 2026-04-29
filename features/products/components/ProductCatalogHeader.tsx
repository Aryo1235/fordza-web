"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X, ArrowDownWideNarrow, Check, Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

export function ProductCatalogHeader({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const getCategoryName = useCallback((id: string) => {
    return categories.find((c) => c.id === id)?.name || id;
  }, [categories]);

  const [searchValue, setSearchValue] = useState(searchParams.get("search") || "");

  // Debounce effect: sync local state to URL search params
  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get("search") || "";
      if (searchValue === currentSearch) return;

      const params = new URLSearchParams(searchParams.toString());
      if (searchValue) params.set("search", searchValue);
      else params.delete("search");

      params.set("page", "1");
      router.push(`/products?${params.toString()}`, { scroll: false });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue, router, searchParams]);

  // Sync back if URL changes (e.g. from back button or clear)
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "");
  }, [searchParams]);

  const removeFilter = useCallback((key: string, value?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      const existing = params.getAll(key);
      params.delete(key);
      existing.filter(v => v !== value).forEach(v => params.append(key, v));
    } else {
      params.delete(key);
    }
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const updateSort = useCallback((val: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === "latest") params.delete("sortBy");
    else params.set("sortBy", val);
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const toggleStatus = useCallback((status: "popular" | "bestseller" | "new") => {
    const params = new URLSearchParams(searchParams.toString());
    const paramName = status === "popular" ? "isPopular" : status === "bestseller" ? "isBestseller" : "isNew";
    const current = params.get(paramName) === "true";

    params.delete("isPopular");
    params.delete("isBestseller");
    params.delete("isNew");

    if (!current) params.set(paramName, "true");

    params.set("page", "1");
    router.push(`/products?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const categoryIds = useMemo(() => searchParams.getAll("categoryId"), [searchParams]);
  const gender = useMemo(() => searchParams.get("gender"), [searchParams]);
  const isPopular = useMemo(() => searchParams.get("isPopular") === "true", [searchParams]);
  const isBestseller = useMemo(() => searchParams.get("isBestseller") === "true", [searchParams]);
  const isNew = useMemo(() => searchParams.get("isNew") === "true", [searchParams]);
  const sortBy = useMemo(() => searchParams.get("sortBy") || "latest", [searchParams]);

  const currentStatus = useMemo(() => isPopular ? "popular" : isBestseller ? "bestseller" : isNew ? "new" : null, [isPopular, isBestseller, isNew]);

  const title = useMemo(() => {
    if (categoryIds.length === 1) return getCategoryName(categoryIds[0]);
    if (isPopular) return "Produk Terpopuler";
    if (isBestseller) return "Produk Terlaris";
    if (isNew) return "Produk Terbaru";
    return "Semua Produk";
  }, [categoryIds, isPopular, isBestseller, isNew, getCategoryName]);

  return (
    <div className="mb-10 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 ">
          <h1 className="text-3xl font-black italic tracking-tighter text-[var(--fordza-brown)] uppercase lg:text-4xl mb-2">
            {title}
          </h1>
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between mt-4">
            {/* Search Input - Debounced */}
            <div className="relative w-full lg:flex-1 lg:max-w-xl group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-300 group-focus-within:text-[var(--fordza-brown)] transition-colors" />
              <input
                type="text"
                placeholder="Cari produk impianmu..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-100 rounded-xl text-sm font-bold text-zinc-600 focus:outline-none focus:border-[var(--fordza-brown)] focus:ring-4 focus:ring-[var(--fordza-brown)]/5 transition-all shadow-sm"
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

            {/* Sorting Dropdown */}
            <div className="flex items-center justify-end lg:justify-end gap-3 w-full lg:w-auto border-t lg:border-none pt-4 lg:pt-0 border-zinc-50">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Urutkan</span>
              <Select value={sortBy} onValueChange={updateSort}>
                <SelectTrigger className="w-[150px] sm:w-[180px] h-10 rounded-xl border-zinc-100 bg-white font-bold text-xs text-zinc-600 focus:ring-0 shadow-sm group">
                  <ArrowDownWideNarrow
                    className={cn(
                      "mr-2 size-4 text-[var(--fordza-brown)] transition-transform duration-500 ease-in-out",
                      (sortBy === "expensive" || sortBy === "oldest") && "rotate-180"
                    )}
                  />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
                  <SelectItem value="latest" className="text-xs font-bold">Terbaru</SelectItem>
                  <SelectItem value="oldest" className="text-xs font-bold">Terlama</SelectItem>
                  <SelectItem value="cheapest" className="text-xs font-bold">Harga Terendah</SelectItem>
                  <SelectItem value="expensive" className="text-xs font-bold">Harga Tertinggi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

        </div>


      </div>

      {/* Koleksi - DI BAWAH JUDUL (Quick Filters) */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <StatusBtn active={currentStatus === "popular"} onClick={() => toggleStatus("popular")}>Terpopuler</StatusBtn>
          <StatusBtn active={currentStatus === "bestseller"} onClick={() => toggleStatus("bestseller")}>Terlaris</StatusBtn>
          <StatusBtn active={currentStatus === "new"} onClick={() => toggleStatus("new")}>Terbaru</StatusBtn>
        </div>
      </div>

      {/* Active Filter Badges */}
      {(categoryIds.length > 0 || gender || searchParams.get("search")) && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-50">
          {searchParams.get("search") && (
            <Badge variant="secondary" className="bg-[#4A3B2E] text-white border-none px-3 py-1 rounded-full text-[10px] font-bold">
              Pencarian: "{searchParams.get("search")}"
              <X className="ml-2 size-3 cursor-pointer hover:text-red-400" onClick={() => removeFilter("search")} />
            </Badge>
          )}
          {categoryIds.map((id) => (
            <Badge key={id} variant="secondary" className="bg-[#FEF4E8] text-[var(--fordza-brown)] border-none px-3 py-1 rounded-full text-[10px] font-bold">
              Kategori: {getCategoryName(id)}
              <X className="ml-2 size-3 cursor-pointer hover:text-red-500" onClick={() => removeFilter("categoryId", id)} />
            </Badge>
          ))}
          {gender && (
            <Badge variant="secondary" className="bg-[#FEF4E8] text-[var(--fordza-brown)] border-none px-3 py-1 rounded-full text-[10px] font-bold">
              Gender: {gender}
              <X className="ml-2 size-3 cursor-pointer hover:text-red-500" onClick={() => removeFilter("gender")} />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBtn({ children, active, onClick }: { children: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border",
        active
          ? "bg-[var(--fordza-brown)] text-white border-[var(--fordza-brown)] shadow-lg shadow-zinc-200"
          : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
      )}
    >
      {children}
      {active && <Check className="size-3" />}
    </button>
  );
}
