"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingBag,
  FolderOpen,
  Image as ImageIcon,
  Loader2,
  ArrowRight,
  Plus,
  Upload,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Ruler,
  Percent,
  PackageOpen,
  TrendingUp,
  TrendingDown,
  Tag
} from "lucide-react";
import { useDashboardStats } from "@/features/admin/dashboard";
import { useSizeTemplatesAdmin } from "@/features/admin/size-templates";
import { usePromosAdmin } from "@/features/promo/hooks";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import Link from "next/link";

// ─── Custom Tooltip untuk Grafik Distribusi Kategori ─────────────────────────
const CustomChartTooltip = ({ active, payload, maxTotal }: any) => {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  const total = payload[0]?.value as number;
  const pct = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;
  return (
    <div
      className="bg-white border border-[#e8d8c4] rounded-2xl shadow-xl px-4 py-3 w-[210px]"
      style={{ boxShadow: '0 8px 32px rgba(60,48,37,0.13)' }}
    >
      <div className="flex items-start gap-2 mb-2">
        <div className="h-6 w-6 rounded-lg bg-[#FEF4E8] flex items-center justify-center shrink-0 mt-0.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3C3025" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <span
          className="text-[11px] font-bold text-[#3C3025] leading-snug"
          style={{ wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {item?.name ?? "-"}
        </span>
      </div>
      <div className="border-t border-stone-100 pt-2 mt-1">
        <div className="flex items-end justify-between">
          <div className="flex items-end gap-1.5">
            <span className="text-2xl font-black leading-none" style={{ color: '#3C3025' }}>
              {total}
            </span>
            <span className="text-[10px] text-stone-400 font-semibold mb-0.5">produk</span>
          </div>
          <span className="text-[10px] font-bold text-stone-400">{pct}%</span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #5a4a38, #3C3025)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

const getLogTypeLabel = (type: string) => {
  switch (type) {
    case "SALE":
      return "JUAL";
    case "RESTOCK":
      return "MASUK";
    case "VOID":
      return "VOID";
    default:
      return "ADJ";
  }
};

const getLogTypeStyle = (type: string) => {
  switch (type) {
    case "SALE":
      return "bg-red-50 text-red-600 border border-red-100/60";
    case "RESTOCK":
      return "bg-emerald-50 text-emerald-600 border border-emerald-100/60";
    case "VOID":
      return "bg-amber-50 text-amber-600 border border-amber-100/60";
    default:
      return "bg-stone-50 text-stone-500 border border-stone-200/60";
  }
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: templatesData, isLoading: isTemplatesLoading } = useSizeTemplatesAdmin();
  const { data: promosData } = usePromosAdmin();
  const sizeTemplates = templatesData?.data || [];

  const now = new Date();
  const activePromos = (promosData || []).filter((p: any) => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return p.isActive && start <= now && end >= now;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#3C3025]" />
        <p className="text-sm font-medium text-stone-500 animate-pulse">
          Memuat ringkasan data dashboard...
        </p>
      </div>
    );
  }

  // Pre-process chart data to handle long names and duplicates
  const processedChartData = (stats?.chartData || []).map((c: any) => ({
    ...c,
    displayName: c.name.length > 12 ? c.name.substring(0, 10) + "..." : c.name,
  }));

  // Helper untuk rendering badge stok kritis
  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
          Habis
        </span>
      );
    }
    if (stock <= 2) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
          Kritis ({stock})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-100 text-yellow-700 border border-yellow-200">
        Menipis ({stock})
      </span>
    );
  };


  return (
    <div className="p-6 space-y-6 pb-16 max-w-7xl mx-auto">

      {/* Dynamic Bento Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-stretch">

        {/* ROW 1: Welcome Banner (Col-span 12 - FULL WIDTH) */}
        <div className="lg:col-span-12 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3C3025] to-[#5a4a38] text-white p-8 shadow-sm flex flex-col justify-center min-h-[200px]">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-15 pointer-events-none hidden md:block">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,100 C30,40 70,60 100,0 L100,100 Z" fill="white" />
            </svg>
          </div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#FEF4E8] text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Panel Kendali Utama
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#FEF4E8]">
              Selamat Datang di Hub Kendali Toko Anda
            </h1>
            <p className="text-stone-300 text-sm leading-relaxed max-w-3xl">
              Pantau dan kelola seluruh inventaris produk, moderasi ulasan testimoni dari pembeli, serta perbarui banner promo halaman depan secara langsung dari satu halaman utama ini.
            </p>
          </div>
        </div>

        {/* ROW 2 - BLOCK 1: Akses Cepat Harian (Col-span 8) */}
        <Card className="lg:col-span-8 md:col-span-2 border-stone-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2 border-b border-stone-50 bg-stone-50/20">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#3C3025] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Akses Cepat Harian
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 items-center">

            <Link href="/dashboard/products/new" className="group">
              <div className="p-4 rounded-xl border border-stone-150 bg-stone-50/40 hover:bg-[#FEF4E8] hover:border-[#f0d4bd] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-lg bg-stone-100 group-hover:bg-white flex items-center justify-center text-[#3C3025] transition-colors shrink-0">
                    <Plus className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3C3025] group-hover:text-[#3C3025] transition-colors">Produk Baru</h4>
                    <p className="text-[10px] text-stone-400 mt-0.5">Input sepatu & varian</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/dashboard/products/bulk-import" className="group">
              <div className="p-4 rounded-xl border border-stone-150 bg-stone-50/40 hover:bg-[#FEF4E8] hover:border-[#f0d4bd] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-lg bg-stone-100 group-hover:bg-white flex items-center justify-center text-[#3C3025] transition-colors shrink-0">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3C3025] group-hover:text-[#3C3025] transition-colors">Bulk Import</h4>
                    <p className="text-[10px] text-stone-400 mt-0.5">Unggah CSV masal</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/dashboard/banners" className="group">
              <div className="p-4 rounded-xl border border-stone-150 bg-stone-50/40 hover:bg-[#FEF4E8] hover:border-[#f0d4bd] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-lg bg-stone-100 group-hover:bg-white flex items-center justify-center text-[#3C3025] transition-colors shrink-0">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3C3025] group-hover:text-[#3C3025] transition-colors">Banner Utama</h4>
                    <p className="text-[10px] text-stone-400 mt-0.5">Kelola gambar promo</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link href="/dashboard/promo" className="group">
              <div className="p-4 rounded-xl border border-stone-150 bg-stone-50/40 hover:bg-[#FEF4E8] hover:border-[#f0d4bd] transition-all flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-9 w-9 rounded-lg bg-stone-100 group-hover:bg-white flex items-center justify-center text-[#3C3025] transition-colors shrink-0">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#3C3025] group-hover:text-[#3C3025] transition-colors">Kelola Promo</h4>
                    <p className="text-[10px] text-stone-400 mt-0.5">{activePromos.length} promo aktif saat ini</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-stone-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

          </CardContent>
        </Card>

        {/* ROW 2 - BLOCK 2: Ringkasan Metrik Terpadu (Col-span 4) */}
        <Card className="lg:col-span-4 md:col-span-2 border-stone-200 shadow-sm flex flex-col overflow-hidden">
          <CardHeader className="pb-2 border-b border-stone-50 bg-stone-50/20">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#3C3025] flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-stone-400" /> Ringkasan Metrik
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 gap-3 flex-1">

            <div className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/20 flex flex-col justify-between">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Produk</span>
              <div>
                <span className="text-2xl font-black text-[#3C3025] block leading-tight">{stats?.totalProducts || 0}</span>
                <Link href="/dashboard/products" className="text-xs font-semibold text-[#3C3025] hover:text-stone-600 inline-flex items-center gap-0.5 mt-1">
                  Kelola <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/20 flex flex-col justify-between">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Kategori</span>
              <div>
                <span className="text-2xl font-black text-[#3C3025] block leading-tight">{stats?.totalCategories || 0}</span>
                <Link href="/dashboard/categories" className="text-xs font-semibold text-[#3C3025] hover:text-stone-600 inline-flex items-center gap-0.5 mt-1">
                  Kelola <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/20 flex flex-col justify-between">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Banner</span>
              <div>
                <span className="text-2xl font-black text-[#3C3025] block leading-tight">{stats?.totalBanners || 0}</span>
                <Link href="/dashboard/banners" className="text-xs font-semibold text-[#3C3025] hover:text-stone-600 inline-flex items-center gap-0.5 mt-1">
                  Kelola <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-100 bg-stone-50/20 flex flex-col justify-between">
              <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">Promo Aktif</span>
              <div>
                <span className="text-2xl font-black text-[#3C3025] block leading-tight">{activePromos.length}</span>
                <Link href="/dashboard/promo" className="text-xs font-semibold text-[#3C3025] hover:text-stone-600 inline-flex items-center gap-0.5 mt-1">
                  Kelola <ChevronRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            </div>

          </CardContent>
        </Card>


        {/* ROW 3 - BLOCK 2: Aktivitas Stok Terkini (Col-span 4) */}
        <Card className="lg:col-span-4 md:col-span-2 border-stone-200 shadow-sm flex flex-col overflow-hidden lg:h-[430px] md:h-[400px] h-[360px]">
          <CardHeader className="pb-2 border-b border-stone-50 bg-stone-50/20">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#3C3025] flex items-center gap-2">
              <Clock className="h-4 w-4 text-stone-400" /> Aktivitas Stok Terkini
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
            {stats?.latestStockLogs && stats.latestStockLogs.length > 0 ? (
              <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 sidebar-scrollbar">
                {stats.latestStockLogs.map((log: any) => {
                  const isPositive = log.delta > 0;
                  return (
                    <div key={log.id} className="p-3 rounded-xl border border-stone-100 bg-stone-50/30 hover:bg-stone-50/60 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${
                            isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                          }`}>
                            {isPositive
                              ? <TrendingUp className="h-3.5 w-3.5" />
                              : <TrendingDown className="h-3.5 w-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-stone-800 truncate" title={log.productName}>
                              {log.productName}
                            </p>
                            <p className="text-[9px] text-stone-400 font-mono mt-0.5">
                              {log.color} · Size {log.size}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-black shrink-0 ${
                          isPositive ? "text-emerald-600" : "text-red-500"
                        }`}>
                          {isPositive ? "+" : ""}{log.delta}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-stone-100/60">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${getLogTypeStyle(log.type)}`}>
                          {getLogTypeLabel(log.type)}
                        </span>
                        <span className="text-[9px] text-stone-400">
                          {log.operatorName} · {new Date(log.createdAt).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center flex-1 gap-2">
                <PackageOpen className="h-8 w-8 text-stone-300" />
                <div>
                  <h5 className="text-xs font-bold text-stone-800">Belum Ada Aktivitas Stok</h5>
                  <p className="text-[10px] text-stone-400 mt-0.5">Log perubahan stok akan muncul di sini.</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-stone-100 mt-3 shrink-0">
              <Link
                href="/dashboard/stock-history"
                className="w-full py-2 px-4 rounded-xl border border-stone-200 hover:border-[#3C3025] hover:bg-stone-50 text-stone-600 hover:text-[#3C3025] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                Lihat Histori Stok <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>
        {/* ROW 3 - BLOCK 1: Grafik Distribusi Kategori (Col-span 8) */}
        <Card className="lg:col-span-8 md:col-span-2 border-stone-200 shadow-sm flex flex-col overflow-hidden lg:h-[430px] md:h-[400px] h-[360px]">
          <CardHeader className="pb-2 border-b border-stone-50 bg-stone-50/20">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#3C3025] flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-stone-400" /> Distribusi Kategori Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 w-full pb-4 flex-1 min-h-0 relative">
            {processedChartData && processedChartData.length > 0 ? (
              <div className="absolute inset-0 pt-6 px-6 pb-8 overflow-x-auto custom-scrollbar">
                <div style={{ minWidth: `${Math.max(600, processedChartData.length * 100)}px`, height: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedChartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#5a4a38" />
                          <stop offset="100%" stopColor="#3C3025" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f2f0" />
                      <XAxis
                        dataKey="id"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        stroke="#8A7D75"
                        tickFormatter={(id) => {
                          const item = processedChartData.find((d: any) => d.id === id);
                          return item ? item.displayName : "";
                        }}
                      />
                      <YAxis
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        stroke="#8A7D75"
                      />
                      <Tooltip
                        cursor={{ fill: '#FEF4E8', opacity: 0.4, radius: 6 }}
                        content={(props) => (
                          <CustomChartTooltip
                            {...props}
                            maxTotal={Math.max(...processedChartData.map((d: any) => d.total ?? 0), 1)}
                          />
                        )}
                        wrapperStyle={{ outline: 'none' }}
                      />
                      <Bar dataKey="total" radius={[6, 6, 0, 0]} barSize={30}>
                        {processedChartData.map((entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill="url(#barGradient)"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-stone-400 text-xs italic">
                Belum ada data distribusi produk.
              </div>
            )}
          </CardContent>
        </Card>



        {/* ROW 4 - BLOCK 1: Peringatan Stok Kritis (Col-span 7) */}
        <Card className="lg:col-span-7 md:col-span-2 border-stone-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2 border-b border-stone-50 bg-stone-50/20">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#3C3025] flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" /> Peringatan Stok Kritis (Low Stock)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {stats?.lowStockSkus && stats.lowStockSkus.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-stone-50/50 border-b border-stone-100 text-stone-400 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-3 px-6">Produk</th>
                      <th className="py-3 px-4">Warna & Size</th>
                      <th className="py-3 px-6 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {stats.lowStockSkus.map((sku: any) => (
                      <tr key={sku.id} className="hover:bg-stone-50/40 transition-colors">
                        <td className="py-3 px-6">
                          <p className="font-semibold text-stone-850 truncate max-w-[200px]" title={sku.productName}>
                            {sku.productName}
                          </p>
                          <p className="text-[9px] text-stone-400 font-mono">
                            {sku.productCode}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-stone-700 font-medium">{sku.color}</span>
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 text-[10px] font-mono">
                            Size: {sku.size}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right">
                          {getStockBadge(sku.stock)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full gap-2">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                  ✓
                </div>
                <div>
                  <h5 className="text-xs font-bold text-stone-800">Semua Stok Aman!</h5>
                  <p className="text-[10px] text-stone-400 mt-0.5">Tidak ada varian dengan stok kritis.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ROW 4 - BLOCK 2: Template Ukuran (Col-span 5) */}
        <Card className="lg:col-span-5 md:col-span-2 border-stone-200 shadow-sm flex flex-col justify-between overflow-hidden">
          <CardHeader className="pb-2 border-b border-stone-50 bg-stone-50/20">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-[#3C3025] flex items-center gap-2">
              <Ruler className="h-4 w-4 text-stone-400" /> Template Ukuran Aktif
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between overflow-hidden">
            {isTemplatesLoading ? (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-[#3C3025]" />
                <p className="text-[10px] text-stone-400 animate-pulse">Memuat template ukuran...</p>
              </div>
            ) : sizeTemplates && sizeTemplates.length > 0 ? (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {sizeTemplates.slice(0, 4).map((template: any) => (
                  <div key={template.id} className="p-3 rounded-xl border border-stone-100 bg-stone-50/20 hover:bg-[#FEF4E8] hover:border-[#f0d4bd] transition-all flex items-center justify-between group">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-stone-850 group-hover:text-[#3C3025] transition-colors truncate" title={template.name}>
                        {template.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {template.sizes.slice(0, 6).map((size: string, idx: number) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-white text-stone-600 text-[9px] font-mono border border-stone-200/60 shadow-sm">
                            {size}
                          </span>
                        ))}
                        {template.sizes.length > 6 && (
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 text-[9px] font-bold border border-stone-200/30">
                            +{template.sizes.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-[#FEF4E8]/60 text-[#3C3025] border-[#f0d4bd]/40">
                        {template.productDetails?.length || 0} produk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center h-full gap-2">
                <Ruler className="h-8 w-8 text-stone-300" />
                <div>
                  <h5 className="text-xs font-bold text-stone-800">Belum Ada Template</h5>
                  <p className="text-[10px] text-stone-400 mt-0.5">Buat template ukuran untuk produk Anda.</p>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-stone-100 mt-3 shrink-0">
              <Link
                href="/dashboard/size-templates"
                className="w-full py-2 px-4 rounded-xl border border-stone-200 hover:border-[#3C3025] hover:bg-stone-50 text-stone-600 hover:text-[#3C3025] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all"
              >
                Kelola Template Ukuran <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
