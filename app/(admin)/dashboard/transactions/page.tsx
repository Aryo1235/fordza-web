"use client";

import { useTransactions } from "@/features/transactions";
import { PageHeader } from "@/components/layout/admin/PageHeader";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DatePicker } from "@/components/ui/date-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  History,
  Filter,
  ArrowRight,
  Eye,
  FileText,
  Printer,
  X,
  RotateCcw,
} from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { DataTable } from "@/components/shared/DataTable";
import { downloadFile } from "@/lib/download";
import { useCashiers } from "@/features/admin/users/hooks";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [selectedKasirId, setSelectedKasirId] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: cashiersData } = useCashiers();
  const cashiers = cashiersData?.data || [];

  const { data: transactionsData, isLoading } = useTransactions(
    dateFrom,
    dateTo,
    page,
    limit,
    search,
    selectedKasirId === "ALL" ? undefined : selectedKasirId,
  );

  const transactions = transactionsData?.data || [];
  const meta = transactionsData?.meta;

  const columns = [
    {
      header: "Invoice",
      cell: (tx: any) => (
        <span className="font-mono font-bold text-[#3C3025] group-hover:text-amber-800 transition-colors whitespace-nowrap italic uppercase">
          {tx.invoiceNo}
        </span>
      ),
      className: "px-6 py-4",
    },
    {
      header: "Waktu",
      cell: (tx: any) => (
        <span className="text-stone-500 text-xs whitespace-nowrap font-medium">
          {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")}
        </span>
      ),
      className: "px-6 py-4 whitespace-nowrap",
    },
    {
      header: "Kasir",
      cell: (tx: any) => (
        <span className="text-[#3C3025] font-bold whitespace-nowrap">
          {tx.cashier || tx.kasir?.name || "-"}
        </span>
      ),
      className: "px-6 py-4",
    },
    {
      header: "Pembayaran",
      cell: (tx: any) => (
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded-sm font-black text-[9px] uppercase tracking-wide border",
            tx.paymentMethod === "DEBIT"
              ? "bg-blue-50 text-blue-700 border-blue-200"
              : tx.paymentMethod === "QRIS"
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-stone-50 text-stone-600 border-stone-200"
          )}
        >
          {tx.paymentMethod || "CASH"}
        </span>
      ),
      className: "px-6 py-4",
    },
    {
      header: "Total",
      cell: (tx: any) => (
        <span className="font-black text-[#3C3025] whitespace-nowrap">
          Rp {tx.totalPrice.toLocaleString("id-ID")}
        </span>
      ),
      className: "text-right px-6 py-4",
    },
    {
      header: "Status",
      cell: (tx: any) => (
        <span
          className={cn(
            "inline-flex px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider",
            tx.status === "PAID"
              ? "bg-green-100 text-green-700 border border-green-200"
              : "bg-red-100 text-red-700 border border-red-200",
          )}
        >
          {tx.status}
        </span>
      ),
      className: "text-center px-6 py-4",
    },
    {
      header: "Keterangan",
      cell: (tx: any) =>
        tx.status === "VOID" ? (
          <div className="flex items-start gap-2 text-red-600/70 italic text-xs font-medium">
            <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
            {tx.cancelReason || "Tanpa alasan"}
          </div>
        ) : (
          <span className="text-stone-300">-</span>
        ),
      className: "px-6 py-4",
    },
    {
      header: "Aksi",
      cell: (tx: any) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-stone-400 hover:text-stone-900 transition-all hover:scale-110 active:scale-95"
          onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
        >
          <Eye className="w-4 h-4" />
        </Button>
      ),
      className: "text-right px-6 py-4",
    },
  ];

  const handleExportExcel = async () => {
    await downloadFile(
      "/api/admin/transactions/export",
      "Laporan_Transaksi_Fordza.xlsx",
      {
        from: format(dateFrom, "yyyy-MM-dd"),
        to: format(dateTo, "yyyy-MM-dd"),
        search,
        kasirId: selectedKasirId === "ALL" ? undefined : selectedKasirId,
        format: "xlsx",
      },
    );
  };

  const handleExportPDF = async () => {
    await downloadFile(
      "/api/admin/transactions/export",
      "Laporan_Transaksi_Fordza.pdf",
      {
        from: format(dateFrom, "yyyy-MM-dd"),
        to: format(dateTo, "yyyy-MM-dd"),
        search,
        kasirId: selectedKasirId === "ALL" ? undefined : selectedKasirId,
        format: "pdf",
      },
    );
  };

  const resetFilters = () => {
    setSearch("");
    setDateFrom(startOfMonth(new Date()));
    setDateTo(new Date());
    setSelectedKasirId("ALL");
    setPage(1);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <PageHeader
          title="Riwayat Transaksi"
          description="Pantau audit log seluruh transaksi masuk dan pembatalan (VOID)."
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs"
            onClick={handleExportExcel}
            disabled={isLoading || transactions.length === 0}
          >
            <FileText className="w-4 h-4 mr-2 text-emerald-600" />
            Ekspor Excel
          </Button>
          <Button
            variant="default"
            size="sm"
            className="h-10 bg-[#3C3025] hover:bg-[#5a4a38] text-white shadow-sm font-bold text-xs"
            onClick={handleExportPDF}
            disabled={isLoading || transactions.length === 0}
          >
            <Printer className="w-4 h-4 mr-2" />
            Cetak Laporan PDF
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-md p-4 mb-6 flex flex-wrap gap-4 items-end shadow-sm">
        <div className="flex-1 space-y-1.5">
          <Label className="text-xs text-stone-500 font-medium">
            Cari No. Invoice
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Ketik nomor invoice..."
              className="pl-10"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-1.5 flex flex-col">
          <Label className="text-xs text-stone-500 font-medium">
            Dari Tanggal
          </Label>
          <DatePicker
            date={dateFrom}
            setDate={(d) => {
              d && setDateFrom(d);
              setPage(1);
            }}
            placeholder="Mulai"
            className="w-[140px]"
          />
        </div>

        <div className="space-y-1.5 flex flex-col">
          <Label className="text-xs text-stone-500 font-medium">
            Sampai Tanggal
          </Label>
          <DatePicker
            date={dateTo}
            setDate={(d) => {
              d && setDateTo(d);
              setPage(1);
            }}
            placeholder="Selesai"
            className="w-[140px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-stone-500 font-medium">
            Pilih Kasir
          </Label>
          <Select value={selectedKasirId} onValueChange={(val) => { setSelectedKasirId(val); setPage(1); }}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Pilih Kasir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Kasir</SelectItem>
              {cashiers.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name || c.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="ml-auto text-stone-400 hover:text-red-500 hover:bg-red-50 gap-2 h-9"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </Button>
      </div>

      <Card className="border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-stone-50 border-b border-stone-100 flex flex-row items-center justify-between py-4">
          <CardTitle className="text-xs font-bold text-stone-500 flex items-center gap-2 uppercase tracking-tight">
            <History className="w-4 h-4" />
            Detail Audit Log ({meta?.total || 0} Total Transaksi)
          </CardTitle>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-stone-400">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> Paid
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-stone-400">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Void
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={transactions}
            isLoading={isLoading}
            meta={meta ? {
              currentPage: page,
              totalPage: meta.totalPages,
              totalItems: meta.total,
              limit: limit
            } : undefined}
            onPageChange={setPage}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(1);
            }}
            emptyMessage="Tidak ada data transaksi ditemukan."
            className="space-y-0 [&_.rounded-md.border]:border-none [&_.rounded-md.border]:shadow-none [&_.rounded-md.border]:rounded-none"
          />
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
          <Filter className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-amber-900">
            Catatan Audit Keamanan
          </h4>
          <p className="text-xs text-amber-800/80 leading-relaxed mt-1 font-medium">
            Halaman ini mencatat seluruh aktivitas transaksi secara permanen.
            Transaksi yang telah masuk tidak dapat dihapus demi integritas
            audit. Gunakan fitur filter tanggal atau ekspor ke PDF/Excel untuk
            pelaporan berkala.
          </p>
        </div>
      </div>
    </div>
  );
}
