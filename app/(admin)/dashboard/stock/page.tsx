"use client";

import { useState, useMemo } from "react";
import { useProductsAdmin } from "@/features/products";
import { useBulkUpdateStock } from "@/features/admin/stock";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Save,
  RotateCcw,
  Package,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  ChevronRight,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/download";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/shared/Pagination";

export default function StockOpnamePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Focus Mode: Menyimpan satu ID produk yang sedang dibuka (null = tertutup semua)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // State untuk menyimpan perubahan stok lokal sebelum di-save (key: skuId)
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});

  const { data, isLoading } = useProductsAdmin({ page, limit, search });
  const bulkUpdateMutation = useBulkUpdateStock();

  const products = data?.data || [];
  const hasChanges = Object.keys(stockChanges).length > 0;

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleStockChange = (skuId: string, newStock: string) => {
    const val = parseInt(newStock);
    if (isNaN(val)) return;

    setStockChanges((prev) => ({
      ...prev,
      [skuId]: val,
    }));
  };

  const handleSave = () => {
    const items = Object.entries(stockChanges).map(([id, stock]) => ({
      id,
      stock,
    }));

    bulkUpdateMutation.mutate(items, {
      onSuccess: () => {
        toast.success("Stok Opname berhasil disimpan");
        setStockChanges({});
      },
      onError: () => toast.error("Gagal menyimpan stok opname"),
    });
  };

  const resetChanges = () => setStockChanges({});

  return (
    <div className="p-4 md:p-8 mx-auto space-y-6 flex flex-col bg-stone-50/20 min-h-screen">
      <PageHeader
        title="Stock Opname (SKU-Centric)"
        description="Audit dan perbarui stok fisik per ukuran secara akurat. Data yang diubah akan otomatis merekap total stok produk induk."
        action={
          <div className="flex gap-3">
            {hasChanges && (
              <Button
                variant="outline"
                onClick={resetChanges}
                disabled={bulkUpdateMutation.isPending}
                className="border-stone-200 text-stone-600"
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || bulkUpdateMutation.isPending}
              className="bg-[#3C3025] hover:bg-[#524132] text-white gap-2 shadow-lg"
            >
              {bulkUpdateMutation.isPending ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan {Object.keys(stockChanges).length} Item
                </>
              )}
            </Button>
          </div>
        }
      />

      {/* Stats & Export */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-[10px] uppercase tracking-wider"
            onClick={() => downloadFile("/api/admin/products/export", "Stok_Opname.xlsx", { search, format: "xlsx" })}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-2 text-green-600" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-[10px] uppercase tracking-wider"
            onClick={() => downloadFile("/api/admin/products/export", "Stok_Opname.pdf", { search, format: "pdf" })}
          >
            <FileText className="w-3.5 h-3.5 mr-2 text-red-600" />
            Export PDF
          </Button>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-full text-amber-700 text-[10px] font-black uppercase inline-flex animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            Terdapat {Object.keys(stockChanges).length} perubahan siap simpan
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            placeholder="Cari nama produk atau kode untuk opname..."
            className="pl-10 h-11 border-stone-200 bg-stone-50/50 focus:bg-white transition-all shadow-inner"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Main Opname Table */}
      <div className="flex-1 min-h-[500px]">
        <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="grid grid-cols-[1fr_150px_150px] bg-stone-50 border-b border-stone-100 py-3 px-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">
            <div>Informasi Produk</div>
            <div className="text-center">Stok Sistem</div>
            <div className="text-right">Aksi Audit</div>
          </div>

          <div className="divide-y divide-stone-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-6 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-stone-400 font-medium italic">
                Produk tidak ditemukan untuk opname.
              </div>
            ) : (
              products.map((product: any) => {
                const isExpanded = expandedId === product.id;
                
                // Hitung berapa banyak SKU produk ini yang sudah di-input perubahannya
                const modifiedSkuCount = product.variants.reduce((total: number, variant: any) => {
                  return total + variant.skus.filter((sku: any) => stockChanges[sku.id] !== undefined).length;
                }, 0);
                
                return (
                  <div key={product.id} className="transition-all relative">
                    {/* Header Row (Product) - Sticky when expanded */}
                    <div className={cn(
                      "grid grid-cols-[1fr_150px_150px] items-center py-4 px-6 gap-4 hover:bg-stone-50/50 cursor-pointer group transition-all",
                      isExpanded && "bg-white border-b border-stone-200 sticky top-0 z-20 shadow-sm"
                    )} onClick={() => toggleExpand(product.id)}>
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors border",
                          isExpanded ? "bg-[#3C3025] text-white border-transparent" : "bg-stone-50 text-stone-400 border-stone-100 group-hover:bg-stone-100"
                        )}>
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-mono text-[9px] font-bold text-stone-400 uppercase leading-none mb-1">
                            {product.productCode}
                          </p>
                          <h3 className="font-bold text-stone-800 text-sm truncate">{product.name}</h3>
                        </div>
                      </div>

                      <div className="text-center flex flex-col items-center gap-1">
                        <Badge variant="outline" className={cn(
                          "font-bold bg-white transition-colors",
                          isExpanded ? "border-[#3C3025] text-[#3C3025]" : "border-stone-200 text-stone-500"
                        )}>
                          {product.stock} Unit
                        </Badge>
                        {modifiedSkuCount > 0 && !isExpanded && (
                          <span className="text-[8px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                            {modifiedSkuCount} Stock Diubah
                          </span>
                        )}
                      </div>

                      <div className="flex justify-end items-center gap-3">
                        {modifiedSkuCount > 0 && isExpanded && (
                          <div className="hidden sm:flex items-center gap-1 text-[9px] font-black text-amber-600 uppercase">
                            <CheckCircle2 className="w-3 h-3" /> {modifiedSkuCount} Perubahan
                          </div>
                        )}
                        <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase text-stone-400 hover:text-[#3C3025] hover:bg-white border-transparent hover:border-stone-200 border">
                          {isExpanded ? "Fokus Selesai" : `Cek ${product.variants.reduce((acc: number, v: any) => acc + v.skus.length, 0)} Ukuran`}
                        </Button>
                      </div>
                    </div>

                    {/* Expandable Section (Grouped by Variant) */}
                    {isExpanded && (
                      <div className="bg-stone-50 px-6 py-5 border-t border-stone-100/50 space-y-6">
                        {product.variants.map((variant: any) => (
                          <div key={variant.id} className="space-y-3">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-[#3C3025] text-white hover:bg-[#3C3025] px-3">
                                {variant.color}
                              </Badge>
                              <span className="font-mono text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                Kode Varian: {variant.variantCode || "TIDAK ADA KODE"}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {variant.skus.map((sku: any) => {
                                const hasChange = stockChanges[sku.id] !== undefined;
                                
                                return (
                                  <div key={sku.id} className={cn(
                                    "bg-white p-3 rounded-xl border-2 transition-all flex items-center justify-between shadow-sm",
                                    hasChange ? "border-amber-400 shadow-amber-100/50" : "border-transparent"
                                  )}>
                                    <div className="space-y-0.5">
                                      <p className="text-xs font-black text-[#3C3025]">
                                        Ukuran {sku.size}
                                      </p>
                                      <p className="text-[10px] text-stone-400 font-medium italic">
                                        Stok: <span className="font-bold text-stone-600">{sku.stock}</span>
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      {hasChange && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                      )}
                                      <Input
                                        type="number"
                                        value={hasChange ? stockChanges[sku.id] : sku.stock}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleStockChange(sku.id, e.target.value)}
                                        className={cn(
                                          "w-16 h-9 text-center font-bold text-sm",
                                          hasChange ? "bg-amber-50 border-amber-300 shadow-inner" : "bg-white border-stone-200"
                                        )}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Improved Pagination Footer */}
        {data?.meta && (
          <div className="mt-4 flex justify-center">
            <Pagination
              page={page}
              totalPages={data.meta.totalPage}
              totalItems={data.meta.totalItems}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* Guidelines Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="p-4 bg-[#3C3025]/5 border border-[#3C3025]/10 rounded-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-125 transition-transform">
            <Layers className="w-12 h-12 text-[#3C3025]" />
          </div>
          <h4 className="text-[10px] font-black text-[#3C3025] uppercase tracking-widest mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3" /> Info Stok Opname
          </h4>
          <p className="text-xs text-stone-600 leading-relaxed max-w-sm">
            Inputlah angka sesuai dengan jumlah fisik barang yang ada di gudang. Sistem akan secara otomatis menghitung selisih dan melakukan audit stok.
          </p>
        </div>
      </div>
    </div>
  );
}
