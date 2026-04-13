"use client";

import { PageHeader } from "@/components/layout/admin/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingBag, FolderOpen, Image as ImageIcon, MessageSquare, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/features/dashboard";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mr-2" />
        <p className="text-muted-foreground">Memuat data dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 pb-0">
        <PageHeader 
          title="Dashboard Overview" 
          description="Ringkasan performa dan data toko Anda" 
        />
      </div>
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Produk
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-[#f5e6cf] flex items-center justify-center">
                <ShoppingBag className="h-4 w-4 text-[#3C3025]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalProducts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Produk aktif di toko
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Kategori
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-[#f5e6cf] flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-[#3C3025]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalCategories || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Kategori produk aktif
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Banner Aktif
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-[#f5e6cf] flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-[#3C3025]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalBanners || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ditampilkan di homepage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Testimoni
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-[#f5e6cf] flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-[#3C3025]" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats?.totalTestimonials || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Ulasan aktif dari pelanggan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
          <Card className="col-span-1 lg:col-span-4 max-h-[400px]">
            <CardHeader>
              <CardTitle>Distribusi Kategori Produk</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px] w-full pb-4">
              {stats?.chartData && stats.chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{fill: '#f5e6cf', opacity: 0.4}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}} />
                    <Bar dataKey="total" fill="#3C3025" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                  Belum ada data distribusi produk.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Welcome Section */}
          <Card className="col-span-1 lg:col-span-3 bg-[#3C3025] text-white border-none h-full flex flex-col justify-center">
            <CardHeader>
              <CardTitle className="text-2xl text-[#FEF4E8]">Selamat Datang di Fordza Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#c4a882]">
                Sebelah kiri adalah grafik total koleksi barang Anda di masing-masing kategori.
                <br /><br />
                Gunakan menu di sidebar untuk mengelola inventaris, memperbarui banner promo, dan memoderasi testimoni secara langsung. Semua perubahan di sini akan tampil otomatis di web publik.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
