"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Calendar as CalendarIcon,
  Printer,
  Eye,
  X,
  User,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  PanelLeft,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { toast } from "sonner";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";
import { useCashiers } from "@/features/admin/users";
import { useRouter } from "next/navigation";
import {
  InvoiceModal,
  VoidTransactionDialog,
  useKasirTransactions,
  type Transaction,
} from "@/features/kasir";
import { Pagination } from "@/components/shared/Pagination";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";

export default function RiwayatPage() {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState(todayStr);
  const [dateTo, setDateTo] = useState(todayStr);
  const [selectedKasirId, setSelectedKasirId] = useState("");
  const [txToVoid, setTxToVoid] = useState<{
    id: string;
    invoiceNo: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (formatType: "pdf" | "xlsx") => {
    const today = format(new Date(), "yyyy-MM-dd");
    if (dateFrom !== today || dateTo !== today) {
      toast.error("Maaf, Ekspor laporan kasir hanya diperbolehkan untuk HARI INI guna keamanan data.");
      return;
    }

    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        format: formatType,
        from: dateFrom,
        to: dateTo,
        kasirId: actualKasirId,
        source: "cashier",
      });

      const response = await fetch(`/api/admin/transactions/export?${queryParams}`);
      if (!response.ok) throw new Error("Gagal mengunduh laporan");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan_Transaksi_${formatType === "pdf" ? "Shift" : "Excel"}_${format(new Date(), "ddMMyyyy")}.${formatType === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`Berhasil mengunduh laporan ${formatType.toUpperCase()}`);
    } catch (error: any) {
      toast.error("Gagal mengekspor data");
    } finally {
      setIsExporting(false);
    }
  };

  // Debounce search agar tidak fetch setiap ketikan
  const debouncedSearch = useDebounce(search, 500);

  // Fetch data kasir untuk dropdown
  const { data: cashiersData } = useCashiers();
  const cashiers = cashiersData?.data || [];

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setSelectedKasirId("all-cashiers");
    setPage(1);
  };

  // Normalisasi selectedKasirId untuk query (kalau "all-cashiers" kirim string kosong)
  const actualKasirId =
    selectedKasirId === "all-cashiers" ? "" : selectedKasirId;

  const { data: transactionsData, isLoading: loading } = useKasirTransactions(
    page,
    limit,
    debouncedSearch,
    dateFrom,
    dateTo,
    actualKasirId,
  );

  const transactions: Transaction[] = transactionsData?.data || [];
  const meta = transactionsData?.meta;

  // Reset ke halaman 1 jika filter berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateFrom, dateTo, selectedKasirId]);

  return (
    <div className="p-4 md:p-6 w-full">
      <div className="flex items-start gap-4 mb-6">
        <SidebarTrigger className="-ml-2 text-stone-500 hover:bg-stone-200/50 mt-0.5 md:mt-0" />
        <div className="flex flex-col items-start">
          <h1 className="text-xl font-bold text-stone-800">
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-stone-500 mt-0.5">
            Daftar semua transaksi yang telah diproses
          </p>
        </div>

        <div className="flex gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("xlsx")}
            disabled={isExporting}
            className="h-10 border-stone-200 text-stone-600 hover:bg-stone-50 font-bold text-xs"
          >
            <FileText className="w-4 h-4 mr-2 text-emerald-600" />
            <span className="hidden sm:inline">Ekspor Excel</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleExport("pdf")}
            disabled={isExporting}
            className="h-10 bg-[#3C3025] hover:bg-[#5a4a38] text-white shadow-sm font-bold text-xs"
          >
            <Printer className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Cetak Laporan PDF</span>
          </Button>
        </div>
      </div>


      {/* Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-md p-4 mb-6  flex flex-wrap gap-4 items-end shadow-sm ">
        <div className="flex-1  space-y-1.5">
          <Label className="text-xs text-stone-500 font-medium">
            Cari No. Invoice
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nomor invoice..."
              className="pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
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
            date={dateFrom ? new Date(dateFrom) : undefined}
            setDate={(date) =>
              setDateFrom(date ? format(date, "yyyy-MM-dd") : "")
            }
            placeholder="Mulai"
            className="w-[140px]"
          />
        </div>

        <div className="space-y-1.5 flex flex-col">
          <Label className="text-xs text-stone-500 font-medium">
            Sampai Tanggal
          </Label>
          <DatePicker
            date={dateTo ? new Date(dateTo) : undefined}
            setDate={(date) =>
              setDateTo(date ? format(date, "yyyy-MM-dd") : "")
            }
            placeholder="Selesai"
            className="w-[140px]"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-stone-500 font-medium">
            Pilih Kasir
          </Label>
          <Select value={selectedKasirId} onValueChange={setSelectedKasirId}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Pilih Kasir" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-cashiers">Semua Kasir</SelectItem>
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

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-sm overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr
                className="border-b border-stone-200"
                style={{ backgroundColor: "#f5f0e8" }}
              >
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  No. Invoice
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  Tanggal
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  Kasir
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-stone-100">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-stone-200 animate-pulse rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-stone-400 text-sm"
                  >
                    Tidak ada transaksi ditemukan
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-stone-100 hover:bg-stone-50 transition-colors"
                  >
                    <td
                      className="px-4 py-3 font-mono font-semibold text-xs"
                      style={{ color: "#3C3025" }}
                    >
                      {tx.invoiceNo}
                    </td>
                    <td className="px-4 py-3 text-stone-600 text-xs">
                      {new Date(tx.createdAt).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-stone-600 text-xs">
                      {tx.kasir?.name || tx.kasir?.username || "-"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-800">
                      Rp {tx.totalPrice.toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-semibold ${tx.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                          }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => router.push(`/riwayat/${tx.id}`)}
                          className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-sm transition-colors"
                          title="Lihat & Cetak Struk"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {tx.status !== "VOID" && (
                          <button
                            onClick={() =>
                              setTxToVoid({
                                id: tx.id,
                                invoiceNo: tx.invoiceNo,
                              })
                            }
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                            title="Batalkan Transaksi (VOID)"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
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
            isLoading={loading}
            label="transaksi"
          />
        )}
      </div>

      {/* Void Transaction Dialog */}
      <VoidTransactionDialog
        isOpen={!!txToVoid}
        transactionId={txToVoid?.id || null}
        invoiceNo={txToVoid?.invoiceNo || null}
        onClose={() => setTxToVoid(null)}
      />
    </div>
  );
}
