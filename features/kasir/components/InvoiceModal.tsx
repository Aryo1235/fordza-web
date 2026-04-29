"use client";

import { useRef } from "react";
import { X, Printer, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

interface TransactionItem {
  id: string;
  productName: string;
  productCode?: string | null;
  quantity: number;
  priceAtSale: number;
  discountAmount: number;
  promoName?: string | null;
  comparisonPriceAtSale?: number | null;
  variantColor?: string | null;
  skuSize?: string | null;
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
      const netPrice = item.priceAtSale - item.discountAmount;
      const gimmick = item.comparisonPriceAtSale || item.priceAtSale;
      const hasGimmick = gimmick > netPrice;

      // 1. Nama Produk
      doc.setFont("helvetica", "bold");
      const name = doc.splitTextToSize(item.productName, contentWidth - 10);
      doc.text(name, marginX, y);
      y += name.length * (lineH * 0.6);
      
      // 2. Detail Varian, Ukuran & Kode (font lebih kecil)
      if (item.variantColor || item.skuSize || item.productCode) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        const code = item.productCode ? `[${item.productCode}] ` : "";
        const variantInfo = `${item.variantColor || ""}${item.variantColor && item.skuSize ? " | " : ""}${item.skuSize ? `Size: ${item.skuSize}` : ""}`;
        doc.text(code + variantInfo, marginX, y);
        y += lineH * 0.6;
        doc.setFontSize(7);
      }

      // 3. Harga Normal (Gimmick) - Jika Ada
      if (hasGimmick) {
        doc.setFontSize(6);
        doc.setTextColor(150);
        doc.text(`(Normal: ${formatRp(gimmick)})`, marginX, y);
        doc.setTextColor(0);
        doc.setFontSize(7);
        y += lineH * 0.6;
      }

      // 4. Qty & Harga Bayar
      doc.setFont("helvetica", "normal");
      doc.text(`${item.quantity} x ${formatRp(netPrice)}`, marginX, y);
      doc.text(formatRp(item.quantity * netPrice), 75, y, { align: "right" });
      y += lineH;
    }

    doc.line(marginX, y, 75, y); y += lineH * 0.8;
    
    // Summary
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL", marginX, y);
    doc.text(formatRp(transaction.totalPrice), 75, y, { align: "right" });
    y += lineH * 1.2; // Tambah space sedikit biar tidak menabrak TOTAL

    // Total Hemat (Total Selisih dari Gimmick)
    const totalSavings = (transaction.items || []).reduce((sum, item) => {
      const netPrice = item.priceAtSale - item.discountAmount;
      const gimmick = item.comparisonPriceAtSale || item.priceAtSale;
      return sum + ((gimmick - netPrice) * item.quantity);
    }, 0);

    if (totalSavings > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Total Hemat", marginX, y);
      doc.text(formatRp(totalSavings), 75, y, { align: "right" });
      y += lineH * 1.2; // Tambah space
    }

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
              {transaction.items?.map((item) => {
                  const netPrice = item.priceAtSale - item.discountAmount;
                  const gimmick = item.comparisonPriceAtSale || item.priceAtSale;
                  const hasGimmick = gimmick > netPrice;

                  return (
                    <div key={item.id} className="mb-2">
                      <p className="font-bold truncate">{item.productName}</p>
                      {(item.variantColor || item.skuSize || item.productCode) && (
                        <p className="text-[9px] text-stone-500 leading-none mb-1 font-mono uppercase">
                          {item.productCode && `[${item.productCode}] `}
                          {item.variantColor && `${item.variantColor}`}
                          {item.variantColor && item.skuSize && " | "}
                          {item.skuSize && `Size: ${item.skuSize}`}
                        </p>
                      )}
                      
                      {/* Tampilan Harga Normal (Gimmick) */}
                      {hasGimmick && (
                        <div className="flex justify-between text-[10px] text-stone-400 italic">
                          <span>Harga Normal</span>
                          <span className="line-through">{formatRp(gimmick)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-baseline text-stone-500">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span>{item.quantity} x </span>
                            <span className="font-bold text-stone-800">
                              {formatRp(netPrice)}
                            </span>
                          </div>
                          {item.promoName && (
                            <p className="text-[9px] text-red-600 font-bold uppercase tracking-tighter">
                               {item.promoName}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-stone-700">
                          {formatRp(item.quantity * netPrice)}
                        </span>
                      </div>
                    </div>
                  );
              })}
            </div>

            <div className="border-t border-dashed border-stone-300 pt-2 space-y-0.5">
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>{formatRp(transaction.totalPrice)}</span>
              </div>
              
              {/* Grand Saving Display (Gimmick based) */}
              {(() => {
                const totalSavings = (transaction.items || []).reduce((sum, item) => {
                  const netPrice = item.priceAtSale - item.discountAmount;
                  const gimmick = item.comparisonPriceAtSale || item.priceAtSale;
                  return sum + ((gimmick - netPrice) * item.quantity);
                }, 0);
                
                if (totalSavings > 0) {
                  return (
                    <div className="flex justify-between text-[11px] font-bold text-stone-600 border-t border-dashed pt-1 mt-1">
                      <span>Total Hemat</span>
                      <span>{formatRp(totalSavings)}</span>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="flex justify-between text-stone-500 px-2 pt-1 border-t border-dotted mt-1">
                <span className="text-[10px]">Bayar</span>
                <span className="text-[10px]">{formatRp(transaction.amountPaid)}</span>
              </div>
              <div className="flex justify-between font-bold text-green-700 px-2 pb-1">
                <span>Kembalian</span>
                <span>{formatRp(transaction.change)}</span>
              </div>
            </div>

            <p className="text-center text-stone-400 mt-3 text-[10px]">
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
