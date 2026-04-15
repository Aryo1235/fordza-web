"use client";

import { useState } from "react";
import { useProductsAdmin } from "@/features/products";
import { useBulkUpdateStock } from "@/features/stock";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { DataTable } from "@/components/shared/DataTable";
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/download";

export default function StockOpnamePage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // State untuk menyimpan perubahan stok lokal sebelum di-save
  const [stockChanges, setStockChanges] = useState<Record<string, number>>({});

  const { data, isLoading } = useProductsAdmin({ page, limit, search });
  const bulkUpdateMutation = useBulkUpdateStock();

  const products = data?.data || [];
  const hasChanges = Object.keys(stockChanges).length > 0;

  const handleExportExcel = async () => {
    await downloadFile(
      "/api/admin/products/export",
      "Laporan_Stok_Opname_Fordza.xlsx",
      {
        search,
        format: "xlsx",
      },
    );
  };

  const handleExportPDF = async () => {
    await downloadFile(
      "/api/admin/products/export",
      "Laporan_Stok_Opname_Fordza.pdf",
      {
        search,
        format: "pdf",
      },
    );
  };

  const handleStockChange = (id: string, newStock: string) => {
    const val = parseInt(newStock);
    if (isNaN(val)) return;

    setStockChanges((prev) => ({
      ...prev,
      [id]: val,
    }));
  };

  const handleSave = () => {
    const items = Object.entries(stockChanges).map(([id, stock]) => ({
      id,
      stock,
    }));

    bulkUpdateMutation.mutate(items, {
      onSuccess: () => {
        toast.success("Stok berhasil diperbarui");
        setStockChanges({});
      },
      onError: () => toast.error("Gagal memperbarui stok"),
    });
  };

  const resetChanges = () => setStockChanges({});

  const columns = [
    {
      header: "Produk",
      cell: (p: any) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded border bg-stone-50 flex items-center justify-center text-stone-400">
            {p.images?.[0]?.url ? (
              <img
                src={p.images[0].url}
                alt=""
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <Package className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-mono text-[10px] font-bold text-stone-400 uppercase leading-none mb-1">
              {p.productCode || "TANPA KODE"}
            </p>
            <p className="font-semibold text-stone-800 text-sm leading-tight">
              {p.name}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Stok Saat Ini",
      cell: (p: any) => (
        <span
          className={cn(
            "font-bold text-sm px-2 py-1 rounded",
            p.stock <= 5
              ? "bg-red-50 text-red-600"
              : "bg-stone-50 text-stone-600",
          )}
        >
          {p.stock} Unit
        </span>
      ),
    },
    {
      header: "Stok Barang Riil (Update)",
      className: "w-[200px]",
      cell: (p: any) => (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min="0"
            className={cn(
              "h-9 w-24 text-center font-bold",
              stockChanges[p.id] !== undefined &&
                "border-amber-400 bg-amber-50",
            )}
            value={
              stockChanges[p.id] !== undefined ? stockChanges[p.id] : p.stock
            }
            onChange={(e) => handleStockChange(p.id, e.target.value)}
          />
          {stockChanges[p.id] !== undefined && (
            <span className="text-[10px] font-bold text-amber-600 uppercase">
              Input
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-8  mx-auto space-y-6 flex flex-col h-full">
      <PageHeader
        title="Stok Opname"
        description="Perbarui stok fisik barang secara cepat. Pastikan angka sesuai dengan barang riil di gudang."
        action={
          <div className="flex gap-10">
            {hasChanges && (
              <Button
                variant="ghost"
                onClick={resetChanges}
                disabled={bulkUpdateMutation.isPending}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={!hasChanges || bulkUpdateMutation.isPending}
              className="bg-[#3C3025] hover:bg-[#524132] text-white gap-2"
            >
              {bulkUpdateMutation.isPending ? (
                "Menyimpan..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Simpan{" "}
                  {Object.keys(stockChanges).length} Perubahan
                </>
              )}
            </Button>
          </div>
        }
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-10 border-green-200 text-green-700 hover:bg-green-50 font-bold text-xs"
          onClick={handleExportExcel}
          disabled={isLoading || products.length === 0}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Excel
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-10 border-red-200 text-red-700 hover:bg-red-50 font-bold text-xs"
          onClick={handleExportPDF}
          disabled={isLoading || products.length === 0}
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF
        </Button>
      </div>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 text-amber-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <p>
            Anda memiliki <strong>{Object.keys(stockChanges).length}</strong>{" "}
            perubahan stok yang belum disimpan. Klik "Simpan Perubahan" untuk
            memperbarui database.
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        <div className="relative w-full sm:max-w-md space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Cari Produk
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Ketik nama produk atau kode..."
              className="pl-9 h-10 border-stone-200 focus:ring-stone-200"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="hidden md:block py-2 px-4 bg-stone-50 rounded-lg border border-stone-100 italic text-[10px] font-bold text-stone-400 uppercase tracking-tight">
          Status: {search ? `Searching "${search}"` : "All Products"}
        </div>
      </div>

      <div className="border border-stone-200 rounded-xl shadow-sm  bg-white h-full">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            <Package className="w-3 h-3" />
            Inventory Audit & Adjustment ({data?.meta?.total || 0} Items)
          </p>
        </div>
        <DataTable
          columns={columns}
          data={products}
          isLoading={isLoading}
          meta={data?.meta}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          emptyMessage="Produk tidak ditemukan."
          className="space-y-0 [&_.rounded-md.border]:border-none [&_.rounded-md.border]:shadow-none [&_.rounded-md.border]:rounded-none"
        />
      </div>

      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl">
        <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">
          Petunjuk Stock Opname:
        </h4>
        <ul className="text-[11px] text-stone-400 space-y-1 list-disc pl-4">
          <li>
            Gunakan kolom{" "}
            <span className="text-stone-700 font-semibold">
              Stok Barang Riil
            </span>{" "}
            untuk memasukkan jumlah stok fisik yang ada saat ini.
          </li>
          <li>
            Baris yang diubah akan ditandai dengan warna{" "}
            <span className="text-amber-600 font-semibold">Kuning</span>.
          </li>
          <li>
            Klik tombol{" "}
            <span className="text-stone-700 font-semibold">
              Simpan Perubahan
            </span>{" "}
            di pojok kanan atas untuk menerapkan semua perubahan sekaligus.
          </li>
          <li>
            Perubahan stok ini bersifat override (mengganti angka lama), bukan
            increment/decrement.
          </li>
        </ul>
      </div>
    </div>
  );
}
