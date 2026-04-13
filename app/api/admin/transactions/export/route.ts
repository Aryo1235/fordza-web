import { NextResponse } from "next/server";
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

export async function GET(req: Request) {
  try {
    const { format: fileFormat, ...filters } = getTransactionExportParams(req);
    const transactions = await TransactionService.getExportAll(filters);

    if (fileFormat === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });

      doc.setFontSize(16);
      doc.text("Laporan Transaksi Fordza", 14, 16);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Dicetak pada: ${format(new Date(), "dd MMM yyyy, HH:mm")}`,
        14,
        22,
      );

      autoTable(doc, {
        startY: 28,
        head: [
          [
            "Invoice",
            "Tanggal",
            "Kasir",
            "Customer",
            "Total",
            "Status",
            "Alasan Void",
          ],
        ],
        body: transactions.map((tx) => [
          tx.invoiceNo,
          format(new Date(tx.createdAt), "dd/MM/yyyy HH:mm"),
          tx.kasir?.name || tx.kasir?.username || "-",
          tx.customerName || "-",
          toCurrency(tx.totalPrice),
          tx.status,
          tx.cancelReason || "-",
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 48, 37] },
      });

      doc.addPage();
      doc.setFontSize(14);
      doc.text("Detail Item Transaksi", 14, 16);

      autoTable(doc, {
        startY: 22,
        head: [
          ["Invoice", "Kode", "Produk", "Qty", "Harga", "Diskon", "Subtotal"],
        ],
        body: transactions.flatMap((tx) =>
          (tx.items || []).map((item: any) => {
            const quantity = Number(item.quantity || 0);
            const price = Number(item.priceAtSale || 0);
            const discount = Number(item.discountAmount || 0);

            return [
              tx.invoiceNo,
              item.productCode || "-",
              item.productName || "-",
              quantity,
              toCurrency(price),
              toCurrency(discount),
              toCurrency(quantity * price - discount),
            ];
          }),
        ),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [80, 70, 60] },
      });

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
