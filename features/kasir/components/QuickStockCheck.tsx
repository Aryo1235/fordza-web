"use client";

import { useState, useEffect } from "react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Package } from "lucide-react";
import { useKasirProducts } from "../hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";

interface QuickStockCheckProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickStockCheck({ isOpen, onClose }: QuickStockCheckProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  
  // Ambil data produk menggunakan hook yang sudah ada
  const { data: productsData, isLoading } = useKasirProducts(debouncedSearch, isOpen);
  
  // Ratakan data dari infinite query
  const products = productsData?.pages.flatMap((page) => page.data) || [];

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-stone-700">
            <Package className="w-5 h-5" />
            Cek Stok Cepat
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 bg-stone-50 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Ketik Kode Produk atau Nama Barang..."
              className="pl-10 h-11 bg-white border-stone-200 focus-visible:ring-stone-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto">
          {products.length === 0 && !isLoading ? (
            <div className="p-12 text-center text-stone-400">
              <p className="text-sm">Tidak ada produk ditemukan untuk "{search}"</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {products.map((product) => (
                <div key={product.id} className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div className="space-y-1">
                    <p className="text-xs font-mono font-bold text-stone-400 uppercase">
                      {product.productCode || "TANPA KODE"}
                    </p>
                    <p className="text-sm font-semibold text-stone-800">{product.name}</p>
                    <p className="text-xs text-stone-500">{product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500 mb-1">Stok Fisik</p>
                    <div className={cn(
                      "inline-flex items-center justify-center px-2.5 py-1 rounded-sm text-sm font-bold min-w-[40px]",
                      product.stock <= 5 
                        ? "bg-red-100 text-red-700" 
                        : "bg-stone-100 text-stone-700"
                    )}>
                      {product.stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 bg-stone-100 border-t flex justify-between items-center text-[10px] text-stone-500 uppercase tracking-wider font-semibold">
          <span>Tekan ESC untuk menutup</span>
          <span>Fordza POS System</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
