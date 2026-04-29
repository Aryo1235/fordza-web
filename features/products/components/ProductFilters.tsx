"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
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

  const pushParams = useCallback((newParams: URLSearchParams) => {
    newParams.set("page", "1");
    router.push(`/products?${newParams.toString()}`);
  }, [router]);

  const toggleCategory = (catId: string) => {
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
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    pushParams(params);
  };

  const handlePriceSelect = (val: string) => {
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

  const clearFilters = () => router.push("/products");
  const hasFilters = searchParams.size > 0 && !(searchParams.size === 1 && searchParams.has("page"));

  const currentGender = searchParams.get("gender");
  const selectedCategories = searchParams.getAll("categoryId");
  
  const minP = searchParams.get("minPrice") || "0";
  const maxP = searchParams.get("maxPrice") || "";
  const currentPriceRange = maxP ? `${minP}-${maxP}` : minP === "800000" ? "800000-" : "all";

  // Gunakan fungsi biasa, bukan komponen React (agar tidak re-create component type)
  const renderFilterContent = () => (
    <div className="flex flex-col pb-28">
      <div className="px-2 space-y-6">
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

        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters} className="mt-6 text-zinc-400 hover:text-red-500 justify-start px-2 font-black text-[10px] uppercase tracking-widest">
            <X className="size-3 mr-2" /> Reset
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <section className="p-2">
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
          <SheetContent side="left" className="w-full sm:w-[350px] overflow-y-auto">
            <SheetHeader className="text-left mb-8">
              <SheetTitle className="text-2xl font-black italic uppercase tracking-tighter text-[var(--fordza-brown)]">FILTERS</SheetTitle>
            </SheetHeader>
            {renderFilterContent()}
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:block pr-4 max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--fordza-cream-dark)]">
        <div className="mb-6 pb-4 border-b-2 border-zinc-50 flex items-center justify-between sticky top-0 bg-[#FDFCFB]/80 backdrop-blur-sm z-10">
           <h3 className="text-xl font-black italic tracking-tighter text-[var(--fordza-brown)] uppercase">Filter</h3>
           <Filter className="size-4 text-zinc-300" />
        </div>
        {renderFilterContent()}
      </div>
    </section>
  );
}
