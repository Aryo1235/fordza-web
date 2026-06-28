"use client";

import { use, useEffect, useState } from "react";
import { useSizeTemplate } from "@/features/admin/size-templates";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BreadcrumbsHeader } from "@/components/layout/admin/BreadcrumbsHeader";
import { DataTable } from "@/components/shared/DataTable";
import {
  ArrowLeft,
  AlertTriangle,
  Ruler,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

export default function SizeTemplateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [page, setPage] = useState(1);
  const limit = 5;

  // Fetch Size Template Details
  const {
    data: detailResponse,
    isLoading,
    error
  } = useSizeTemplate(id, page, limit);

  const isWrapped = detailResponse && "success" in detailResponse && "data" in detailResponse;
  const template = isWrapped ? (detailResponse as any).data : detailResponse;

  const rawProductDetails = template?.productDetails || [];
  const totalItems = isWrapped ? (detailResponse as any).meta?.totalItems : rawProductDetails.length;

  const associatedProducts = isWrapped
    ? rawProductDetails.map((pd: any) => pd.product).filter(Boolean)
    : rawProductDetails.slice((page - 1) * limit, page * limit).map((pd: any) => pd.product).filter(Boolean);

  const meta = isWrapped
    ? (detailResponse as any).meta
    : {
      totalItems,
      totalPage: Math.ceil(totalItems / limit),
      currentPage: page,
      limit,
    };


  // Handle errors
  useEffect(() => {
    if (error) {
      const errMsg = (error as any)?.response?.data?.message || (error as any)?.message || "Gagal mengambil data template ulasan";
      toast.error(errMsg);
      console.error("Error loading size template:", error);
    }
  }, [error]);

  // Loading state
  if (isLoading && !template) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="h-20 w-full bg-stone-100 animate-pulse rounded-xl" />
        <div className="h-96 w-full bg-stone-100 animate-pulse rounded-xl" />
      </div>
    );
  }

  // Error state or Not Found
  if (!template) {
    return (
      <div className="p-6 max-w-lg mx-auto mt-20 text-center space-y-4 bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-bold text-stone-800">Detail Template Tidak Ditemukan</h3>
        <p className="text-sm text-stone-500">Template mungkin telah dihapus atau ID tidak valid.</p>
        <Link href="/dashboard/size-templates">
          <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white rounded-xl mt-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar Template
          </Button>
        </Link>
      </div>
    );
  }

  const columns = [
    {
      header: "Nama Produk",
      cell: (product: any) => (
        <span className="font-semibold text-stone-800">
          {product.name}
        </span>
      ),
    },
    {
      header: "Kode Produk",
      cell: (product: any) => (
        <span className="font-mono text-stone-500">
          {product.productCode}
        </span>
      ),
    },
    {
      header: "Stok Total",
      className: "text-right",
      cell: (product: any) => (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${product.stock === 0
          ? "bg-red-50 text-red-700 border-red-100"
          : product.stock <= 5
            ? "bg-amber-50 text-amber-700 border-amber-100"
            : "bg-stone-50 text-stone-600 border-stone-150"
          }`}>
          {product.stock} pcs
        </span>
      ),
    },
    {
      header: "Aksi",
      className: "text-right",
      cell: (product: any) => (
        <Link href={`/dashboard/products/${product.id}/detail`}>
          <Button variant="ghost" size="icon" className="hover:text-[#3C3025] text-stone-400 h-7 w-7" title="Lihat Produk">
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </Link>
      ),
    },
  ];

  const renderSizeDetails = (size: string) => {
    const meas = template.measurements?.[size];
    if (!meas) return <span className="text-[9.5px] text-stone-400 block font-normal mt-0.5">Belum ada CM</span>;

    const tType = (template.type || "").toLowerCase();
    if (tType === "sepatu") {
      const length = meas.insoleLength || meas.insole || "-";
      const width = meas.insoleWidth;
      return (
        <span className="text-[9.5px] text-stone-600 block font-semibold mt-0.5 leading-tight">
          P: {length} cm{width ? <><br />L: {width} cm</> : null}
        </span>
      );
    }
    if (tType === "apparel" || tType === "pakaian") {
      return (
        <span className="text-[9.5px] text-stone-600 block font-semibold mt-0.5 leading-tight">
          LD: {meas.ld || "-"} cm<br />
          PB: {meas.pb || "-"} cm
        </span>
      );
    }
    if (tType === "aksesoris" || tType === "gelang") {
      if (meas.panjang || meas.lebar || meas.tinggi) {
        return (
          <span className="text-[9.5px] text-stone-600 block font-semibold mt-0.5 leading-tight">
            P: {meas.panjang || "-"} cm<br />
            L: {meas.lebar || "-"} cm<br />
            T: {meas.tinggi || "-"} cm
          </span>
        );
      }
      if (meas.lingkar) {
        return (
          <span className="text-[9.5px] text-stone-600 block font-semibold mt-0.5">
            Lingkar: {meas.lingkar} cm
          </span>
        );
      }
      return (
        <span className="text-[9.5px] text-stone-600 block font-semibold mt-0.5 max-w-[80px] truncate" title={meas.detail}>
          {meas.detail || "-"}
        </span>
      );
    }
    return (
      <span className="text-[9.5px] text-stone-600 block font-semibold mt-0.5 max-w-[80px] truncate" title={meas.detail}>
        {meas.detail || "-"}
      </span>
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      <BreadcrumbsHeader
        title={`Template: ${template.name}`}
        breadcrumbs={[
          { label: "Template Ukuran", href: "/dashboard/size-templates" },
          { label: "Detail Template" },
        ]}
        backUrl="/dashboard/size-templates"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

        {/* Left Card: Size Template Info & Sizes (Col-span 1) */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Ruler className="h-4 w-4" /> Rincian Template
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-stone-400 font-medium">Nama Template:</span>
                <span className="font-bold text-stone-800">{template.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400 font-medium">Tipe:</span>
                <span className="font-bold text-stone-700 capitalize">{template.type}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-400 font-medium">Jumlah Produk:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-stone-50 text-stone-600 border-stone-150">
                  {meta?.totalItems || 0} produk
                </span>
              </div>
            </div>

            {/* Displaying Size list */}
            <div className="space-y-4 pt-6 border-t border-stone-100 mt-6 flex-1">
              <p className="text-xs font-extrabold text-stone-400 uppercase tracking-wider">Daftar Ukuran (Size Chart)</p>
              <div className="grid grid-cols-4 gap-1 pt-1">
                {template.sizes.map((size: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center   p-1 rounded-xl bg-[#FEF4E8] text-[#3C3025] border border-[#f0d4bd] shadow-sm hover:shadow hover:bg-[#FDF0DF] transition-all duration-200 text-center min-h-[72px]"
                  >
                    <span className="text-sm font-black font-mono ">{size}</span>

                    {renderSizeDetails(size)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Associated Products List (Col-span 2) */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                  Produk Yang Menggunakan Template Ini ({meta?.totalItems || 0})
                </h3>
              </div>

              <DataTable
                columns={columns}
                data={associatedProducts}
                isLoading={isLoading}
                meta={meta}
                onPageChange={(p) => setPage(p)}
                emptyMessage="Template ini belum dipasangkan ke produk apa pun."
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
