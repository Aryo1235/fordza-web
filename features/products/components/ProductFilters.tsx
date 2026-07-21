"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCallback, useState, useEffect } from "react";
import { Filter, X, SlidersHorizontal, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  categories: Category[];
}

export function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // === Optimistic state: langsung update UI tanpa tunggu server ===
  const getServerCategories = () => searchParams.getAll("categoryId");
  const getServerGender = () => searchParams.get("gender");
  const getServerPriceRange = () => {
    const minP = searchParams.get("minPrice") || "0";
    const maxP = searchParams.get("maxPrice") || "";
    return maxP ? `${minP}-${maxP}` : minP === "800000" ? "800000-" : "all";
  };

  const [selectedCategories, setSelectedCategories] = useState<string[]>(getServerCategories);
  const [currentGender, setCurrentGender] = useState<string | null>(getServerGender);
  const [currentPriceRange, setCurrentPriceRange] = useState<string>(getServerPriceRange);

  // Sync kembali jika navigasi selesai (misal back button / clear filter)
  useEffect(() => {
    setSelectedCategories(getServerCategories());
    setCurrentGender(getServerGender());
    setCurrentPriceRange(getServerPriceRange());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const pushParams = useCallback((newParams: URLSearchParams) => {
    newParams.set("page", "1");
    router.push(`/products?${newParams.toString()}`);
  }, [router]);

  const toggleCategory = (catId: string) => {
    // 1. Update UI langsung (optimistic)
    setSelectedCategories(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
    // 2. Push ke URL
    const params = new URLSearchParams(searchParams.toString());
    const existing = params.getAll("categoryId");
    params.delete("categoryId");
    if (existing.includes(catId)) {
      existing.filter(id => id !== catId).forEach(id => params.append("categoryId", id));
    } else {
      [...existing, catId].forEach(id => params.append("categoryId", id));
    }
    pushParams(params);
  };

  const updateParam = (name: string, value: string | null) => {
    // Optimistic untuk gender
    if (name === "gender") setCurrentGender(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    pushParams(params);
  };

  const handlePriceSelect = (val: string) => {
    // Optimistic untuk price
    setCurrentPriceRange(val);
    const params = new URLSearchParams(searchParams.toString());
    if (val === "all") {
      params.delete("minPrice");
      params.delete("maxPrice");
    } else {
      const [min, max] = val.split("-");
      if (min) params.set("minPrice", min); else params.delete("minPrice");
      if (max) params.set("maxPrice", max); else params.delete("maxPrice");
    }
    pushParams(params);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setCurrentGender(null);
    setCurrentPriceRange("all");
    router.push("/products");
  };

  const hasFilters = searchParams.size > 0 && !(searchParams.size === 1 && searchParams.has("page"));

  // Gunakan fungsi biasa, bukan komponen React (agar tidak re-create component type)
  const renderFilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Price Range */}
      <div className="flex flex-col gap-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--fordza-brown)]/40 flex items-center gap-2">
           <Banknote className="size-3" /> Rentang Harga
        </h4>
        <Select value={currentPriceRange} onValueChange={handlePriceSelect}>
          <SelectTrigger className="w-full h-11 rounded-xl border-zinc-100 bg-white font-bold text-sm text-[var(--fordza-brown)]">
            <SelectValue placeholder="Pilih Harga" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-zinc-100 shadow-xl">
            <SelectItem value="all" className="font-bold">Semua Harga</SelectItem>
            <SelectItem value="0-150000">Rp 0 - Rp 150rb</SelectItem>
            <SelectItem value="150000-300000">Rp 150rb - Rp 300rb</SelectItem>
            <SelectItem value="300000-500000">Rp 300rb - Rp 500rb</SelectItem>
            <SelectItem value="500000-800000">Rp 500rb - Rp 800rb</SelectItem>
            <SelectItem value="800000-">Di atas Rp 800rb</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gender */}
      <div className="flex flex-col gap-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--fordza-brown)]/40">Gender</h4>
        <div className="grid grid-cols-3 gap-2">
          {["Pria", "Wanita", "Unisex"].map((g) => (
            <button 
              key={g} 
              onClick={() => updateParam("gender", currentGender === g ? null : g)}
              className={cn("px-2 py-2 rounded-xl text-[11px] font-bold transition-all border", currentGender === g ? "bg-[var(--fordza-cream)] text-[var(--fordza-brown)] border-[var(--fordza-brown)]" : "bg-white text-zinc-500 border-zinc-100 hover:border-zinc-200")}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--fordza-brown)]/40 font-tick">Kategori</h4>
        <div className="flex flex-col gap-3 py-1">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center space-x-3 group cursor-pointer" onClick={() => toggleCategory(cat.id)}>
              <Checkbox 
                id={cat.id} 
                checked={selectedCategories.includes(cat.id)}
                onCheckedChange={() => toggleCategory(cat.id)}
                className="size-5 rounded-md border-zinc-200 data-[state=checked]:bg-[var(--fordza-brown)] data-[state=checked]:border-[var(--fordza-brown)]"
              />
              <Label htmlFor={cat.id} className={cn("text-xs font-bold leading-none cursor-pointer group-hover:text-[var(--fordza-brown)] transition-colors", selectedCategories.includes(cat.id) ? "text-[var(--fordza-brown)] font-black" : "text-zinc-600")}>
                {cat.name}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <section className="p-2">
      {/* Mobile view */}
      <div className="lg:hidden mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-2">
           <SlidersHorizontal className="size-5 text-[var(--fordza-brown)]" />
           <span className="font-bold text-sm">Filter Produk</span>
           {hasFilters && <span className="size-2 rounded-full bg-red-500" />}
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-lg h-9 font-bold bg-[#FEF4E8]/30">Ubah</Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:w-[350px] flex flex-col h-full p-0">
            <SheetHeader className="text-left p-6 pb-4 border-b border-zinc-100">
              <SheetTitle className="text-xl font-black italic uppercase tracking-tighter text-[var(--fordza-brown)]">FILTERS</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {renderFilterContent()}
            </div>
            {/* Sticky Footer untuk Mobile */}
            <div className="p-4 border-t border-zinc-100 bg-[#FDFCFB] flex items-center">
              <Button 
                variant="ghost" 
                onClick={clearFilters} 
                disabled={!hasFilters}
                className="w-full text-zinc-400 hover:text-red-500 hover:bg-red-50 justify-center h-11 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
              >
                <X className="size-3.5 mr-2" /> Reset Filter
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop view */}
      <div className="hidden lg:flex lg:flex-col lg:h-[calc(100vh-120px)] pr-4">
        <div className="mb-6 pb-4 border-b-2 border-zinc-50 flex items-center justify-between sticky top-0 bg-[#FDFCFB]/80 backdrop-blur-sm z-10">
           <h3 className="text-xl font-black italic tracking-tighter text-[var(--fordza-brown)] uppercase">Filter</h3>
           <Filter className="size-4 text-zinc-300" />
        </div>
        <div className="flex-1 overflow-y-auto pr-1 pb-4 scrollbar-thin scrollbar-thumb-[var(--fordza-cream-dark)]">
          {renderFilterContent()}
        </div>
        {/* Sticky Footer untuk Desktop */}
        <div className="pt-4 border-t-2 border-zinc-50 flex items-center bg-[#FDFCFB]/80 backdrop-blur-sm sticky bottom-0">
          <Button 
            variant="ghost" 
            onClick={clearFilters} 
            disabled={!hasFilters}
            className="w-full text-zinc-400 hover:text-red-500 hover:bg-red-50 justify-center h-10 font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:bg-transparent"
          >
            <X className="size-3.5 mr-2" /> Reset Filter
          </Button>
        </div>
      </div>
    </section>
  );
}
