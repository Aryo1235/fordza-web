"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Printer, 
  Clock, 
  User, 
  Package,
  AlertCircle,
  FileText,
  BadgeCheck,
  Ban
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useTransactionDetail } from "@/features/kasir/transactions";
import { InvoiceModal } from "@/features/kasir";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/admin/PageHeader";

export default function AdminTransactionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [showInvoice, setShowInvoice] = useState(false);

  const { data: transaction, isLoading, error } = useTransactionDetail(id as string, true);

  if (isLoading) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-stone-200 rounded" />
        <div className="h-96 w-full bg-stone-100 rounded-xl" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-stone-500 font-medium">Gagal memuat detail audit transaksi.</p>
        <Button onClick={() => router.back()} variant="outline" className="border-stone-200">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Riwayat
        </Button>
      </div>
    );
  }

  const isVoid = transaction.status === "VOID";

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative overflow-hidden">
        {/* Background Accent */}
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10",
          isVoid ? "bg-red-500" : "bg-green-500"
        )} />

        <div className="space-y-4 relative z-10">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest"
          >
            <ArrowLeft className="w-3 h-3" /> Kembali ke Audit Log
          </button>
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-stone-900 tracking-tighter font-mono italic">
                {transaction.invoiceNo}
              </h1>
              <span className={cn(
                "inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                isVoid ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700 border border-green-200"
              )}>
                {isVoid ? <Ban className="w-3 h-3 mr-1" /> : <BadgeCheck className="w-3 h-3 mr-1" />}
                {transaction.status}
              </span>
            </div>
            <p className="text-stone-500 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Transaksi pada {format(new Date(transaction.createdAt), "dd MMMM yyyy, HH:mm:ss", { locale: localeId })}
            </p>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <Button 
            className="bg-stone-900 hover:bg-stone-800 text-white gap-2 font-bold text-xs uppercase h-11 px-6 shadow-lg shadow-stone-200"
            onClick={() => setShowInvoice(true)}
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detail Info Panels */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="border-stone-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-stone-50/50 border-b border-stone-100">
              <CardTitle className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-4 h-4" />
                Rincian Barang Terjual
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-stone-50/30">
                    <tr>
                      <th className="text-left px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">Produk</th>
                      <th className="text-center px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">Qty</th>
                      <th className="text-right px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">Harga</th>
                      <th className="text-right px-6 py-4 text-[10px] font-bold text-stone-400 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {transaction.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-stone-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-stone-800 group-hover:text-stone-900 leading-tight">{item.productName}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded-sm font-bold uppercase tracking-wider border border-stone-200">
                              {item.variantColor || "Tanpa Varian"}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded-sm font-bold uppercase tracking-wider border border-amber-100">
                              Size: {item.skuSize || "-"}
                            </span>
                            <span className="text-[9px] font-mono text-stone-400 uppercase">
                              {item.productCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-stone-100 text-xs font-bold text-stone-600">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-stone-500 font-medium">
                          Rp {item.priceAtSale.toLocaleString("id-ID")}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-stone-900">
                          Rp {(item.quantity * item.priceAtSale).toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-stone-50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
                    <tr>
                      <td colSpan={3} className="px-6 py-6 text-right text-stone-400 font-bold uppercase text-[10px] tracking-widest">Total Transaksi</td>
                      <td className="px-6 py-6 text-right font-black text-stone-900 text-2xl">
                        Rp {transaction.totalPrice.toLocaleString("id-ID")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {isVoid && (
            <div className="p-6 bg-red-50 border border-red-200 rounded-2xl flex gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-red-900 uppercase tracking-widest italic flex items-center gap-2">
                  Detail Pembatalan (VOID)
                </h4>
                <p className="text-sm text-red-800/80 leading-relaxed font-medium">
                  "{transaction.cancelReason || "Tidak ada alasan spesifik yang dicatat."}"
                </p>
                <div className="pt-2 flex items-center gap-2 text-[10px] font-bold text-red-400 uppercase">
                  <User className="w-3 h-3" />
                  Dibatalkan oleh: {transaction.operator?.name || "Sistem"}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Detail Pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-stone-50 text-sm">
                <span className="text-stone-500">Metode</span>
                <span className="font-bold text-stone-800 uppercase italic">Tunai</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-stone-50 text-sm">
                <span className="text-stone-500">Diterima</span>
                <span className="font-bold text-stone-800">Rp {transaction.amountPaid.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center py-2 text-sm bg-stone-50 px-3 -mx-3 rounded-lg">
                <span className="text-stone-500">Kembalian</span>
                <span className="font-black text-stone-900">Rp {transaction.change.toLocaleString("id-ID")}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Audit Kasir</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center border-2 border-white shadow-sm">
                  <User className="w-6 h-6 text-stone-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-stone-900">{transaction.kasir?.name || transaction.kasir?.username}</p>
                  <p className="text-[10px] text-stone-400 font-medium uppercase tracking-tight">Kasir Bertugas</p>
                </div>
              </div>
              <p className="text-[10px] text-stone-500 leading-relaxed italic border-t border-stone-50 pt-4 px-1">
                *Data ini dicatat secara permanen pada log audit demi keamanan finansial outlet Fordza.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {showInvoice && (
        <InvoiceModal
          transaction={transaction as any}
          onClose={() => setShowInvoice(false)}
        />
      )}
    </div>
  );
}
