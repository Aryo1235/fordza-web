"use client";

import { useRef } from "react";
import { X, Printer, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

interface TransactionItem {
  id: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
  discountAmount: number;
}

interface Transaction {
  id: string;
  invoiceNo: string;
  totalPrice: number;
  amountPaid: number;
  change: number;
  status: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  kasir?: { name?: string; username: string };
  items: TransactionItem[];
}

interface InvoiceModalProps {
  transaction: Transaction;
  onClose: () => void;
}

function formatRp(amount: number) {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InvoiceModal({ transaction, onClose }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrintHardware = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ unit: "mm", format: [80, 200], orientation: "portrait" });

    let y = 10;
    const lineH = 6;
    const marginX = 5;
    const contentWidth = 70;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("FORDZA SHOP", 40, y, { align: "center" });
    y += lineH;

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Struk Pembelian", 40, y, { align: "center" });
    y += lineH * 0.8;
    doc.line(marginX, y, 75, y);
    y += lineH * 0.8;

    doc.setFontSize(7);
    doc.text(`No. Invoice : ${transaction.invoiceNo}`, marginX, y); y += lineH * 0.8;
    doc.text(`Tanggal    : ${formatDate(transaction.createdAt)}`, marginX, y); y += lineH * 0.8;
    doc.text(`Kasir      : ${transaction.kasir?.name || transaction.kasir?.username || "-"}`, marginX, y); y += lineH * 0.8;
    doc.line(marginX, y, 75, y); y += lineH * 0.8;

    // Items
    doc.setFont("helvetica", "bold");
    doc.text("Item", marginX, y);
    doc.text("Subtotal", 75, y, { align: "right" });
    y += lineH * 0.8;
    doc.setFont("helvetica", "normal");

    for (const item of (transaction.items || [])) {
      const name = doc.splitTextToSize(item.productName, contentWidth - 10);
      doc.text(name, marginX, y);
      y += name.length * (lineH * 0.7);
      doc.text(`${item.quantity} x ${formatRp(item.priceAtSale)}`, marginX, y);
      doc.text(formatRp(item.quantity * item.priceAtSale), 75, y, { align: "right" });
      y += lineH;
    }

    doc.line(marginX, y, 75, y); y += lineH * 0.8;
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", marginX, y);
    doc.text(formatRp(transaction.totalPrice), 75, y, { align: "right" });
    y += lineH * 0.8;
    doc.setFont("helvetica", "normal");
    doc.text("Bayar", marginX, y);
    doc.text(formatRp(transaction.amountPaid), 75, y, { align: "right" });
    y += lineH * 0.8;
    doc.setFont("helvetica", "bold");
    doc.text("Kembalian", marginX, y);
    doc.text(formatRp(transaction.change), 75, y, { align: "right" });
    y += lineH;
    doc.line(marginX, y, 75, y); y += lineH;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.text("Terima kasih telah berbelanja di Fordza!", 40, y, { align: "center" });

    doc.save(`${transaction.invoiceNo}.pdf`);
  };

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(#invoice-print-area) { display: none !important; }
          #invoice-print-area { display: block !important; position: fixed; top: 0; left: 0; width: 80mm; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Overlay */}
      <div className="no-print fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="bg-white w-80 rounded shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: "#3C3025" }}>
            <h2 className="text-white font-semibold text-sm">Transaksi Berhasil 🎉</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Struk Content */}
          <div id="invoice-print-area" ref={printRef}
            className="p-4 font-mono text-xs text-stone-800 bg-white"
          >
            <div className="text-center mb-3">
              <p className="font-bold text-sm">FORDZA SHOP</p>
              <p className="text-stone-500 text-xs">Struk Pembelian</p>
            </div>
            <div className="border-t border-dashed border-stone-300 pt-2 mb-2 space-y-0.5">
              <div className="flex justify-between">
                <span className="text-stone-500">No. Invoice</span>
                <span className="font-medium">{transaction.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tanggal</span>
                <span>{formatDate(transaction.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Kasir</span>
                <span>{transaction.kasir?.name || transaction.kasir?.username || "-"}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Pelanggan</span>
                  <span className="font-medium">{transaction.customerName}</span>
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-stone-300 pt-2 mb-2">
              {transaction.items?.map((item) => (
                <div key={item.id} className="mb-1.5">
                  <p className="font-medium truncate">{item.productName}</p>
                  <div className="flex justify-between text-stone-500">
                    <span>{item.quantity} x {formatRp(item.priceAtSale)}</span>
                    <span className="font-medium text-stone-700">{formatRp(item.quantity * item.priceAtSale)}</span>
                  </div>
                  {item.discountAmount > 0 && (
                    <div className="flex justify-between text-[10px] text-red-500 italic">
                      <span>Diskon</span>
                      <span>- {formatRp(item.discountAmount)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-stone-300 pt-2 space-y-0.5">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>{formatRp(transaction.totalPrice)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>Bayar</span>
                <span>{formatRp(transaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-700">
                <span>Kembalian</span>
                <span>{formatRp(transaction.change)}</span>
              </div>
            </div>

            <p className="text-center text-stone-400 mt-3 text-xs">
              Terima kasih telah berbelanja di Fordza!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="no-print p-3 border-t bg-stone-50 flex gap-2">
            <button
              onClick={handlePrintHardware}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white rounded-sm transition-colors"
              style={{ backgroundColor: "#3C3025" }}
            >
              <Printer className="w-4 h-4" />
              Cetak Hardware
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-sm transition-colors"
            >
              <FileText className="w-4 h-4" />
              Unduh PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
