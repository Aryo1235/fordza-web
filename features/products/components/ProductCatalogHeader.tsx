"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { X, ArrowDownWideNarrow, Check, Search, ArrowDown, MoveDown } from "lucide-react";
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

  // Debounce: sync local state to URL search params
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

  const currentStatus = useMemo(
    () => isPopular ? "popular" : isBestseller ? "bestseller" : isNew ? "new" : null,
    [isPopular, isBestseller, isNew]
  );

  const [optimisticStatus, setOptimisticStatus] = useState<string | null>(currentStatus);

  useEffect(() => {
    setOptimisticStatus(currentStatus);
  }, [currentStatus]);

  const toggleStatusOptimistic = useCallback((status: "popular" | "bestseller" | "new") => {
    setOptimisticStatus(prev => prev === status ? null : status);
    toggleStatus(status);
  }, [toggleStatus]);

  const title = useMemo(() => {
    if (isPopular) return "Produk Terpopuler";
    if (isBestseller) return "Produk Terlaris";
    if (isNew) return "Produk Terbaru";
    if (categoryIds.length === 1) return getCategoryName(categoryIds[0]);
    return "Semua Produk";
  }, [categoryIds, isPopular, isBestseller, isNew, getCategoryName]);


  const hasActiveBadges = categoryIds.length > 0 || gender || searchParams.get("search");

  return (
    <div className="mb-10 flex flex-col gap-4">

      {/* ── Baris 1 ─────────────────────────────────────────────────────────
          Mobile   : Judul saja (full width)
          Tablet   : Judul + Sort dropdown bersebelahan (justify-between)
          Desktop  : Judul saja — sort akan ikut search di baris berikutnya
      ──────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-black italic tracking-tighter text-[var(--fordza-brown)] uppercase lg:text-4xl">
          {title}
        </h1>

        {/* Sort tampil di baris judul HANYA saat tablet (md) — sembunyi di mobile & desktop */}
        <div className="hidden md:flex lg:hidden">
          <SortDropdown sortBy={sortBy} updateSort={updateSort} />
        </div>
      </div>

      {/* ── Baris 2 ─────────────────────────────────────────────────────────
          Mobile   : Search full width (sort di baris sendiri di bawah)
          Tablet   : Search full width
          Desktop  : Search (flex-1) + Sort (fixed) satu baris inline
      ──────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-300 group-focus-within:text-[var(--fordza-brown)] transition-colors" />
          <input
            type="text"
            placeholder="Cari produk impianmu..."
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

        {/* Sort tampil inline dengan search HANYA saat desktop (lg+) */}
        <div className="hidden lg:flex flex-shrink-0">
          <SortDropdown sortBy={sortBy} updateSort={updateSort} />
        </div>
      </div>

      {/* ── Baris 3 ─────────────────────────────────────────────────────────
          Mobile   : Quick filter chips — scroll horizontal agar tidak wrap
          Tablet+  : Quick filter chips — wrap normal
      ──────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto md:overflow-x-visible md:flex-wrap scrollbar-hide pb-0.5">
        <StatusBtn active={optimisticStatus === "popular"} onClick={() => toggleStatusOptimistic("popular")}>Terpopuler</StatusBtn>
        <StatusBtn active={optimisticStatus === "bestseller"} onClick={() => toggleStatusOptimistic("bestseller")}>Terlaris</StatusBtn>
        <StatusBtn active={optimisticStatus === "new"} onClick={() => toggleStatusOptimistic("new")}>Terbaru</StatusBtn>
      </div>

      {/* ── Baris 4 ─────────────────────────────────────────────────────────
          Mobile ONLY: Sort full width, di bawah quick filters
      ──────────────────────────────────────────────────────────────────── */}
      <div className="flex md:hidden">
        <SortDropdown sortBy={sortBy} updateSort={updateSort} className="w-full" />
      </div>

      {/* ── Baris 5 (kondisional) ────────────────────────────────────────────
          Semua breakpoint: Active filter badges
      ──────────────────────────────────────────────────────────────────── */}
      {hasActiveBadges && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-zinc-100">
          {searchParams.get("search") && (
            <Badge variant="secondary" className="bg-[#4A3B2E] text-white border-none px-3 py-1 rounded-full text-[10px] font-bold">
              Pencarian: &ldquo;{searchParams.get("search")}&rdquo;
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

function StatusBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border flex-shrink-0",
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

interface SortDropdownProps {
  sortBy: string;
  updateSort: (val: string) => void;
  className?: string;
}

function SortDropdown({ sortBy, updateSort, className }: SortDropdownProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select value={sortBy} onValueChange={updateSort}>
        <SelectTrigger
          className={cn(
            "h-10 rounded-xl border-zinc-100 bg-white font-bold text-xs text-zinc-600 focus:ring-0 shadow-sm w-45 md:w-56",

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
          <SelectItem value="oldest" className="text-xs font-bold">Terlama</SelectItem>
          <SelectItem value="cheapest" className="text-xs font-bold">Harga Terendah</SelectItem>
          <SelectItem value="expensive" className="text-xs font-bold">Harga Tertinggi</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
