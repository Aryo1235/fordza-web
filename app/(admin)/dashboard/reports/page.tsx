"use client";

import { useEffect, useState } from "react";
import { useSalesReportItems, useSalesReportSummary } from "@/features/admin/reports";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { DatePicker } from "@/components/ui/date-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/Pagination";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  Download,
  FileText,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Trophy,
} from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { toast } from "sonner";
import { downloadFile } from "@/lib/download";
import { useDebounce } from "@/hooks/useDebounce";

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [tableDateFrom, setTableDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [tableDateTo, setTableDateTo] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"quantity" | "revenue" | "name">(
    "quantity",
  );
  const [minQuantity, setMinQuantity] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const debouncedSearchTerm = useDebounce(searchTerm, 350);
  const minQuantityValue = minQuantity ? Number(minQuantity) : undefined;

  const { data: summaryData, isLoading: isSummaryLoading } =
    useSalesReportSummary(dateFrom, dateTo);

  const { data: itemsData, isLoading: isItemsLoading } = useSalesReportItems(
    tableDateFrom,
    tableDateTo,
    {
      search: debouncedSearchTerm,
      sortBy,
      minQuantity: minQuantityValue,
      page,
      limit,
    },
  );

  const totalItems = itemsData?.pagination.totalItems || 0;
  const totalPages = itemsData?.pagination.totalPages || 1;
  const currentPage = itemsData?.pagination.page || page;
  const currentLimit = itemsData?.pagination.limit || limit;
  const paginatedSoldProducts = itemsData?.soldProducts || [];

  useEffect(() => {
    setPage(1);
  }, [tableDateFrom, tableDateTo, debouncedSearchTerm, sortBy, minQuantityValue]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const exportToExcel = async () => {
    await downloadFile(
      "/api/admin/reports/export/summary",
      "Laporan_Ringkasan_Penjualan_Fordza.xlsx",
      {
        from: format(dateFrom, "yyyy-MM-dd"),
        to: format(dateTo, "yyyy-MM-dd"),
        format: "xlsx",
      },
    );
    toast.success("Laporan Excel berhasil diunduh");
  };

  const exportToPDF = async () => {
    await downloadFile(
      "/api/admin/reports/export/summary",
      "Laporan_Ringkasan_Penjualan_Fordza.pdf",
      {
        from: format(dateFrom, "yyyy-MM-dd"),
        to: format(dateTo, "yyyy-MM-dd"),
        format: "pdf",
      },
    );
    toast.success("Laporan PDF berhasil diunduh");
  };

  const exportItemsToExcel = async () => {
    await downloadFile(
      "/api/admin/reports/export/items",
      "Laporan_Detail_Penjualan_Fordza.xlsx",
      {
        from: format(tableDateFrom, "yyyy-MM-dd"),
        to: format(tableDateTo, "yyyy-MM-dd"),
        search: debouncedSearchTerm,
        sortBy,
        minQuantity: minQuantityValue,
        format: "xlsx",
      },
    );
    toast.success("Detail laporan Excel berhasil diunduh");
  };

  const exportItemsToPDF = async () => {
    await downloadFile(
      "/api/admin/reports/export/items",
      "Laporan_Detail_Penjualan_Fordza.pdf",
      {
        from: format(tableDateFrom, "yyyy-MM-dd"),
        to: format(tableDateTo, "yyyy-MM-dd"),
        search: debouncedSearchTerm,
        sortBy,
        minQuantity: minQuantityValue,
        format: "pdf",
      },
    );
    toast.success("Detail laporan PDF berhasil diunduh");
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader
        title="Laporan Penjualan"
        description="Pantau performa bisnis Toko Fordza melalui data statistik."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">
              Export Ringkasan
            </span>
            <Button
              variant="outline"
              onClick={exportToExcel}
              disabled={!summaryData}
              className="gap-2 border-stone-300"
            >
              <Download className="w-4 h-4" /> Excel
            </Button>
            <Button
              variant="outline"
              onClick={exportToPDF}
              disabled={!summaryData}
              className="gap-2 border-stone-300"
            >
              <FileText className="w-4 h-4" /> PDF
            </Button>
          </div>
        }
      />

      {/* Date Filter */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-stone-500 uppercase">
            Dari Tanggal
          </p>
          <DatePicker date={dateFrom} setDate={(d) => d && setDateFrom(d)} />
        </div>
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-stone-500 uppercase">
            Sampai Tanggal
          </p>
          <DatePicker date={dateTo} setDate={(d) => d && setDateTo(d)} />
        </div>
        <div className="flex-1 hidden md:block" />
        <div className="text-right">
          <p className="text-[10px] text-stone-400 font-bold uppercase mb-1">
            Update Terakhir
          </p>
          <p className="text-xs text-stone-600 font-mono">
            {format(new Date(), "dd-MM-yyyy HH:mm")}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-stone-900 text-white overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-400 flex items-center justify-between">
              Total Pendapatan
              <DollarSign className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {isSummaryLoading
                ? "..."
                : `Rp ${summaryData?.summary.totalRevenue.toLocaleString("id-ID")}`}
            </p>
            <p className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              Berdasarkan transaksi PAID
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 flex items-center justify-between">
              Jumlah Transaksi
              <ShoppingBag className="w-4 h-4 text-stone-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-stone-800">
              {isSummaryLoading ? "..." : summaryData?.summary.totalOrders}
            </p>
            <p className="text-[10px] text-stone-500 mt-1">Status Lunas</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border border-stone-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase tracking-wider text-stone-500 flex items-center justify-between">
              Rata-rata Order
              <TrendingUp className="w-4 h-4 text-stone-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-stone-800">
              {isSummaryLoading
                ? "..."
                : `Rp ${Math.round(summaryData?.summary.averageOrderValue).toLocaleString("id-ID")}`}
            </p>
            <p className="text-[10px] text-stone-500 mt-1">
              Tiket per Pelanggan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <Card className="lg:col-span-2 border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
              Tren Pendapatan Harian
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {isSummaryLoading ? (
              <div className="w-full h-full flex items-center justify-center bg-stone-50 rounded animate-pulse" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summaryData?.chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />
                  <XAxis
                    dataKey="date"
                    fontSize={10}
                    tickFormatter={(val) => format(new Date(val), "dd/MM")}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    fontSize={10}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(val) => `Rp ${val / 1000}k`}
                  />
                  <Tooltip
                    formatter={(val: any) => [
                      `Rp ${val.toLocaleString()}`,
                      "Revenue",
                    ]}
                    labelStyle={{ fontSize: 12, fontWeight: "bold" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3C3025"
                    strokeWidth={3}
                    dot={{ fill: "#3C3025", strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="border-stone-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Produk Terlaris
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-stone-100 animate-pulse rounded"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {(summaryData?.topProducts || []).map((p: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-stone-700 truncate max-w-[180px]">
                          {p.name}
                        </span>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-stone-500 font-medium">
                            {p.color} - Size: {p.size}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {p.code}
                          </span>
                        </div>
                      </div>
                      <span className="text-stone-500 font-medium">
                        {p.quantity} Unit
                      </span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-stone-800"
                        style={{
                          width: `${(p.quantity / (summaryData?.topProducts?.[0]?.quantity || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Item Table */}
      <Card className="border-stone-200 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-lg font-bold text-stone-800">
                Tabel Penjualan Item
              </CardTitle>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Dari:</span>
                  <DatePicker date={tableDateFrom} setDate={(d) => d && setTableDateFrom(d)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Sampai:</span>
                  <DatePicker date={tableDateTo} setDate={(d) => d && setTableDateTo(d)} />
                </div>
              </div>
              <p className="text-sm text-stone-500 mt-2">
                Data agregat per produk untuk analisis penjualan: cari produk,
                urutkan, dan filter kuantitas.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mr-1">
                Export
              </span>
              <Button
                variant="outline"
                onClick={exportItemsToExcel}
                disabled={!itemsData}
                className="gap-2 border-stone-300"
              >
                <Download className="w-4 h-4" /> Excel
              </Button>
              <Button
                variant="outline"
                onClick={exportItemsToPDF}
                disabled={!itemsData}
                className="gap-2 border-stone-300"
              >
                <FileText className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Cari nama atau kode produk"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-stone-200"
            />

            <Select
              value={sortBy}
              onValueChange={(value) => setSortBy(value as any)}
            >
              <SelectTrigger className="border-stone-200">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quantity">Qty terbesar</SelectItem>
                <SelectItem value="revenue">Revenue terbesar</SelectItem>
                <SelectItem value="name">Nama A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Input
              type="number"
              min="0"
              placeholder="Minimal qty terjual"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="border-stone-200"
            />
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader className="bg-stone-50">
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Kode Produk</TableHead>
                  <TableHead>Kode Variant</TableHead>
                  <TableHead>Produk</TableHead>
                  <TableHead>Varian</TableHead>
                  <TableHead className="text-right">Qty Terjual</TableHead>
                  <TableHead className="text-right">Harga Satuan</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Kontribusi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="h-30 overflow-y-auto">
                {isItemsLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="h-14">
                      <TableCell
                        colSpan={9}
                        className="h-14 animate-pulse bg-stone-50/40"
                      />
                    </TableRow>
                  ))
                ) : paginatedSoldProducts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="h-24 text-center text-stone-400"
                    >
                      Tidak ada produk yang cocok dengan filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSoldProducts.map((product: any, index: number) => {
                    const totalRevenue = Number(
                      summaryData?.summary.totalRevenue || 0,
                    );
                    const contribution =
                      totalRevenue > 0
                        ? (Number(product.revenue || 0) / totalRevenue) * 100
                        : 0;

                    return (
                      <TableRow key={`${product.code}-${index}`}>
                        <TableCell className="font-semibold text-stone-500">
                          {(currentPage - 1) * currentLimit + index + 1}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-stone-500">
                          {product.code}
                        </TableCell>
                        <TableCell className="font-mono text-[10px] text-stone-700 font-semibold">
                          {product.variantCode}
                        </TableCell>
                        <TableCell className="font-semibold text-stone-800">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-xs text-stone-500">
                          {product.color} - Size: {product.size}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {product.quantity}
                        </TableCell>
                        <TableCell className="text-right text-stone-600">
                          Rp{" "}
                          {Number(product.priceAtSale || 0).toLocaleString(
                            "id-ID",
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-stone-900">
                          Rp{" "}
                          {Number(product.revenue || 0).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right text-stone-500">
                          {contribution.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {itemsData && totalItems > 0 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              limit={currentLimit}
              onPageChange={setPage}
              onLimitChange={(nextLimit) => {
                setLimit(nextLimit);
                setPage(1);
              }}
              isLoading={isItemsLoading}
              label="produk"
            />
          )}
        </CardContent>
      </Card>

      <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-center">
        <p className="text-xs text-stone-400">
          Data laporan diambil dari transaksi dengan status{" "}
          <span className="text-stone-700 font-bold">PAID</span>. Transaksi{" "}
          <span className="text-red-600 font-bold">VOID</span> tidak dihitung
          dalam pendapatan.
        </p>
      </div>
    </div>
  );
}
