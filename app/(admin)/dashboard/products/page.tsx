"use client";

import { useState } from "react";
import { useProductsAdmin, useDeleteProduct } from "@/features/products";
import { DataTable } from "@/components/shared/DataTable";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ImageIcon,
  Package,
} from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useProductsAdmin({ page, limit, search });
  const deleteMutation = useDeleteProduct();

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      });
    }
  };

  const columns = [
    {
      header: "Produk",
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gray-100 overflow-hidden relative border">
            {item.images?.[0]?.url ? (
              <img
                src={item.images[0].url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <ImageIcon className="h-4 w-4" />
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-[#3C3025]">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              Kode Produk: {item.productCode}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Kategori",
      cell: (item: any) => (
        <div className="flex flex-wrap gap-1">
          {item.categories?.map((c: any) => (
            <span
              key={c.categoryId}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
            >
              {c.category?.name}
            </span>
          ))}
          {(!item.categories || item.categories.length === 0) && (
            <span className="text-muted-foreground text-xs">-</span>
          )}
        </div>
      ),
    },
    {
      header: "Spesifikasi",
      cell: (item: any) => (
        <div className="flex flex-col gap-0.5 min-w-[120px]">
          <span
            className="text-xs font-medium text-stone-700 truncate"
            title={item.detail?.material}
          >
            Mat: {item.detail?.material || "-"}
          </span>
          <span
            className="text-[10px] text-stone-500 truncate"
            title={item.detail?.outsole}
          >
            Sol: {item.detail?.outsole || "-"}
          </span>
        </div>
      ),
    },
    {
      header: "Varian & Stok",
      cell: (item: any) => {
        const variantCount = item.variants?.length || 0;
        return (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-[#3C3025]">
              {variantCount} Warna
            </span>
            <span
              className={
                item.stock <= 5 && item.stock > 0
                  ? "text-amber-600 text-xs font-medium"
                  : item.stock === 0
                    ? "text-red-500 text-xs font-semibold"
                    : "text-stone-500 text-xs"
              }
            >
              {item.stock} pasang
            </span>
          </div>
        );
      },
    },
    {
      header: "Harga Terendah",
      cell: (item: any) => {
        const variants = item.variants || [];

        // 1. Ambil harga default dari master produk
        let displayPrice = Number(item.price || 0);
        let originalPrice = null;
        let discountPct = 0;

        // 2. Jika punya varian, cari varian dengan basePrice (harga jual) termurah
        if (variants.length > 0) {
          const cheapestVariant = [...variants].sort(
            (a, b) => Number(a.basePrice) - Number(b.basePrice),
          )[0];

          displayPrice = Number(cheapestVariant.basePrice);

          // Cek apakah varian termurah ini sedang diskon (punya comparisonPrice yang lebih besar)
          if (
            cheapestVariant.comparisonPrice &&
            Number(cheapestVariant.comparisonPrice) > displayPrice
          ) {
            originalPrice = Number(cheapestVariant.comparisonPrice);
            // Gunakan discountPercent dari DB, atau hitung ulang manual jika null
            discountPct =
              cheapestVariant.discountPercent ||
              Math.round(
                ((originalPrice - displayPrice) / originalPrice) * 100,
              );
          }
        }

        return (
          <div className="flex flex-col">
            {/* Harga Jual Final */}
            <span className="font-bold whitespace-nowrap text-[#3C3025]">
              Rp {displayPrice.toLocaleString("id-ID")}
            </span>

            {/* Tampilkan Harga Coret Jika Ada Diskon */}
            {originalPrice && (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] line-through text-stone-400">
                  Rp {originalPrice.toLocaleString("id-ID")}
                </span>
                <span className="text-[10px] font-bold text-red-500">
                  -{Math.round(discountPct)}%
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      header: "Visibilitas",
      cell: (item: any) => <StatusBadge active={item.isActive} />,
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (item: any) => (
        <div className="flex justify-end gap-2">
          <Link href={`/dashboard/products/${item.id}/detail`}>
            <Button variant="ghost" size="icon" title="Lihat Detail Admin">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/dashboard/products/${item.id}`}>
            <Button variant="ghost" size="icon" title="Edit">
              <Edit className="h-4 w-4 text-blue-600" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            title="Hapus"
            onClick={() => setDeleteId(item.id)}
            className="hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title="Daftar Produk"
        description="Kelola semua produk toko Anda di sini."
        action={
          <Link href="/dashboard/products/new">
            <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
              <Plus className="mr-2 h-4 w-4" /> Tambah Produk
            </Button>
          </Link>
        }
      />

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm font-medium">
        <div className="relative w-full sm:max-w-md space-y-1.5 flex-1">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Cari Produk
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input
              placeholder="Ketik nama produk..."
              className="pl-9 h-10 border-stone-200 focus:ring-stone-200 text-sm"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="hidden md:block py-2 px-4 bg-stone-50 rounded-lg border border-stone-100 italic text-[10px] font-bold text-stone-400 uppercase tracking-tight">
          Inventory Status: Active
        </div>
      </div>

      <div className="border border-stone-200 rounded-xl shadow-sm overflow-hidden bg-white mb-6">
        <div className="bg-stone-50 border-b border-stone-100 py-3 px-6">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-tight flex items-center gap-2">
            <Package className="w-3 h-3 text-stone-400" />
            Product Master List Management ({data?.meta?.total || 0} Items)
          </p>
        </div>
        <DataTable
          columns={columns}
          data={data?.data || []}
          isLoading={isLoading}
          meta={data?.meta}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          className="space-y-0 [&_.rounded-md.border]:border-none [&_.rounded-md.border]:shadow-none [&_.rounded-md.border]:rounded-none"
        />
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(op) => !op && setDeleteId(null)}
        title="Hapus Produk"
        description="Apakah Anda yakin ingin menghapus produk ini? Produk hanya disembunyikan (soft delete) namun tidak bisa dibeli lagi."
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
