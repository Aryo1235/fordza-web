import { NextRequest, NextResponse } from "next/server";
import { TransactionService } from "@/backend/services/transaction.service";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildFileName(baseName: string, extension: string) {
  return `${baseName}_${format(new Date(), "yyyyMMdd_HHmm")}.${extension}`;
}

function getTransactionExportParams(req: Request) {
  const { searchParams } = new URL(req.url);
  return {
    search: searchParams.get("search") || undefined,
    dateFrom: searchParams.get("from") || undefined,
    dateTo: searchParams.get("to") || undefined,
    format: (searchParams.get("format") || "excel").toLowerCase(),
  };
}

function toCurrency(value: number) {
  return `Rp ${Number(value || 0).toLocaleString("id-ID")}`;
}

export async function GET(req: NextRequest) {
  try {
    const { format: fileFormat, ...filters } = getTransactionExportParams(req);
    const transactions = await TransactionService.getExportAll(filters);

    if (fileFormat === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      const mainColor: [number, number, number] = [60, 48, 37]; // Fordza Brown

      // 1. Header Laporan Premium
      doc.setFontSize(18);
      doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text("LAPORAN RIWAYAT TRANSAKSI FORDZA", 14, 15);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      doc.text(`Periode Laporan: ${filters.dateFrom || "-"} s/d ${filters.dateTo || "-"}`, 14, 21);
      doc.text(`Dicetak pada: ${format(new Date(), "dd MMM yyyy, HH:mm")}`, 14, 25);

      // 2. Build Nested Table Body
      const pdfBody: any[] = [];
      
      transactions.forEach((tx: any) => {
        // --- Transaction Header Row ---
        pdfBody.push([
          {
            content: `INVOICE: ${tx.invoiceNo}  |  TANGGAL: ${format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm")}  |  KASIR: ${tx.kasir?.name || tx.kasir?.username || "-"}  |  PELANGGAN: ${tx.customerName || "-"} (${tx.customerPhone || "-"})`,
            colSpan: 8,
            styles: { 
              fillColor: mainColor, 
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'left',
              cellPadding: 3
            }
          }
        ]);

        // --- Item Rows ---
        (tx.items || []).forEach((item: any) => {
          const quantity = Number(item.quantity || 0);
          const price = Number(item.priceAtSale || 0);
          const discount = Number(item.discountAmount || 0);
          const subtotal = quantity * price - discount;

          pdfBody.push([
            item.productCode || "-",
            { content: item.productName || "-", styles: { fontStyle: 'bold' } },
            item.variantColor || "-",
            item.skuSize || "-",
            { content: quantity.toString(), styles: { halign: 'center' } },
            { content: toCurrency(price), styles: { halign: 'right' } },
            { content: discount > 0 ? `-${toCurrency(discount)}` : "-", styles: { halign: 'right', textColor: [200, 0, 0] } },
            { content: toCurrency(subtotal), styles: { halign: 'right', fontStyle: 'bold' } }
          ]);
        });

        // --- Transaction Footer Row (Sub-Summary) ---
        pdfBody.push([
          {
            content: `STATUS: ${tx.status}  |  ALASAN VOID: ${tx.cancelReason || "-"}`,
            colSpan: 5,
            styles: { fontSize: 7, textColor: tx.status === 'VOID' ? [200, 0, 0] : [100, 100, 100], fontStyle: 'italic' }
          },
          {
            content: "TOTAL TRANS.",
            styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, fillColor: [245, 245, 245] }
          },
          {
            content: toCurrency(tx.totalPrice),
            colSpan: 2,
            styles: { halign: 'right', fontStyle: 'bold', fontSize: 9, fillColor: [245, 245, 245] }
          }
        ]);

        // Empty spacer row
        pdfBody.push([{ content: "", colSpan: 8, styles: { cellPadding: 1, fillColor: [255, 255, 255] } }]);
      });

      autoTable(doc, {
        startY: 32,
        head: [
          ["Kode SKU", "Nama Produk", "Warna", "Ukuran", "Qty", "Harga Satuan", "Diskon", "Subtotal"]
        ],
        body: pdfBody,
        theme: "plain",
        headStyles: { 
          fillColor: [255, 255, 255],
          textColor: [120, 120, 120],
          fontSize: 8,
          fontStyle: "bold",
          halign: 'center',
          lineColor: [220, 220, 220],
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25 },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 30, halign: 'right' },
          6: { cellWidth: 30, halign: 'right' },
          7: { cellWidth: 35, halign: 'right' }
        },
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle', lineColor: [240, 240, 240], lineWidth: 0.1 },
        margin: { bottom: 35 },
        didDrawPage: (data) => {
          const str = "Halaman " + (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(str, data.settings.margin.left, doc.internal.pageSize.height - 10);
        }
      });

      // 3. Signature Area
      let finalY = (doc as any).lastAutoTable.finalY + 15;
      const pageHeight = doc.internal.pageSize.height;

      if (finalY + 40 > pageHeight) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(9);
      doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
      const startX = 14;
      const sigW = 60;
      const gap = 30;

      // Dinamis berdasarkan source (Admin vs Kasir)
      const isFromCashier = req.nextUrl.searchParams.get("source") === "cashier";
      const preparerLabel = isFromCashier ? "( Kasir Bertugas )" : "( Admin / Finance )";
      const preparerTitle = isFromCashier ? "Dibuat Oleh," : "Diperiksa Oleh,";

      doc.text(preparerTitle, startX, finalY);
      doc.line(startX, finalY + 20, startX + sigW, finalY + 20);
      doc.text(preparerLabel, startX, finalY + 25);

      doc.text("Disetujui Oleh,", startX + sigW + gap, finalY);
      doc.line(startX + sigW + gap, finalY + 20, startX + sigW * 2 + gap, finalY + 20);
      doc.text("( Manager / Owner )", startX + sigW + gap, finalY + 25);

      const pdfBuffer = new Uint8Array(doc.output("arraybuffer"));
      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Transaksi_Fordza", "pdf")}"`,
        },
      });
    }

    const summaryRows = transactions.map((tx) => ({
      "No. Invoice": tx.invoiceNo,
      Tanggal: format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm"),
      Kasir: tx.kasir?.name || tx.kasir?.username || "-",
      Customer: tx.customerName || "-",
      "No. Customer": tx.customerPhone || "-",
      Total: Number(tx.totalPrice),
      Bayar: Number(tx.amountPaid),
      Kembali: Number(tx.change),
      Status: tx.status,
      "Alasan Void": tx.cancelReason || "-",
    }));

    const detailRows = transactions.flatMap((tx) =>
      (tx.items || []).map((item: any) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.priceAtSale || 0);
        const discount = Number(item.discountAmount || 0);

        return {
          "No. Invoice": tx.invoiceNo,
          Tanggal: format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm"),
          Kasir: tx.kasir?.name || tx.kasir?.username || "-",
          "Kode Produk": item.productCode || "-",
          "Nama Produk": item.productName || "-",
          Warna: item.variantColor || "-",
          Ukuran: item.skuSize || "-",
          Qty: quantity,
          "Harga Satuan": price,
          Diskon: discount,
          Subtotal: quantity * price - discount,
        };
      }),
    );

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    const detailSheet = XLSX.utils.json_to_sheet(
      detailRows.length > 0 ? detailRows : [{ Info: "Tidak ada detail item" }],
    );
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Transaksi");
    XLSX.utils.book_append_sheet(workbook, detailSheet, "Detail Item");

    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${buildFileName("Laporan_Transaksi_Fordza", "xlsx")}"`,
      },
    });
  } catch (error: any) {
    console.error("GET /api/admin/transactions/export error:", error.message);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor transaksi" },
      { status: 500 },
    );
  }
}
