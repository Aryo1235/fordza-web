"use client";

import { useRef } from "react";
import { X, Printer, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

interface TransactionItem {
  id: string;
  productName: string;
  productCode?: string | null;
  quantity: number;
  basePriceAtSale: number;
  discountAmount: number;
  promoName?: string | null;
  gimmickPriceAtSale?: number | null;
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
  paymentMethod?: string;
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

function formatRp(amount: any) {
  const num = Number(amount || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
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
    const lineH = 5;
    const marginX = 4;
    const contentWidth = 72; // 80 - (2 * marginX)

    // Header
    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    doc.setTextColor(0); // Hitam Pekat
    doc.text("FORDZA SHOP", 40, y, { align: "center" });
    y += lineH;

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
    doc.text("Struk Pembelian", 40, y, { align: "center" });
    y += lineH * 0.8;
    
    // Gunakan garis putus-putus (dashed) agar sama seperti struk HTML
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(100, 100, 100); // Garis Abu-abu Gelap
    doc.line(marginX, y, 76, y);
    y += lineH * 0.8;

    // Metadata Invoice
    doc.setFontSize(7.5);
    doc.setFont("courier", "normal");
    doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
    doc.text("No. Invoice", marginX, y);
    doc.setFont("courier", "bold");
    doc.setTextColor(0); // Hitam Pekat
    doc.text(transaction.invoiceNo, 76, y, { align: "right" });
    y += lineH * 0.8;

    doc.setFont("courier", "normal");
    doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
    doc.text("Tanggal", marginX, y);
    doc.setTextColor(0); // Hitam Pekat
    doc.text(formatDate(transaction.createdAt), 76, y, { align: "right" });
    y += lineH * 0.8;

    doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
    doc.text("Kasir", marginX, y);
    doc.setTextColor(0); // Hitam Pekat
    doc.text(transaction.kasir?.name || transaction.kasir?.username || "-", 76, y, { align: "right" });
    y += lineH * 0.8;

    doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
    doc.text("Pembayaran", marginX, y);
    doc.setFont("courier", "bold");
    doc.setTextColor(0); // Hitam Pekat
    doc.text(transaction.paymentMethod || "CASH", 76, y, { align: "right" });
    y += lineH * 0.8;

    if (transaction.customerName) {
      doc.setFont("courier", "normal");
      doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
      doc.text("Pelanggan", marginX, y);
      doc.setTextColor(0); // Hitam Pekat
      doc.text(transaction.customerName, 76, y, { align: "right" });
      y += lineH * 0.8;
    }

    doc.line(marginX, y, 76, y); 
    y += lineH * 0.8;

    // Items
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
    doc.text("Item", marginX, y);
    doc.text("Subtotal", 76, y, { align: "right" });
    y += lineH * 0.8;

    for (const item of (transaction.items || [])) {
      const unitDiscount = item.quantity > 0 ? (item.discountAmount / item.quantity) : 0;
      const netPrice = item.basePriceAtSale - unitDiscount;
      const gimmick = item.gimmickPriceAtSale || item.basePriceAtSale;
      const hasGimmick = gimmick > netPrice;

      // 1. Nama Produk (Bold, Hitam Pekat)
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(0); // Hitam Pekat
      const name = doc.splitTextToSize(item.productName, contentWidth);
      doc.text(name, marginX, y);
      y += name.length * (lineH * 0.8);

      // 2. Detail Varian, Ukuran & Kode (font lebih kecil, Abu-abu Sangat Gelap)
      if (item.variantColor || item.skuSize || item.productCode) {
        doc.setFont("courier", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
        const code = item.productCode ? `[${item.productCode}] ` : "";
        const variantInfo = `${item.variantColor || ""}${item.variantColor && item.skuSize ? " | " : ""}${item.skuSize ? `Size: ${item.skuSize}` : ""}`;
        doc.text((code + variantInfo).toUpperCase(), marginX, y);
        y += lineH * 0.6;
      }

      // 3. Harga Normal (Gimmick) - Jika Ada (Abu-abu Sedang dengan line-through)
      if (hasGimmick) {
        doc.setFont("courier", "normal");
        doc.setFontSize(7);
        doc.setTextColor(115, 110, 105); // Abu-abu Sedang
        const gimmickText = `Harga Normal: ${formatRp(gimmick)}`;
        doc.text(gimmickText, marginX, y);
        const textWidth = doc.getTextWidth(gimmickText);
        doc.line(marginX, y - 0.8, marginX + textWidth, y - 0.8); // Coretan horizontal
        y += lineH * 0.6;
      }

      // 4. Qty & Harga Bayar
      doc.setFont("courier", "normal");
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
      doc.text(`${item.quantity} x `, marginX, y);
      
      const qtyWidth = doc.getTextWidth(`${item.quantity} x `);
      doc.setFont("courier", "bold");
      doc.setTextColor(0); // Hitam Pekat
      doc.text(formatRp(netPrice), marginX + qtyWidth, y);

      // Subtotal item (Bold, Hitam Pekat)
      doc.setTextColor(0); // Hitam Pekat
      doc.text(formatRp(item.quantity * netPrice), 76, y, { align: "right" });
      y += lineH * 0.8;

      // Promo Name jika ada (Bold, red-600)
      if (item.promoName) {
        doc.setFont("courier", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(220, 38, 38); // red-600
        doc.text(item.promoName.toUpperCase(), marginX, y);
        y += lineH * 0.6;
      }

      y += 1; // Spasi kecil antar item
    }

    doc.setFont("courier", "normal");
    doc.line(marginX, y, 76, y); 
    y += lineH * 0.8;

    // Summary
    doc.setFont("courier", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0); // Hitam Pekat
    doc.text("TOTAL", marginX, y);
    doc.text(formatRp(transaction.totalPrice), 76, y, { align: "right" });
    y += lineH;

    // Total Hemat (Total Selisih dari Gimmick)
    const totalSavings = (transaction.items || []).reduce((sum, item) => {
      const netPrice = item.basePriceAtSale - item.discountAmount;
      const gimmick = item.gimmickPriceAtSale || item.basePriceAtSale;
      return sum + ((gimmick - netPrice) * item.quantity);
    }, 0);

    if (totalSavings > 0) {
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
      doc.text("Total Hemat", marginX, y);
      doc.text(formatRp(totalSavings), 76, y, { align: "right" });
      y += lineH;
    }

    doc.setFont("courier", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40); // Abu-abu Sangat Gelap
    doc.text("Bayar", marginX + 2, y);
    doc.text(formatRp(transaction.amountPaid), 76 - 2, y, { align: "right" });
    y += lineH * 0.8;

    // Kembalian (Bold, green-700)
    doc.setFont("courier", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(21, 128, 61); // green-700
    doc.text("Kembalian", marginX + 2, y);
    doc.text(formatRp(transaction.change), 76 - 2, y, { align: "right" });
    y += lineH;

    doc.line(marginX, y, 76, y); 
    y += lineH;

    // Footer
    doc.setFont("courier", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(115, 110, 105); // Abu-abu Sedang
    doc.text("Terima kasih telah berbelanja di Fordza!", 40, y, { align: "center" });

    doc.save(`${transaction.invoiceNo}.pdf`);
  };

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          @page {
            size: 80mm 200mm;
            margin: 0 !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body {
            visibility: hidden !important;
          }
          #invoice-print-area { 
            display: block !important; 
            visibility: visible !important;
            position: fixed !important; 
            top: 0 !important; 
            left: 0 !important; 
            width: 100% !important; 
            max-width: 80mm !important;
            height: auto !important; 
            max-height: none !important; 
            overflow: visible !important; 
            box-sizing: border-box !important;
            padding: 2mm !important;
          }
          #invoice-print-area * {
            visibility: visible !important;
          }
          /* Pergelap warna abu-abu agar terbaca jelas saat dicetak fisik/thermal */
          #invoice-print-area .text-stone-500 {
            color: #4b5563 !important; /* gray-600 */
          }
          #invoice-print-area .text-stone-400 {
            color: #6b7280 !important; /* gray-500 */
          }
          #invoice-print-area .text-stone-600 {
            color: #374151 !important; /* gray-700 */
          }
          #invoice-print-area .border-stone-300 {
            border-color: #9ca3af !important; /* gray-400 */
          }
          #invoice-print-area .border-dotted {
            border-color: #9ca3af !important;
          }
          
          .print-overlay {
            position: static !important;
            background: transparent !important;
            padding: 0 !important;
            display: block !important;
          }
          .print-modal-wrapper {
            background: transparent !important;
            box-shadow: none !important;
            max-height: none !important;
            overflow: visible !important;
            width: auto !important;
            display: block !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Overlay */}
      <div className="print-overlay fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
        <div className="print-modal-wrapper bg-white w-80 rounded shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="no-print flex items-center justify-between px-4 py-3 border-b shrink-0" style={{ backgroundColor: "#3C3025" }}>
            <h2 className="text-white font-semibold text-sm">Transaksi Berhasil 🎉</h2>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Struk Content */}
          <div id="invoice-print-area" ref={printRef}
            className="p-4 font-mono text-xs text-stone-800 bg-white flex-1 overflow-y-auto min-h-0"
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
              <div className="flex justify-between">
                <span className="text-stone-500">Pembayaran</span>
                <span className="font-bold">{transaction.paymentMethod || "CASH"}</span>
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
                const unitDiscount = item.quantity > 0 ? (item.discountAmount / item.quantity) : 0;
                const netPrice = item.basePriceAtSale - unitDiscount;
                const gimmick = item.gimmickPriceAtSale || item.basePriceAtSale;
                const hasGimmick = gimmick > netPrice;

                return (
                  <div key={item.id} className="mb-2">
                    <p className="font-bold break-words">{item.productName}</p>
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
                  const netPrice = item.basePriceAtSale - item.discountAmount;
                  const gimmick = item.gimmickPriceAtSale || item.basePriceAtSale;
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
