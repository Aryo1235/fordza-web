"use client";

import { useTransactions } from "@/features/kasir/transactions";
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
} from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Pagination } from "@/components/shared/Pagination";
import { downloadFile } from "@/lib/download";

export default function AdminTransactionsPage() {
  const router = useRouter();
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(new Date()));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data: transactionsData, isLoading } = useTransactions(
    dateFrom,
    dateTo,
    page,
    limit,
    search,
  );

  const transactions = transactionsData?.data || [];
  const meta = transactionsData?.meta;

  const handleExportExcel = async () => {
    await downloadFile(
      "/api/admin/transactions/export",
      "Laporan_Transaksi_Fordza.xlsx",
      {
        from: format(dateFrom, "yyyy-MM-dd"),
        to: format(dateTo, "yyyy-MM-dd"),
        search,
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
        format: "pdf",
      },
    );
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-stone-200 shadow-sm font-medium">
        <div className="md:col-span-2 space-y-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Cari Invoice
          </p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder="Ketik nomor invoice..."
              className="pl-10 h-10 border-stone-200 focus:ring-stone-200"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Dari Tanggal
          </p>
          <DatePicker
            date={dateFrom}
            setDate={(d) => {
              d && setDateFrom(d);
              setPage(1);
            }}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            Sampai Tanggal
          </p>
          <DatePicker
            date={dateTo}
            setDate={(d) => {
              d && setDateTo(d);
              setPage(1);
            }}
          />
        </div>
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50/50">
                <tr className="border-b border-stone-100">
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">
                    Invoice
                  </th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">
                    Waktu
                  </th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">
                    Kasir
                  </th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">
                    Total
                  </th>
                  <th className="text-center px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">
                    Keterangan
                  </th>
                  <th className="text-right px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {isLoading ? (
                  Array.from({ length: limit }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td
                        colSpan={7}
                        className="px-6 py-4 h-12 bg-stone-50/30"
                      />
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-16 text-center text-stone-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <History className="w-8 h-8 opacity-20" />
                        <p className="text-sm font-medium">
                          Tidak ada data transaksi ditemukan.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx: any) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-stone-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-bold text-stone-900 group-hover:text-amber-800 transition-colors italic uppercase">
                          {tx.invoiceNo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-500 text-xs whitespace-nowrap font-medium">
                        {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")}
                      </td>
                      <td className="px-6 py-4 text-stone-700 font-bold">
                        {tx.cashier || tx.kasir?.name || "-"}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-stone-900">
                        Rp {tx.totalPrice.toLocaleString("id-ID")}
                      </td>
                      <td className="px-6 py-4 text-center">
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
                      </td>
                      <td className="px-6 py-4">
                        {tx.status === "VOID" ? (
                          <div className="flex items-start gap-2 text-red-600/70 italic text-xs font-medium">
                            <ArrowRight className="w-3 h-3 mt-0.5 shrink-0" />
                            {tx.cancelReason || "Tanpa alasan"}
                          </div>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-400 hover:text-stone-900 transition-all hover:scale-110 active:scale-95"
                          onClick={() =>
                            router.push(`/dashboard/transactions/${tx.id}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {meta && (
            <Pagination
              page={page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
              isLoading={isLoading}
              label="transaksi"
            />
          )}
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
