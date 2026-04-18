"use client";

import { use } from "react";
import { useProduct } from "@/features/products";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  ArrowLeft, 
  Edit, 
  Package, 
  Layers, 
  Info, 
  Star, 
  ChevronRight,
  ShieldCheck,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ProductDetailAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: product, isLoading } = useProduct(id);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 text-center">
        <p className="text-stone-500">Produk tidak ditemukan.</p>
        <Link href="/dashboard/products" className="mt-4 inline-block text-blue-600 hover:underline">
          Kembali ke daftar
        </Link>
      </div>
    );
  }

  const formatRupiah = (p: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(p));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/products">
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/dashboard/products" className="text-xs text-stone-400 hover:text-stone-600">Produk</Link>
              <ChevronRight className="h-3 w-3 text-stone-300" />
              <span className="text-xs text-stone-600 font-medium">Detail Produk</span>
            </div>
            <h1 className="text-2xl font-bold text-[#3C3025]">{product.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/products/${id}`}>
            <Button className="bg-[#3C3025] hover:bg-[#5a4a38] text-white">
              <Edit className="h-4 w-4 mr-2" /> Edit Produk
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visuals & Quick Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="overflow-hidden border-stone-200 shadow-sm">
            <div className="aspect-square bg-stone-100 relative group">
              {product.images?.[0] ? (
                <img 
                  src={product.images[0].url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <Package className="h-12 w-12" />
                </div>
              )}
              <div className="absolute top-4 right-4">
                <StatusBadge active={product.isActive} />
              </div>
            </div>
            {product.images?.length > 1 && (
              <div className="p-4 grid grid-cols-4 gap-2 border-t border-stone-100 bg-white">
                {product.images.slice(1, 5).map((img: any) => (
                  <div key={img.id} className="aspect-square rounded border border-stone-200 overflow-hidden">
                    <img src={img.url} className="w-full h-full object-cover" alt="Gallery" />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Status Performa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-sm">Rating Rata-rata</span>
                <div className="flex items-center gap-1 font-bold text-stone-800">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {product.avgRating.toFixed(1)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-stone-500 text-sm">Total Ulasan</span>
                <span className="font-bold text-stone-800">{product.totalReviews} ulasan</span>
              </div>
              <div className="pt-2 flex flex-wrap gap-2">
                {product.isPopular && <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-100 uppercase text-[9px] font-bold">Populer</Badge>}
                {product.isBestseller && <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 uppercase text-[9px] font-bold">Best Seller</Badge>}
                {product.isNew && <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-100 uppercase text-[9px] font-bold">Baru</Badge>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Info & Inventory */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Bento Section: Deskripsi (Full Width in column) */}
          <Card className="border-stone-200 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="bg-stone-50 border-b border-stone-100 py-3 px-5">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-[#3C3025] rounded-full" />
                  <CardTitle className="text-sm font-bold text-stone-800 uppercase tracking-wider">Deskripsi Lengkap Produk</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="p-8 flex-1 bg-white">
              <div 
                className="prose prose-sm max-w-none text-stone-600 leading-relaxed min-h-[100px]"
                dangerouslySetInnerHTML={{ __html: product.detail?.description || "Tidak ada deskripsi produk." }}
              />
            </CardContent>
          </Card>

          {/* Bento Section: Catatan & Insight */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <Card className="md:col-span-12 border-stone-200 shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="bg-stone-50 border-b border-stone-100 py-3 px-5 font-bold text-stone-800 uppercase tracking-widest text-[10px] flex flex-row items-center gap-2">
                 <Zap className="h-3 w-3 text-amber-500" /> Catatan & Insight Internal
              </CardHeader>
              <CardContent className="p-6 flex-1 bg-amber-50/20">
                <div className="bg-white p-5 rounded-xl border border-amber-100 shadow-sm italic text-sm text-amber-900 leading-relaxed">
                  {product.detail?.notes || "Belum ada catatan internal untuk produk ini."}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-stone-400" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-stone-800">Spesifikasi Teknis</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-widest">Material Atas</h4>
                  <p className="text-sm text-stone-800 font-bold">{product.detail?.material || "-"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-widest">Sol (Outsole)</h4>
                  <p className="text-sm text-stone-800 font-bold">{product.detail?.outsole || "-"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-widest">Konstruksi</h4>
                  <p className="text-sm text-stone-800 font-bold">{product.detail?.closureType || "-"}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-stone-400 uppercase mb-1 tracking-widest">Asal Produksi</h4>
                  <p className="text-sm text-stone-800 font-bold">{product.detail?.origin || "-"}</p>
                </div>
            </CardContent>
          </Card>

          {/* Varian & Stok Table */}
          <Card className="border-stone-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-[#3C3025] text-white flex flex-row items-center justify-between py-5">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                <CardTitle className="text-base text-white font-bold">Rincian Varian & Stok per Ukuran</CardTitle>
              </div>
              <Badge className="bg-[#5a4a38] text-white border-transparent px-3 py-1">{product.variants?.length || 0} Warna Tersedia</Badge>
            </CardHeader>
            <div className="divide-y divide-stone-100">
              {(product.variants || []).map((variant: any) => (
                <div key={variant.id} className="p-6 bg-white hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl border border-stone-200 overflow-hidden bg-white shadow-sm p-0.5">
                           {variant.images?.[0]?.url && <img src={variant.images[0].url} className="w-full h-full object-cover rounded-lg" alt="Variant" />}
                        </div>
                        <div>
                            <p className="text-base font-bold text-[#3C3025] flex items-center gap-2">
                                {variant.color}
                                {variant.discountPercent > 0 && <span className="text-[10px] bg-green-600 text-white px-2 py-0.5 rounded-md font-bold">-{Math.round(variant.discountPercent)}%</span>}
                            </p>
                            <p className="text-[10px] text-stone-400 uppercase font-black tracking-widest">{variant.variantCode}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-lg font-black text-[#3C3025]">{formatRupiah(variant.basePrice)}</p>
                        {variant.comparisonPrice && (
                            <p className="text-xs text-stone-400 line-through font-medium italic opacity-70">{formatRupiah(variant.comparisonPrice)}</p>
                        )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {variant.skus?.map((sku: any) => (
                        <div key={sku.id} className={`px-4 py-3 border rounded-xl text-center min-w-[70px] transition-all ${sku.stock > 0 ? 'bg-white border-stone-200 hover:border-stone-400 shadow-sm' : 'bg-red-50 border-red-100 opacity-60'}`}>
                            <p className="text-[10px] text-stone-400 font-black mb-1">{sku.size}</p>
                            <p className={`text-sm font-bold ${sku.stock === 0 ? 'text-red-500' : 'text-[#3C3025]'}`}>{sku.stock}</p>
                        </div>
                    ))}
                    {(!variant.skus || variant.skus.length === 0) && <p className="text-xs text-stone-400 italic font-medium p-2 bg-stone-50 rounded italic">Belum ada data ukuran untuk varian ini.</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
