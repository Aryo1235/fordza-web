"use client";

import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Printer, 
  X, 
  Clock, 
  User, 
  Package,
  Calendar,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useTransactionDetail } from "@/features/transactions";
import { InvoiceModal, VoidTransactionDialog } from "@/features/kasir";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function TransactionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [showInvoice, setShowInvoice] = useState(false);
  const [showVoidDialog, setShowVoidDialog] = useState(false);

  const { data: transaction, isLoading, error } = useTransactionDetail(id as string, false);

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4 animate-pulse">
        <div className="h-10 w-40 bg-stone-200 rounded" />
        <div className="h-64 w-full bg-stone-100 rounded-xl" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-stone-500">Gagal memuat detail transaksi.</p>
        <Button onClick={() => router.back()} variant="outline">Kembali</Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header / Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="w-fit text-stone-500 hover:text-stone-900 -ml-2 gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Riwayat Transaksi
        </Button>

        <div className="flex items-center gap-2">
          {transaction.status !== "VOID" && (
            <Button 
              variant="outline" 
              className="border-red-200 text-red-600 hover:bg-red-50 gap-2 font-bold text-xs uppercase"
              onClick={() => setShowVoidDialog(true)}
            >
              <X className="w-3.5 h-3.5" />
              Void Transaksi
            </Button>
          )}
          <Button 
            className="bg-stone-800 hover:bg-stone-900 text-white gap-2 font-bold text-xs uppercase"
            onClick={() => setShowInvoice(true)}
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Ulang Struk
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <Card className="border-stone-200 shadow-sm overflow-hidden">
        <CardHeader className={cn(
          "border-b py-6",
          transaction.status === "VOID" ? "bg-red-50" : "bg-stone-50"
        )}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-2 py-0.5 bg-white border border-stone-200 rounded">
                Invoice ID
              </span>
              <h1 className="text-2xl font-black text-stone-800 tracking-tight font-mono">
                {transaction.invoiceNo}
              </h1>
            </div>
            <div className="flex flex-col md:items-end">
              <span className={cn(
                "inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                transaction.status === "PAID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {transaction.status}
              </span>
              <div className="flex items-center gap-2 mt-2 text-stone-500 text-xs">
                <Clock className="w-3.5 h-3.5" />
                {format(new Date(transaction.createdAt), "dd MMMM yyyy HH:mm", { locale: localeId })}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-100 border-b border-stone-100">
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Kasir Melayani</p>
                  <p className="text-sm font-bold text-stone-800">{transaction.kasir?.name || transaction.kasir?.username}</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4 md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-stone-400">Total Belanja</p>
                  <p className="text-xl font-black text-stone-900">Rp {transaction.totalPrice.toLocaleString("id-ID")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              Daftar Barang ({transaction.items?.length || 0})
            </h3>
            
            <div className="border border-stone-100 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold text-stone-500 uppercase">Produk</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-stone-500 uppercase">Qty</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-stone-500 uppercase">Harga Satuan</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-stone-500 uppercase">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {transaction.items?.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-stone-800">{item.productName}</p>
                        <p className="text-[10px] font-mono text-stone-400 uppercase">{item.productCode}</p>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-stone-700">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-stone-600">
                        Rp {item.priceAtSale.toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-stone-900">
                        Rp {(item.quantity * item.priceAtSale).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50/50 border-t border-stone-100">
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-right text-stone-500 font-bold uppercase text-[10px]">Total Akhir</td>
                    <td className="px-4 py-4 text-right font-black text-stone-900 text-lg">
                      Rp {transaction.totalPrice.toLocaleString("id-ID")}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-stone-500 text-[10px]">Bayar</td>
                    <td className="px-4 py-2 text-right text-stone-600 font-bold text-sm">
                      Rp {transaction.amountPaid.toLocaleString("id-ID")}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-right text-stone-500 text-[10px]">Kembali</td>
                    <td className="px-4 py-2 text-right text-stone-600 font-bold text-sm">
                      Rp {transaction.change.toLocaleString("id-ID")}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {transaction.status === "VOID" && transaction.cancelReason && (
              <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-lg flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-800 uppercase tracking-widest">Alasan Pembatalan (VOID)</p>
                  <p className="text-sm text-red-700 italic mt-1 leading-relaxed">"{transaction.cancelReason}"</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Modal for Reprint */}
      {showInvoice && (
        <InvoiceModal
          transaction={transaction as any}
          onClose={() => setShowInvoice(false)}
        />
      )}

      {/* Void Dialog */}
      <VoidTransactionDialog
        isOpen={showVoidDialog}
        transactionId={transaction.id}
        invoiceNo={transaction.invoiceNo}
        onClose={() => setShowVoidDialog(false)}
      />
    </div>
  );
}
