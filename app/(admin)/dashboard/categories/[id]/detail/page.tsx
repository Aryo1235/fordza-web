"use client";

import { use, useState, useEffect } from "react";
import { useCategory } from "@/features/categories";
import { useProductsAdmin } from "@/features/products";
import { BreadcrumbsHeader } from "@/components/layout/admin/BreadcrumbsHeader";
import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Layers,
  Package,
  Search,
  Eye,
  AlertTriangle,
  ChevronRight,
  ImageIcon
} from "lucide-react";
import { toast } from "sonner";

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Category Details
  const {
    data: category,
    isLoading: isFetchingCategory,
    error: categoryError
  } = useCategory(id);

  // Fetch Category's Products
  const {
    data: productsData,
    isLoading: isFetchingProducts,
    error: productsError
  } = useProductsAdmin({
    categoryId: id,
    page,
    limit: 10,
    search: debouncedSearch,
  }, !!category);

  // Toast and console log errors if they occur
  useEffect(() => {
    if (categoryError) {
      const errMsg = (categoryError as any)?.response?.data?.message || (categoryError as any)?.message || "Gagal mengambil data kategori";
      const traceId = (categoryError as any)?.response?.data?.traceId;
      toast.error(errMsg);
      console.error(`Error loading category (Trace ID: ${traceId || "N/A"}):`, categoryError);
    }
  }, [categoryError]);

  useEffect(() => {
    if (productsError) {
      const errMsg = (productsError as any)?.response?.data?.message || (productsError as any)?.message || "Gagal mengambil daftar produk kategori";
      const traceId = (productsError as any)?.response?.data?.traceId;
      toast.error(errMsg);
      console.error(`Error loading category products (Trace ID: ${traceId || "N/A"}):`, productsError);
    }
  }, [productsError]);

  // IDR Currency Formatter
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      header: "Produk",
      cell: (product: any) => (
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold text-zinc-800 text-xs sm:text-sm line-clamp-1">{product.name}</p>
          <p className="text-[10px] text-muted-foreground font-mono">{product.productCode}</p>
        </div>
      ),
    },
    {
      header: "Tipe",
      cell: (product: any) => (
        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider py-0 px-2 text-zinc-600 bg-zinc-50 border-zinc-200">
          {product.productType || "-"}
        </Badge>
      ),
    },
    {
      header: "Harga Dasar",
      cell: (product: any) => (
        <span className="font-bold text-xs sm:text-sm text-zinc-700">
          {formatIDR(product.price || 0)}
        </span>
      ),
    },
    {
      header: "Stok",
      cell: (product: any) => (
        <span className={product.stock <= 5 ? "text-red-600 font-black text-xs" : "text-zinc-600 font-bold text-xs"}>
          {product.stock} pcs
        </span>
      ),
    },
    {
      header: "Status",
      cell: (product: any) => (
        <Badge className={product.isActive ? "bg-green-50 text-green-700 border-green-200 text-[10px]" : "bg-zinc-50 text-zinc-500 border-zinc-200 text-[10px]"} variant="outline">
          {product.isActive ? "Aktif" : "Non-aktif"}
        </Badge>
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (product: any) => (
        <Link href={`/dashboard/products/${product.id}/detail`}>
          <Button variant="ghost" size="icon" className="hover:bg-zinc-100 rounded-lg h-8 w-8" title="Detail Produk">
            <Eye className="h-4 w-4 text-zinc-600" />
          </Button>
        </Link>
      ),
    },
  ];

  // Loading State
  if (isFetchingCategory) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="h-20 w-full bg-zinc-100 animate-pulse rounded-xl" />
        <div className="h-40 w-full bg-zinc-100 animate-pulse rounded-xl" />
        <div className="h-96 w-full bg-zinc-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Error State (If category not found)
  if (!category) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-zinc-800">Detail Kategori Tidak Ditemukan</h3>
        <p className="text-sm text-zinc-500">Kategori mungkin telah dihapus atau ID kategori tidak valid.</p>
        <Link href="/dashboard/categories">
          <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white rounded-xl mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Kategori
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      <BreadcrumbsHeader
        title={category.name}
        breadcrumbs={[
          { label: "Kategori", href: "/dashboard/categories" },
          { label: "Detail Kategori" },
        ]}
        backUrl="/dashboard/categories"
        action={
          <Link href={`/dashboard/categories/${category.id}`}>
            <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white rounded-lg h-9 font-semibold text-xs px-4">
              <Edit className="h-4 w-4 mr-2" /> Edit Kategori
            </Button>
          </Link>
        }
      />

      {/* Top Card: Category Profile & Metrics (Full-Width) */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col md:flex-row gap-6 md:items-center justify-between">

        {/* Profile Info */}
        <div className="flex flex-col sm:flex-row gap-6 items-start flex-1">
          <div className="size-24 rounded-2xl bg-zinc-50 border border-zinc-100 flex-shrink-0 overflow-hidden flex items-center justify-center text-zinc-400">
            {category.imageUrl ? (
              <img
                src={category.imageUrl}
                alt={category.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">{category.name}</h2>
              <Badge className={category.isActive ? "bg-green-50 text-green-700 border-green-200 text-[10px] hover:bg-green-50 font-bold" : "bg-zinc-50 text-zinc-500 border-zinc-200 text-[10px] hover:bg-zinc-50 font-bold"} variant="outline">
                {category.isActive ? "Aktif" : "Non-aktif"}
              </Badge>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">
              {category.shortDescription || "Tidak ada deskripsi singkat untuk kategori ini."}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-600">
              <span className="text-[10px] text-zinc-400 uppercase font-black tracking-wider">Urutan Tampil:</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#FEF4E8] text-[var(--fordza-brown)] text-xs">
                #{category.order}
              </span>
            </div>
          </div>
        </div>

        {/* Metrics display (side-by-side inside the card) */}
        <div className="flex items-center gap-6 shrink-0 md:pl-6 md:border-l md:border-zinc-100">
          <div className="bg-zinc-50/50 border border-zinc-100/50 p-4 rounded-xl min-w-[140px] space-y-0.5">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Produk Terhubung</span>
            <span className="text-2xl font-black text-zinc-800 block">
              {category._count?.products || 0}
            </span>
            <span className="text-[9px] text-zinc-400 block">item aktif</span>
          </div>

          <div className="bg-zinc-50/50 border border-zinc-100/50 p-4 rounded-xl min-w-[140px] space-y-0.5">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Total Stok</span>
            <span className="text-2xl font-black text-zinc-800 block">
              {category.totalStock || 0}
            </span>
            <span className="text-[9px] text-zinc-400 block">pcs fisik</span>
          </div>
        </div>

      </div>

      {/* Bottom Card: Related Products Table (Full-Width) */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-950 tracking-tight">Daftar Produk Terkait</h3>
            <p className="text-xs text-muted-foreground">Seluruh produk yang terhubung dengan kategori ini.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-zinc-200 focus-visible:ring-[#3C3025]/20 rounded-xl text-xs h-9 shadow-sm"
            />
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <DataTable
            columns={columns}
            data={productsData?.data || []}
            isLoading={isFetchingProducts}
            meta={productsData?.meta}
            onPageChange={setPage}
            showNumber={true}
          />
        </div>
      </div>

    </div>
  );
}
