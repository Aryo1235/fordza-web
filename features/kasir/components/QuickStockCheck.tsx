"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Package, AlertTriangle } from "lucide-react";
import { useKasirStockCheck } from "../hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { cn, sanitizeSearch } from "@/lib/utils";

interface QuickStockCheckProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickStockCheck({
  isOpen,
  onClose,
}: QuickStockCheckProps) {
  const [search, setSearch] = useState("");
  
  // Sanitasi input pencarian dan trim whitespace ganda sebelum debouncing/API call
  const sanitizedSearch = sanitizeSearch(search).trim();
  const debouncedSearch = useDebounce(sanitizedSearch, 300);

  // Gunakan hook ringan khusus stock-check — tidak membawa variants/skus/promo
  const { data, isLoading, isFetching, isError, error } = useKasirStockCheck(debouncedSearch, isOpen);
  const products = data?.data || [];

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-137.5 p-0 overflow-hidden gap-0">
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
              maxLength={50}
              autoFocus
            />
            {isFetching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 animate-spin" />
            )}
          </div>
        </div>

        <div className="relative max-h-87.5 overflow-y-auto">
          {isError ? (
            <div className="p-12 text-center text-red-500 flex flex-col items-center gap-2 bg-stone-50/50">
              <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <p className="text-sm font-semibold">Gagal mengambil data stok</p>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                {error instanceof Error ? error.message : "Terjadi kesalahan pada server"}
              </p>
              {(error as any)?.traceId && (
                <p className="text-[10px] font-mono text-stone-400 mt-2 bg-stone-100 py-1 px-2 rounded inline-block select-all">
                  Trace ID: {(error as any).traceId}
                </p>
              )}
            </div>
          ) : isLoading && products.length === 0 ? (
            <div className="p-12 text-center text-stone-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-stone-500" />
              <p className="text-sm">Memuat stok...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <p className="text-sm">
                Tidak ada produk ditemukan untuk &ldquo;{search}&rdquo;
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {products.map((product: { id: string; productCode: string | null; name: string; category: string | null; stock: number }) => (
                <div
                  key={product.id}
                  className="p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-mono font-bold text-stone-400 uppercase">
                      {product.productCode || "TANPA KODE"}
                    </p>
                    <p className="text-sm font-semibold text-stone-800">
                      {product.name}
                    </p>
                    {product.category && (
                      <p className="text-xs text-stone-500">{product.category}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500 mb-1">Stok Fisik</p>
                    <div
                      className={cn(
                        "inline-flex items-center justify-center px-2.5 py-1 rounded-sm text-sm font-bold min-w-10",
                        product.stock <= 5
                          ? "bg-red-100 text-red-700"
                          : "bg-stone-100 text-stone-700",
                      )}
                    >
                      {product.stock}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isFetching && products.length > 0 && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center py-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold text-stone-500 shadow-sm border border-stone-200">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Memperbarui hasil...
              </div>
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
