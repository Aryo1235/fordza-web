"use client";

import Link from "next/link";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  ArrowLeft,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  Coins,
  CreditCard,
  QrCode,
  Wallet,
  Receipt,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { useShiftDetailAdmin } from "@/features/shifts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BreadcrumbsHeader } from "@/components/layout/admin/BreadcrumbsHeader";

interface ShiftDetailClientProps {
  id: string;
}

export function ShiftDetailClient({ id }: ShiftDetailClientProps) {
  const { data: shift, isLoading, error } = useShiftDetailAdmin(id);

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-14 w-full animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="space-y-4">
        <Link
          href="/dashboard/shifts"
          className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-stone-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar Laci
        </Link>
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6 text-center">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
            <h3 className="font-bold text-red-800 text-lg">Gagal Memuat Detail Shift</h3>
            <p className="text-red-600 text-sm mt-1">
              {error?.message || "Shift yang dicari tidak ditemukan atau terjadi kesalahan server."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isClosed = shift.status === "CLOSED";
  const expected = Number(shift.expectedEndingCash || 0);
  const actual = Number(shift.actualEndingCash || 0);
  const disparity = actual - expected;
  const totalSalesVolume = (shift.cashSales || 0) + (shift.debitSales || 0) + (shift.qrisSales || 0);

  return (
    <div className="space-y-6 flex flex-col">
      <BreadcrumbsHeader
        title={`Detail Shift: ${shift.admin?.name || "Kasir"}`}
        breadcrumbs={[
          { label: "Laporan Laci", href: "/dashboard/shifts" },
          { label: "Detail Shift" },
        ]}
        backUrl="/dashboard/shifts"
        action={
          <Badge
            variant="outline"
            className={
              isClosed
                ? "bg-stone-100 text-stone-700 border-stone-200 font-bold px-2 py-1"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold px-2 py-1"
            }
          >
            {isClosed ? "CLOSED (SELESAI)" : "OPEN (AKTIF)"}
          </Badge>
        }
        subtitle={
          <span className="text-xs text-stone-400 font-mono block mt-1">
            @{shift.admin?.username || shift.adminId}
          </span>
        }
      />

      {/* Info Waktu & Catatan */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <p className="text-xs font-bold text-stone-500 uppercase">Waktu Operasional</p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-stone-600">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-400" />
              <strong>Mulai:</strong> {format(new Date(shift.startTime), "dd MMMM yyyy HH:mm", { locale: localeId })}
            </span>
            {shift.endTime && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-400" />
                <strong>Selesai:</strong> {format(new Date(shift.endTime), "dd MMMM yyyy HH:mm", { locale: localeId })}
              </span>
            )}
          </div>
        </div>

        {shift.notes && (
          <div className="bg-stone-50 border border-stone-200 rounded-lg p-3 max-w-md w-full md:w-auto">
            <p className="text-[10px] uppercase font-bold text-stone-400">Catatan Kasir</p>
            <p className="text-xs text-stone-700 mt-0.5 italic">"{shift.notes}"</p>
          </div>
        )}
      </div>

      {/* Audit Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Card 1: Modal Awal */}
        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-stone-500 flex items-center justify-between">
              Modal Awal Laci
              <Coins className="h-4 w-4 text-stone-400" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-[#3C3025]">
              {formatIDR(shift.startingCash)}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              Uang receh pelumas operasional laci
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Expected Sales */}
        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-stone-500 flex items-center justify-between">
              Total Penjualan Tunai
              <Wallet className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-[#3C3025]">
              {formatIDR(shift.cashSales || 0)}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              Penjualan tunai yang masuk laci hari ini
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Expected Ending */}
        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-stone-500 flex items-center justify-between">
              Expected Ending
              <Activity className="h-4 w-4 text-[#8C6D58]" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-extrabold text-[#3C3025]">
              {formatIDR(expected)}
            </p>
            <p className="text-[10px] text-stone-400 mt-1">
              {isClosed ? "Total akhir laci (Sistem)" : "Estimasi laci saat ini (Real-time)"}
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Disparity / Audit Result */}
        <Card className="border border-stone-200 shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-stone-500 flex items-center justify-between">
              Laporan Fisik & Selisih
              <AlertTriangle
                className={`h-4 w-4 ${!isClosed ? "text-stone-400" : disparity < 0 ? "text-red-500" : disparity > 0 ? "text-orange-500" : "text-emerald-500"
                  }`}
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isClosed ? (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-extrabold text-[#3C3025]">{formatIDR(actual)}</p>
                </div>
                <div>
                  {disparity < 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                      MINUS: - {formatIDR(Math.abs(disparity))}
                    </span>
                  ) : disparity > 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                      LEBIH: + {formatIDR(disparity)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      PAS (BALANCE)
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="text-2xl font-extrabold text-stone-400">-</p>
                <p className="text-[10px] text-stone-400 mt-1">Shift kasir masih aktif/terbuka</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Payment Breakdown & Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 ">
        {/* Payment Methods Breakdown */}
        <div className="lg:col-span-1 space-y-6 ">
          <Card className="border border-stone-200 shadow-sm bg-white ">
            <CardHeader className="bg-stone-50 border-b border-stone-100 py-3.5 rounded-lg ">
              <CardTitle className="text-xs uppercase text-stone-500 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-stone-400" />
                Distribusi Metode Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              {/* Method 1: Cash */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-700">Tunai (CASH)</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Uang masuk laci fisik</p>
                  </div>
                </div>
                <div className="text-right">

                  <p className="text-sm font-black text-stone-800">{formatIDR(shift.cashSales || 0)}</p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {totalSalesVolume > 0
                      ? `${Math.round(((shift.cashSales || 0) / totalSalesVolume) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              </div>

              {/* Method 2: Debit */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-700">Kartu Debit</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Langsung ke mesin EDC</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-stone-800">{formatIDR(shift.debitSales || 0)}</p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {totalSalesVolume > 0
                      ? `${Math.round(((shift.debitSales || 0) / totalSalesVolume) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              </div>

              {/* Method 3: QRIS */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-200/50">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-purple-50 flex items-center justify-center">
                    <QrCode className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-stone-700">QRIS / E-Wallet</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Digital payment gateway</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-stone-800">{formatIDR(shift.qrisSales || 0)}</p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                    {totalSalesVolume > 0
                      ? `${Math.round(((shift.qrisSales || 0) / totalSalesVolume) * 100)}%`
                      : "0%"}
                  </p>
                </div>
              </div>

              {/* Total Omzet */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-bold text-stone-500 uppercase">Total Omzet Shift</span>
                <span className="text-base font-black text-[#8C6D58]">{formatIDR(totalSalesVolume)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="bg-stone-50 border-b border-stone-100 py-3.5 px-6 flex justify-between items-center">
              <p className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2">
                <Receipt className="w-4 h-4 text-stone-400" />
                Histori Transaksi Pada Shift Ini ({shift.transactions?.length || 0} Trx)
              </p>
            </div>

            {shift.transactions && shift.transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/50 text-[10px] font-bold text-stone-400 uppercase">
                      <th className="py-3 px-4">No. Invoice</th>
                      <th className="py-3 px-4">Waktu</th>
                      <th className="py-3 px-4">Pelanggan</th>
                      <th className="py-3 px-4">Metode</th>
                      <th className="py-3 px-4 text-right">Nilai Belanja</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-xs">
                    {shift.transactions.map((trx: any) => (
                      <tr key={trx.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-[#8C6D58] hover:underline">
                          <Link href={`/dashboard/transactions/${trx.id}`}>
                            {trx.invoiceNo}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4 text-stone-500">
                          {format(new Date(trx.createdAt), "HH:mm", { locale: localeId })}
                        </td>
                        <td className="py-3.5 px-4 text-stone-600">
                          {trx.customerName ? (
                            <div className="flex flex-col">
                              <span className="font-bold">{trx.customerName}</span>
                              <span className="text-[10px] text-stone-400">{trx.customerPhone || "-"}</span>
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Umum</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <Badge
                            variant="outline"
                            className={
                              trx.paymentMethod === "DEBIT"
                                ? "bg-blue-50 text-blue-700 border-blue-200 font-medium text-[9px]"
                                : trx.paymentMethod === "QRIS"
                                  ? "bg-purple-50 text-purple-700 border-purple-200 font-medium text-[9px]"
                                  : "bg-amber-50 text-amber-700 border-amber-200 font-medium text-[9px]"
                            }
                          >
                            {trx.paymentMethod || "CASH"}
                          </Badge>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-stone-700">
                          {formatIDR(trx.totalPrice)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <Badge
                            variant={trx.status === "VOID" ? "destructive" : "outline"}
                            className={
                              trx.status === "VOID"
                                ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-50 font-bold text-[9px]"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[9px]"
                            }
                          >
                            {trx.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-stone-400">
                <Receipt className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-sm font-medium">Belum ada transaksi di shift ini.</p>
                <p className="text-xs text-stone-400 mt-0.5">Penjualan akan muncul setelah kasir memproses struk POS.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
